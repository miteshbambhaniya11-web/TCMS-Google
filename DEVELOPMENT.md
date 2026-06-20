# Development Spec & Deployment Blueprint - TCMS

This blueprint outlines the production deployment architectures, database seeding checklist, subscription webhooks, automated test validation scripts, and future marketplace design specifications.

---

## 1. Deployment Checklist & Environment Specs

The Transport Contractor Management System (TCMS) is built as a multi-tenant SaaS application using Next.js 14+ (App Router), Tailwind CSS, Recharts, Leaflet, and a relational PostgreSQL database.

### Core Stack Requirements
* **Hosting**: Vercel (Front-end & Serverless API Routes) or Docker-based AWS ECS cluster.
* **Database**: Supabase PostgreSQL (utilizing Row Level Security policies).
* **Cache Layer**: Redis (for rapid GPS telemetry coordinates aggregation).
* **SMS/WhatsApp Gateway**: Meta Cloud API or Twilio API.
* **Fastag & GPS API**: Vahan National Registry APIs & third-party GPS tracking vendors (e.g., GPSGate, Wialon).

### Production Environment Variables (`.env.production`)
```bash
# App Settings
NEXT_PUBLIC_APP_URL=https://app.tcms-contractor.in
NEXT_PUBLIC_ENVIRONMENT=production

# Supabase Relational Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WhatsApp Meta API Gateway
WHATSAPP_API_TOKEN=eaagxx...
WHATSAPP_PHONE_NUMBER_ID=1092...

# GPS Telemetry Endpoint Encryption Key
TELEMETRY_WEBHOOK_SECRET=sec_telemetry_99018...
```

---

## 2. Webhook Subscription Structures

TCMS implements webhook endpoints to handle asynchronous messages from external systems: driver WhatsApp replies, GPS tracking feeds, and Fastag toll payments.

### A. Driver WhatsApp Bot Reply Webhook
* **Endpoint**: `/api/webhooks/whatsapp`
* **Method**: `POST`
* **Description**: Receives driver message updates (e.g. Weighbridge weight slips, POD uploads, cash advance requests).

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "10091823901",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "918888888888",
              "phone_number_id": "10920"
            },
            "contacts": [
              {
                "profile": { "name": "Rajesh Kumar" },
                "wa_id": "919876543210"
              }
            ],
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.HBgLOT...",
                "timestamp": "1773043210",
                "text": { "body": "STATUS TRIP-2026-00001 DISPATCHED" },
                "type": "text"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### B. GPS Live Telemetry coordinates
* **Endpoint**: `/api/webhooks/gps`
* **Method**: `POST`
* **Description**: Receives coordinates updates from hardware trackers. Triggers geofencing entry/exit logs.

```json
{
  "device_id": "GPS-GJ12BY4567",
  "truck_number": "GJ-12-BY-4567",
  "latitude": 23.00312,
  "longitude": 70.81245,
  "speed_kmh": 52.4,
  "heading": 180,
  "timestamp": "2026-06-19T08:00:00.000Z"
}
```

---

## 3. Core Validation & Test Cases

The following test suites must be validated before production releases.

### Test Suite A: Row Level Security (RLS) & Multi-Tenant Isolation
* **Objective**: Confirm Nirma client users cannot view Adani Salt Corp trips or contractor payout schedules.
* **Test Script (SQL)**:
```sql
-- Step 1: Simulate connection as Vipul Shah (Adani Salt - tenant-1)
SET app.current_tenant_id = 'tenant-1-uuid-here';
SET app.current_user_email = 'adani.admin@tcms.com';

-- Step 2: Query trips. Should return only ASC-* prefix rows.
SELECT trip_number, pickup, destination FROM trips;
-- Expect: 3 rows (ASC-2026-00001, ASC-2026-00002, ASC-2026-00003)

-- Step 3: Attempt to inject a trip under MLI (Maruti Logistics - tenant-2)
INSERT INTO trips (tenant_id, trip_number, pickup, destination, quantity, rate, amount)
VALUES ('tenant-2-uuid-here', 'MLI-26-9999', 'Morbi', 'Sanand', 30, 800, 24000);
-- Expect: ERROR: new row violates row-level security policy for table "trips"
```

### Test Suite B: Port Logistics Detention Charges Calculator
* **Objective**: Enforce ₹2,000/day detention fee for port containers exceeding the 48-hour free-time threshold.
* **Test Case Scenarios**:
  1. **Scenario 1**: Gate In: `2026-06-19 08:00`, Gate Out: `2026-06-20 12:00` (Total = 28 hours). Expected Detention Charges: **₹0** (within 48 hours).
  2. **Scenario 2**: Gate In: `2026-06-19 08:00`, Gate Out: `2026-06-21 10:00` (Total = 50 hours). Exceeds by 2 hours. Expected Detention Charges: **₹2,000** (exceeded by 1 day or part thereof).
  3. **Scenario 3**: Gate In: `2026-06-19 08:00`, Gate Out: `2026-06-22 10:00` (Total = 74 hours). Exceeds by 26 hours. Expected Detention Charges: **₹4,000** (exceeded by 2 days).

### Test Suite C: Empty Return Opportunity Matcher
* **Objective**: Match completed delivery destinations with active marketplace load pickups to minimize empty runs.
* **Test Case Scenario**:
  - Trip `trip-1` unloads at `Sanand GIDC, Ahmedabad`.
  - Shippers list a load `load-101` picking up from `Sanand GIDC` going back to `Mundra Port`.
  - AI engine flags a **92% match** and details savings of ₹18,000 (displacing empty fuel expenses).

---

## 4. Future Marketplace Design Specifications

The TCMS marketplace module connects salt exporters, mining agencies, and bulk cargo shippers with transport contractors and fleet brokers.

### Architecture Workflow Diagram (Mermaid)

```mermaid
graph TD
    A[Salt Exporter / Shipper] -->|Post Load Requirements| B(TCMS Shared Marketplace)
    B -->|AI Route Matching| C[Transport Contractors]
    C -->|Bids Rate Quote| B
    B -->|Accept Quote| A
    C -->|Assigns Hired Fleet| D[Attached Contractors / Drivers]
    D -->|Executes Trip via WhatsApp Bot| E[GPS Live Telemetry & POD]
```

### Database Tables (Proposed Extensions)
1. **marketplace_loads**:
   - `id` UUID PRIMARY KEY
   - `shipper_id` UUID REFERENCES tenants(id)
   - `pickup_location` VARCHAR NOT NULL
   - `delivery_location` VARCHAR NOT NULL
   - `material_type` VARCHAR NOT NULL
   - `weight_tons` NUMERIC NOT NULL
   - `target_rate` NUMERIC
   - `status` VARCHAR ('Open', 'Bidded', 'Assigned', 'Completed')
2. **marketplace_bids**:
   - `id` UUID PRIMARY KEY
   - `load_id` UUID REFERENCES marketplace_loads(id)
   - `contractor_id` UUID REFERENCES tenants(id)
   - `bid_rate` NUMERIC NOT NULL
   - `remarks` TEXT
   - `status` VARCHAR ('Pending', 'Accepted', 'Rejected')
