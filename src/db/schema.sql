-- PostgreSQL Relational Schema for TCMS (Transport Contractor Management System)
-- Enforces Multi-Tenant Isolation using Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    logo_url VARCHAR(500),
    contact_person VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    primary_color VARCHAR(7) DEFAULT '#0284c7',
    custom_workflow TEXT[] DEFAULT ARRAY['Pending', 'Approved', 'Assigned', 'Accepted', 'Loading', 'Dispatched', 'In Transit', 'Reached Destination', 'Unloading', 'Delivered', 'Completed', 'Cancelled'],
    number_series JSONB NOT NULL DEFAULT '{"challanPrefix": "CH-", "invoicePrefix": "INV-", "nextChallanNo": 1000, "nextInvoiceNo": 1000}',
    whatsapp_settings JSONB DEFAULT '{"provider": "Meta Cloud API", "apiKey": "", "number": ""}',
    gps_settings JSONB DEFAULT '{"autoUpdate": true, "intervalSeconds": 30}',
    ai_settings JSONB DEFAULT '{"delayThresholdMinutes": 45, "fuelVariancePercent": 8, "routeDeviationMeters": 500}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Handles RBAC Roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Nullable for Super Admin
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    role VARCHAR(50) NOT NULL CONSTRAINT chk_user_role CHECK (role IN ('Super Admin', 'Company Admin', 'Operator', 'Finance User', 'Customer User')),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CONSTRAINT chk_user_status CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Contractors Table (Hired Fleet Supplier details)
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    alt_mobile VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    aadhaar_number VARCHAR(12),
    bank_name VARCHAR(150),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(11),
    upi_id VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CONSTRAINT chk_contractor_status CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Drivers Table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    alt_mobile VARCHAR(15),
    whatsapp_number VARCHAR(15),
    license_number VARCHAR(50) NOT NULL,
    license_expiry DATE NOT NULL,
    aadhaar_number VARCHAR(12),
    address TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    emergency_contact VARCHAR(15),
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CONSTRAINT chk_driver_status CHECK (status IN ('Active', 'On Trip', 'Suspended', 'Inactive')),
    wallet_balance NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Trucks Table (Fleet Management)
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    truck_number VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL CONSTRAINT chk_truck_type CHECK (type IN ('Dumper', 'Tipper', 'Taurus', 'Trailer', 'Container')),
    capacity NUMERIC(6,2) NOT NULL, -- Tons
    owner_name VARCHAR(255),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
    gps_enabled BOOLEAN DEFAULT TRUE,
    insurance_expiry DATE,
    permit_expiry DATE,
    fitness_expiry DATE,
    puc_expiry DATE,
    fastag_balance NUMERIC(12,2) DEFAULT 0.00,
    tyres_count INTEGER DEFAULT 10,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CONSTRAINT chk_truck_status CHECK (status IN ('Available', 'On Trip', 'Maintenance', 'Breakdown')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_truck_number UNIQUE (tenant_id, truck_number)
);

-- 6. Routes Table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    pickup VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance_km NUMERIC(8,2) NOT NULL,
    duration_hours NUMERIC(5,2),
    expected_fuel NUMERIC(8,2), -- Litres
    standard_rate NUMERIC(12,2), -- per Ton
    toll_charges NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Trips Table (Core Operations + Salt Weighbridge + GPS tracking + Port Logistics Container tracking)
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trip_number VARCHAR(100) NOT NULL,
    contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    pickup VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    material VARCHAR(150),
    quantity NUMERIC(8,2) NOT NULL, -- Tons loaded
    rate NUMERIC(12,2) NOT NULL, -- rate per ton
    amount NUMERIC(15,2) NOT NULL, -- total freight
    status VARCHAR(100) NOT NULL DEFAULT 'Pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium' CONSTRAINT chk_trip_priority CHECK (priority IN ('Low', 'Medium', 'High')),
    notes TEXT,
    
    -- Salt Weighbridge Slip Module fields
    weighbridge_slip_no VARCHAR(100),
    gross_weight NUMERIC(8,2),
    tare_weight NUMERIC(8,2),
    net_weight NUMERIC(8,2),
    moisture_percent NUMERIC(5,2),
    quality_grade VARCHAR(50),
    weighbridge_operator VARCHAR(100),
    weighbridge_date TIMESTAMP WITH TIME ZONE,
    
    -- Loading Slip & POD Verify
    loading_slip_no VARCHAR(100),
    loading_slip_image VARCHAR(500),
    pod_uploaded BOOLEAN DEFAULT FALSE,
    pod_url VARCHAR(500),
    pod_verification_status VARCHAR(50) DEFAULT 'Pending' CONSTRAINT chk_pod_status CHECK (pod_verification_status IN ('Pending', 'Verified', 'Discrepancy')),
    pod_verification_notes TEXT,
    
    -- GPS Live State & Feeds
    current_lat NUMERIC(9,6),
    current_lng NUMERIC(9,6),
    current_speed NUMERIC(5,2),
    gps_path JSONB DEFAULT '[]', -- List of {lat, lng, timestamp}
    route_deviation_alert BOOLEAN DEFAULT FALSE,
    delay_risk VARCHAR(50) DEFAULT 'Low' CONSTRAINT chk_delay_risk CHECK (delay_risk IN ('Low', 'Medium', 'High')),
    
    -- Port Logistics Container Tracking
    container_number VARCHAR(100),
    seal_number VARCHAR(100),
    gate_in TIMESTAMP WITH TIME ZONE,
    gate_out TIMESTAMP WITH TIME ZONE,
    detention_charges NUMERIC(12,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_trip_number UNIQUE (tenant_id, trip_number)
);

-- 8. Wallet Transactions (Driver advances & settlement logs)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CONSTRAINT chk_wt_type CHECK (type IN ('Advance Diesel', 'Advance Cash', 'Advance Toll', 'Expense', 'Recovery')),
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Fuel Logs (Fuel usage variance controls)
CREATE TABLE fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    expected_fuel NUMERIC(8,2) NOT NULL,
    actual_fuel NUMERIC(8,2) NOT NULL,
    variance NUMERIC(8,2) NOT NULL,
    refuel_location VARCHAR(255),
    slip_number VARCHAR(100),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    has_theft_alert BOOLEAN DEFAULT FALSE
);

-- 10. Vehicle Expenses (Tyres, Maintenance repairs, PUC, etc.)
CREATE TABLE vehicle_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id UUID NOT NULL REFERENCES trucks(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CONSTRAINT chk_expense_cat CHECK (category IN ('Service', 'Tyres', 'Repairs', 'Insurance', 'Permit', 'Driver Expense', 'Miscellaneous')),
    amount NUMERIC(12,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Activity Logs (Audit trail for SOC compliance)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Challans Table
CREATE TABLE challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    challan_number VARCHAR(100) NOT NULL,
    logo_text VARCHAR(255),
    header_content TEXT,
    footer_content TEXT,
    fields_config JSONB DEFAULT '[]',
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Invoices Table (Financial calculations with GST & TDS 194C)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    tds_deduction NUMERIC(12,2) DEFAULT 0.00,
    gst_rate NUMERIC(5,2) DEFAULT 0.00,
    gst_amount NUMERIC(12,2) DEFAULT 0.00,
    final_amount NUMERIC(15,2) NOT NULL,
    terms TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CONSTRAINT chk_invoice_status CHECK (status IN ('Pending', 'Approved', 'Partial', 'Paid', 'Disputed', 'On Hold', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_contractors_tenant ON contractors(tenant_id);
CREATE INDEX idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX idx_trucks_tenant ON trucks(tenant_id);
CREATE INDEX idx_routes_tenant ON routes(tenant_id);
CREATE INDEX idx_trips_tenant ON trips(tenant_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_gate_in ON trips(gate_in);
CREATE INDEX idx_wallet_transactions_driver ON wallet_transactions(driver_id);
CREATE INDEX idx_fuel_logs_trip ON fuel_logs(trip_id);
CREATE INDEX idx_vehicle_expenses_truck ON vehicle_expenses(truck_id);
CREATE INDEX idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_challans_trip ON challans(trip_id);
CREATE INDEX idx_invoices_trip ON invoices(trip_id);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
-- Row-level security guarantees that tenant-specific accounts can only read/edit their own rows.

-- Enable RLS on all operational tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Helper Function to extract the current tenant context from custom session setting
-- In Supabase, this matches `auth.jwt() ->> 'tenant_id'` or standard app variables.
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        -- Replace auth.uid() with standard postgres auth user check in production
        WHERE email = current_setting('app.current_user_email', true)
          AND role = 'Super Admin'
    );
$$ LANGUAGE sql STABLE;

-- Users Policy
CREATE POLICY users_tenant_isolation ON users
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Contractors Policy
CREATE POLICY contractors_tenant_isolation ON contractors
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Drivers Policy
CREATE POLICY drivers_tenant_isolation ON drivers
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Trucks Policy
CREATE POLICY trucks_tenant_isolation ON trucks
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Routes Policy
CREATE POLICY routes_tenant_isolation ON routes
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Trips Policy
CREATE POLICY trips_tenant_isolation ON trips
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Wallet Transactions Policy
-- Joins back to drivers to check tenant ownership
CREATE POLICY wallet_transactions_isolation ON wallet_transactions
    USING (
        EXISTS (
            SELECT 1 FROM drivers 
            WHERE drivers.id = wallet_transactions.driver_id 
              AND (drivers.tenant_id = current_tenant_id() OR is_super_admin())
        )
    );

-- Fuel Logs Policy
-- Joins back to trips to check tenant ownership
CREATE POLICY fuel_logs_isolation ON fuel_logs
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = fuel_logs.trip_id 
              AND (trips.tenant_id = current_tenant_id() OR is_super_admin())
        )
    );

-- Vehicle Expenses Policy
-- Joins back to trucks to check tenant ownership
CREATE POLICY vehicle_expenses_isolation ON vehicle_expenses
    USING (
        EXISTS (
            SELECT 1 FROM trucks 
            WHERE trucks.id = vehicle_expenses.truck_id 
              AND (trucks.tenant_id = current_tenant_id() OR is_super_admin())
        )
    );

-- Activity Logs Policy
CREATE POLICY activity_logs_tenant_isolation ON activity_logs
    USING (tenant_id = current_tenant_id() OR is_super_admin());

-- Challans Policy
-- Joins back to trips to check tenant ownership
CREATE POLICY challans_isolation ON challans
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = challans.trip_id 
              AND (trips.tenant_id = current_tenant_id() OR is_super_admin())
        )
    );

-- Invoices Policy
-- Joins back to trips to check tenant ownership
CREATE POLICY invoices_isolation ON invoices
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = invoices.trip_id 
              AND (trips.tenant_id = current_tenant_id() OR is_super_admin())
        )
    );
