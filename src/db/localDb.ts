// Local DB Manager with Mock Schema and Persistence
export interface Tenant {
  id: string;
  name: string;
  code: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  logoUrl?: string;
  contactPerson: string;
  mobile: string;
  email: string;
  primaryColor: string;
  customWorkflow: string[];
  numberSeries: {
    challanPrefix: string;
    invoicePrefix: string;
    nextChallanNo: number;
    nextInvoiceNo: number;
  };
  whatsappSettings: {
    provider: string;
    apiKey: string;
    number: string;
  };
  gpsSettings: {
    autoUpdate: boolean;
    intervalSeconds: number;
  };
  aiSettings: {
    delayThresholdMinutes: number;
    fuelVariancePercent: number;
    routeDeviationMeters: number;
  };
  status?: 'Pending Approval' | 'Active' | 'Suspended';
  subscription?: {
    plan: 'Startup Fleet' | 'Transport Contractor' | 'Enterprise Fleet';
    maxTrucks: number;
    maxDrivers: number;
    features: {
      gpsTracking: boolean;
      aiInsights: boolean;
      whatsappAutomation: boolean;
      weighbridgeModule: boolean;
    };
  };
  extraSettings?: {
    vahanProvider: string;
    vahanApiKey: string;
    fastagBank: string;
    fastagApiKey: string;
    wbModel: string;
    wbIpAddress: string;
    wbPort: string;
    ewayProvider: string;
    ewayUsername: string;
    ewayApiKey: string;
  };
  rolePermissions?: {
    'Operator': string[];
    'Finance User': string[];
    'Customer User': string[];
  };
}

export interface User {
  id: string;
  tenantId: string; // "all" for super admin
  name: string;
  email: string;
  mobile: string;
  role: 'Super Admin' | 'Company Admin' | 'Operator' | 'Finance User' | 'Customer User';
  status: 'Active' | 'Inactive';
  password?: string;
}

export interface Contractor {
  id: string;
  tenantId: string;
  name: string;
  mobile: string;
  altMobile?: string;
  email: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  aadhaarNumber?: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  notes?: string;
  status: 'Active' | 'Inactive';
}

export interface Driver {
  id: string;
  tenantId: string;
  name: string;
  mobile: string;
  altMobile?: string;
  whatsappNumber: string;
  licenseNumber: string;
  licenseExpiry: string;
  aadhaarNumber: string;
  address: string;
  joiningDate: string;
  emergencyContact: string;
  status: 'Active' | 'On Trip' | 'Suspended' | 'Inactive';
  walletBalance: number;
}

export interface Truck {
  id: string;
  tenantId: string;
  truckNumber: string;
  type: 'Dumper' | 'Tipper' | 'Taurus' | 'Trailer' | 'Container';
  capacity: number; // in Tons
  ownerName: string;
  driverId: string; // Current assigned driver
  contractorId?: string; // If hired from contractor
  gpsEnabled: boolean;
  insuranceExpiry: string;
  permitExpiry: string;
  fitnessExpiry: string;
  pucExpiry: string;
  fastagBalance: number;
  tyresCount: number;
  status: 'Available' | 'On Trip' | 'Maintenance' | 'Breakdown';
}

export interface Route {
  id: string;
  tenantId: string;
  name: string;
  pickup: string;
  destination: string;
  distanceKm: number;
  durationHours: number;
  expectedFuel: number; // in Litres
  standardRate: number; // ₹ per Ton
  tollCharges: number; // Fastag charges expected
}

export interface Trip {
  id: string;
  tenantId: string;
  tripNumber: string;
  contractorId?: string;
  driverId: string;
  truckId: string;
  routeId: string;
  pickup: string;
  destination: string;
  material: string;
  quantity: number; // in Tons
  rate: number; // per Ton
  amount: number; // freight charges
  status: string; // Workflow states
  priority: 'Low' | 'Medium' | 'High';
  notes?: string;
  createdAt: string;
  
  // Weighbridge slip fields (Salt Industry Module)
  weighbridgeSlipNo?: string;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  moisturePercent?: number;
  qualityGrade?: string;
  weighbridgeOperator?: string;
  weighbridgeDate?: string;
  
  // Loading Slip
  loadingSlipNo?: string;
  loadingSlipImage?: string;
  podUploaded?: boolean;
  podUrl?: string;
  podVerificationStatus?: 'Pending' | 'Verified' | 'Discrepancy';
  podVerificationNotes?: string;

  // Live GPS tracking values
  currentLat?: number;
  currentLng?: number;
  currentSpeed?: number;
  gpsPath?: { lat: number; lng: number; timestamp: string }[];
  routeDeviationAlert?: boolean;
  delayRisk?: 'Low' | 'Medium' | 'High';

  // Port Logistics Container & Detention tracking
  containerNumber?: string;
  sealNumber?: string;
  gateIn?: string;
  gateOut?: string;
  detentionCharges?: number;
}

export interface WalletTransaction {
  id: string;
  driverId: string;
  tripId: string;
  type: 'Advance Diesel' | 'Advance Cash' | 'Advance Toll' | 'Expense' | 'Recovery';
  amount: number;
  description: string;
  date: string;
}

export interface FuelLog {
  id: string;
  tripId: string;
  routeId: string;
  truckId: string;
  expectedFuel: number;
  actualFuel: number;
  variance: number;
  refuelLocation: string;
  slipNumber: string;
  date: string;
  hasTheftAlert: boolean;
}

export interface VehicleExpense {
  id: string;
  truckId: string;
  category: 'Service' | 'Tyres' | 'Repairs' | 'Insurance' | 'Permit' | 'Driver Expense' | 'Miscellaneous';
  amount: number;
  date: string;
  description: string;
}

export interface Challan {
  id: string;
  tripId: string;
  challanNumber: string;
  logoText: string;
  headerContent: string;
  footerContent: string;
  fieldsConfig: string[];
  pdfUrl?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tripId: string;
  invoiceNumber: string;
  subtotal: number;
  tdsDeduction: number;
  gstRate: number;
  gstAmount: number;
  finalAmount: number;
  terms: string;
  status: 'Pending' | 'Approved' | 'Partial' | 'Paid' | 'Disputed' | 'On Hold' | 'Cancelled';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

// Initial Core Seeds
const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Adani Salt Corp',
    code: 'ASC',
    address: 'Adani House, Port Area, Mundra, Gujarat, 370421',
    gstNumber: '24AAAAC1234A1Z1',
    panNumber: 'AAAAC1234A',
    logoUrl: '/logos/adani-salt.png',
    contactPerson: 'Vipul Shah',
    mobile: '9876543210',
    email: 'contact@adanisalt.com',
    primaryColor: '#0284c7', // Sky Blue
    customWorkflow: ['Pending', 'Approved', 'Assigned', 'Accepted', 'Loading', 'Dispatched', 'In Transit', 'Reached Destination', 'Unloading', 'Delivered', 'Completed', 'Cancelled'],
    numberSeries: {
      challanPrefix: 'ASC-2026-',
      invoicePrefix: 'INV-ASC-26-',
      nextChallanNo: 1004,
      nextInvoiceNo: 502,
    },
    whatsappSettings: {
      provider: 'Meta Cloud API',
      apiKey: 'meta_secret_key_123456',
      number: '918888888888',
    },
    gpsSettings: {
      autoUpdate: true,
      intervalSeconds: 30,
    },
    aiSettings: {
      delayThresholdMinutes: 45,
      fuelVariancePercent: 8,
      routeDeviationMeters: 500,
    },
    status: 'Active',
    subscription: {
      plan: 'Enterprise Fleet',
      maxTrucks: 50,
      maxDrivers: 50,
      features: {
        gpsTracking: true,
        aiInsights: true,
        whatsappAutomation: true,
        weighbridgeModule: true,
      },
    },
  },
  {
    id: 'tenant-2',
    name: 'Maruti Logistics & Infrastructure',
    code: 'MLI',
    address: 'Maruti House, S.G. Highway, Ahmedabad, Gujarat, 380054',
    gstNumber: '24AAABM9876M1Z2',
    panNumber: 'AAABM9876M',
    logoUrl: '/logos/maruti-logistics.png',
    contactPerson: 'Sanjay Patel',
    mobile: '9898989898',
    email: 'ops@marutilogistics.com',
    primaryColor: '#059669', // Emerald Green
    customWorkflow: ['Pending', 'Assigned', 'Loading', 'Dispatched', 'In Transit', 'Reached Destination', 'Delivered', 'Completed', 'Cancelled'],
    numberSeries: {
      challanPrefix: 'MLI-26-',
      invoicePrefix: 'INV-MLI-26-',
      nextChallanNo: 2041,
      nextInvoiceNo: 890,
    },
    whatsappSettings: {
      provider: 'Twilio API',
      apiKey: 'twilio_secret_token_999',
      number: '917777777777',
    },
    gpsSettings: {
      autoUpdate: true,
      intervalSeconds: 60,
    },
    aiSettings: {
      delayThresholdMinutes: 30,
      fuelVariancePercent: 5,
      routeDeviationMeters: 300,
    },
    status: 'Active',
    subscription: {
      plan: 'Transport Contractor',
      maxTrucks: 5,
      maxDrivers: 5,
      features: {
        gpsTracking: true,
        aiInsights: true,
        whatsappAutomation: false,
        weighbridgeModule: false,
      },
    },
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'user-1',
    tenantId: 'all',
    name: 'Mitesh Super Admin',
    email: 'super.admin@tcms.com',
    mobile: '9900990099',
    role: 'Super Admin',
    status: 'Active',
    password: 'password123',
  },
  {
    id: 'user-2',
    tenantId: 'tenant-1',
    name: 'Vipul Shah Admin',
    email: 'adani.admin@tcms.com',
    mobile: '9876543210',
    role: 'Company Admin',
    status: 'Active',
    password: 'password123',
  },
  {
    id: 'user-3',
    tenantId: 'tenant-1',
    name: 'Naresh Kumar Operator',
    email: 'adani.operator@tcms.com',
    mobile: '9123456780',
    role: 'Operator',
    status: 'Active',
    password: 'password123',
  },
  {
    id: 'user-4',
    tenantId: 'tenant-1',
    name: 'Amit Joshi Finance',
    email: 'adani.finance@tcms.com',
    mobile: '9234567890',
    role: 'Finance User',
    status: 'Active',
    password: 'password123',
  },
  {
    id: 'user-5',
    tenantId: 'tenant-1',
    name: 'Nirma Salt Purchaser',
    email: 'adani.customer@tcms.com',
    mobile: '9345678901',
    role: 'Customer User',
    status: 'Active',
    password: 'password123',
  },
  {
    id: 'user-6',
    tenantId: 'tenant-2',
    name: 'Sanjay Patel Admin',
    email: 'maruti.admin@tcms.com',
    mobile: '9898989898',
    role: 'Company Admin',
    status: 'Active',
    password: 'password123',
  },
];

const DEFAULT_CONTRACTORS: Contractor[] = [
  {
    id: 'cont-1',
    tenantId: 'tenant-1',
    name: 'Balaji Roadlines',
    mobile: '9888812345',
    email: 'ops@balajiroadlines.com',
    address: 'Plot 45, Sector 8, Gandhidham, Gujarat',
    gstNumber: '24ABCDE1234F1Z9',
    panNumber: 'ABCDE1234F',
    bankName: 'State Bank of India',
    accountNumber: '10002938472',
    ifscCode: 'SBIN0001234',
    status: 'Active',
  },
  {
    id: 'cont-2',
    tenantId: 'tenant-1',
    name: 'Shree Ram Logistics',
    mobile: '9777712345',
    email: 'shreeram.log@gmail.com',
    address: 'Mundra Bypass Road, Kutch, Gujarat',
    gstNumber: '24FGHJK5678F1ZA',
    panNumber: 'FGHJK5678F',
    bankName: 'HDFC Bank',
    accountNumber: '501002394857',
    ifscCode: 'HDFC0000456',
    status: 'Active',
  },
];

const DEFAULT_DRIVERS: Driver[] = [
  {
    id: 'driver-1',
    tenantId: 'tenant-1',
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    whatsappNumber: '919876543210',
    licenseNumber: 'GJ12-2015-004321',
    licenseExpiry: '2028-11-20',
    aadhaarNumber: '1234-5678-9012',
    address: 'Vill- Pipri, Dist- Jaunpur, UP, 222136',
    joiningDate: '2022-04-15',
    emergencyContact: '9876543211',
    status: 'On Trip',
    walletBalance: 4500,
  },
  {
    id: 'driver-2',
    tenantId: 'tenant-1',
    name: 'Suresh Singh',
    mobile: '8765432109',
    whatsappNumber: '918765432109',
    licenseNumber: 'BR06-2018-098765',
    licenseExpiry: '2027-07-15',
    aadhaarNumber: '2345-6789-0123',
    address: 'Vill- Belawa, Dist- Saran, Bihar, 841301',
    joiningDate: '2023-01-10',
    emergencyContact: '8765432108',
    status: 'Active',
    walletBalance: 1200,
  },
  {
    id: 'driver-3',
    tenantId: 'tenant-1',
    name: 'Amit Patel',
    mobile: '7654321098',
    whatsappNumber: '917654321098',
    licenseNumber: 'GJ01-2020-008922',
    licenseExpiry: '2030-05-12',
    aadhaarNumber: '3456-7890-1234',
    address: 'Adajan Road, Surat, Gujarat, 395009',
    joiningDate: '2024-02-01',
    emergencyContact: '7654321097',
    status: 'On Trip',
    walletBalance: 3200,
  },
  {
    id: 'driver-4',
    tenantId: 'tenant-1',
    name: 'Ramesh Yadav',
    mobile: '6543210987',
    whatsappNumber: '916543210987',
    licenseNumber: 'MP04-2012-005432',
    licenseExpiry: '2026-02-14', // Expired
    aadhaarNumber: '4567-8901-2345',
    address: 'Katni, Madhya Pradesh, 483501',
    joiningDate: '2021-09-20',
    emergencyContact: '6543210986',
    status: 'Inactive',
    walletBalance: 0,
  },
];

const DEFAULT_TRUCKS: Truck[] = [
  {
    id: 'truck-1',
    tenantId: 'tenant-1',
    truckNumber: 'GJ-12-BY-4567',
    type: 'Taurus',
    capacity: 25,
    ownerName: 'Adani Logistics Fleet',
    driverId: 'driver-1',
    gpsEnabled: true,
    insuranceExpiry: '2027-04-10',
    permitExpiry: '2026-08-30',
    fitnessExpiry: '2026-09-15',
    pucExpiry: '2026-12-25',
    fastagBalance: 7800,
    tyresCount: 10,
    status: 'On Trip',
  },
  {
    id: 'truck-2',
    tenantId: 'tenant-1',
    truckNumber: 'GJ-12-CZ-9876',
    type: 'Tipper',
    capacity: 18,
    ownerName: 'Adani Logistics Fleet',
    driverId: 'driver-2',
    gpsEnabled: true,
    insuranceExpiry: '2026-07-30',
    permitExpiry: '2026-07-20',
    fitnessExpiry: '2026-10-18',
    pucExpiry: '2026-08-05',
    fastagBalance: 400,
    tyresCount: 6,
    status: 'Available',
  },
  {
    id: 'truck-3',
    tenantId: 'tenant-1',
    truckNumber: 'MH-43-TX-1234',
    type: 'Trailer',
    capacity: 40,
    ownerName: 'Balaji Roadlines',
    driverId: 'driver-3',
    contractorId: 'cont-1',
    gpsEnabled: true,
    insuranceExpiry: '2027-02-15',
    permitExpiry: '2027-01-20',
    fitnessExpiry: '2026-11-20',
    pucExpiry: '2026-09-02',
    fastagBalance: 12000,
    tyresCount: 18,
    status: 'On Trip',
  },
];

const DEFAULT_ROUTES: Route[] = [
  {
    id: 'route-1',
    tenantId: 'tenant-1',
    name: 'Mundra Port to Ahmedabad GIDC',
    pickup: 'Mundra Port, Kutch',
    destination: 'Sanand GIDC, Ahmedabad',
    distanceKm: 340,
    durationHours: 8,
    expectedFuel: 115,
    standardRate: 1100,
    tollCharges: 1650,
  },
  {
    id: 'route-2',
    tenantId: 'tenant-1',
    name: 'Gandhidham Salt Works to Morbi Ceramics',
    pickup: 'Chirai Salt Pans, Gandhidham',
    destination: 'Morbi Ceramic Zone',
    distanceKm: 130,
    durationHours: 4,
    expectedFuel: 48,
    standardRate: 650,
    tollCharges: 480,
  },
  {
    id: 'route-3',
    tenantId: 'tenant-1',
    name: 'Mundra Salt Pan to Kandla Bulk Terminal',
    pickup: 'Mundra Salt Pans',
    destination: 'Kandla Port Berth 4',
    distanceKm: 65,
    durationHours: 2.5,
    expectedFuel: 25,
    standardRate: 350,
    tollCharges: 120,
  },
];

const DEFAULT_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    tenantId: 'tenant-1',
    tripNumber: 'ASC-2026-00001',
    driverId: 'driver-1',
    truckId: 'truck-1',
    routeId: 'route-1',
    pickup: 'Mundra Port, Kutch',
    destination: 'Sanand GIDC, Ahmedabad',
    material: 'Refined Salt (Industrial)',
    quantity: 26.5,
    rate: 1100,
    amount: 29150,
    status: 'Dispatched',
    priority: 'High',
    notes: 'Urgent delivery for Nirma Chemical Plant',
    createdAt: '2026-06-19T06:30:00Z',
    currentLat: 23.003,
    currentLng: 70.812,
    currentSpeed: 52,
    delayRisk: 'Low',
    routeDeviationAlert: false,
    weighbridgeSlipNo: 'WB-99081',
    grossWeight: 38.5,
    tareWeight: 12.0,
    netWeight: 26.5,
    moisturePercent: 1.8,
    qualityGrade: 'A Grade',
    weighbridgeOperator: 'M. K. Patel',
    weighbridgeDate: '2026-06-19T07:15:00Z',
    loadingSlipNo: 'LSLIP-44910',
    gpsPath: [
      { lat: 22.842, lng: 69.721, timestamp: '2026-06-19T06:45:00Z' },
      { lat: 22.915, lng: 70.102, timestamp: '2026-06-19T07:15:00Z' },
      { lat: 23.003, lng: 70.812, timestamp: '2026-06-19T08:00:00Z' },
    ],
  },
  {
    id: 'trip-2',
    tenantId: 'tenant-1',
    tripNumber: 'ASC-2026-00002',
    driverId: 'driver-3',
    truckId: 'truck-3',
    routeId: 'route-2',
    pickup: 'Chirai Salt Pans, Gandhidham',
    destination: 'Morbi Ceramic Zone',
    material: 'Raw Salt (Bulk)',
    quantity: 38.2,
    rate: 650,
    amount: 24830,
    status: 'In Transit',
    priority: 'Medium',
    createdAt: '2026-06-19T09:00:00Z',
    currentLat: 22.894,
    currentLng: 70.925,
    currentSpeed: 45,
    delayRisk: 'Medium',
    routeDeviationAlert: true,
    weighbridgeSlipNo: 'WB-99092',
    grossWeight: 53.2,
    tareWeight: 15.0,
    netWeight: 38.2,
    moisturePercent: 3.1,
    qualityGrade: 'B Grade',
    weighbridgeOperator: 'K. S. Rathod',
    weighbridgeDate: '2026-06-19T09:20:00Z',
    loadingSlipNo: 'LSLIP-44918',
    gpsPath: [
      { lat: 22.981, lng: 70.125, timestamp: '2026-06-19T09:10:00Z' },
      { lat: 22.923, lng: 70.521, timestamp: '2026-06-19T09:40:00Z' },
      { lat: 22.894, lng: 70.925, timestamp: '2026-06-19T10:15:00Z' },
    ],
  },
  {
    id: 'trip-3',
    tenantId: 'tenant-1',
    tripNumber: 'ASC-2026-00003',
    driverId: 'driver-2',
    truckId: 'truck-2',
    routeId: 'route-3',
    pickup: 'Mundra Salt Pans',
    destination: 'Kandla Port Berth 4',
    material: 'Crushed Salt',
    quantity: 18.0,
    rate: 350,
    amount: 6300,
    status: 'Pending',
    priority: 'Low',
    createdAt: '2026-06-19T10:00:00Z',
  },
];

const DEFAULT_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'wt-1',
    driverId: 'driver-1',
    tripId: 'trip-1',
    type: 'Advance Diesel',
    amount: 6000,
    description: 'Fuel advance for trip ASC-2026-00001 at HP Pump Mundra',
    date: '2026-06-19T06:40:00Z',
  },
  {
    id: 'wt-2',
    driverId: 'driver-1',
    tripId: 'trip-1',
    type: 'Advance Cash',
    amount: 2000,
    description: 'Driver pocket expense advance',
    date: '2026-06-19T06:42:00Z',
  },
  {
    id: 'wt-3',
    driverId: 'driver-1',
    tripId: 'trip-1',
    type: 'Advance Toll',
    amount: 1500,
    description: 'Fastag recharge advance',
    date: '2026-06-19T06:42:00Z',
  },
];

const DEFAULT_FUEL_LOGS: FuelLog[] = [
  {
    id: 'fl-1',
    tripId: 'trip-1',
    routeId: 'route-1',
    truckId: 'truck-1',
    expectedFuel: 115,
    actualFuel: 122,
    variance: 7,
    refuelLocation: 'HP Pump Samakhiali',
    slipNumber: 'FSLIP-88910',
    date: '2026-06-19T08:10:00Z',
    hasTheftAlert: false,
  },
];

const DEFAULT_VEHICLE_EXPENSES: VehicleExpense[] = [
  {
    id: 've-1',
    truckId: 'truck-2',
    category: 'Tyres',
    amount: 22000,
    date: '2026-06-10T12:00:00Z',
    description: 'Replaced rear right tyre, Ceat 10.00R20',
  },
  {
    id: 've-2',
    truckId: 'truck-1',
    category: 'Repairs',
    amount: 3500,
    date: '2026-06-12T10:30:00Z',
    description: 'Air brake valve leakage service',
  },
];

const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    tenantId: 'tenant-1',
    userId: 'user-3',
    userName: 'Naresh Kumar',
    action: 'Create Trip',
    details: 'Created trip ASC-2026-00001 for driver Rajesh Kumar',
    timestamp: '2026-06-19T06:30:00Z',
  },
  {
    id: 'log-2',
    tenantId: 'tenant-1',
    userId: 'user-3',
    userName: 'Naresh Kumar',
    action: 'Record Weighbridge',
    details: 'Added gross weight 38.5 Tons to trip ASC-2026-00001',
    timestamp: '2026-06-19T07:15:00Z',
  },
];

class LocalDb {
  constructor() {
    this.initialize();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  get<T>(key: string, defaults: T[]): T[] {
    if (!this.isBrowser()) return defaults;
    const value = localStorage.getItem(`tcms_${key}`);
    if (!value) {
      localStorage.setItem(`tcms_${key}`, JSON.stringify(defaults));
      return defaults;
    }
    try {
      return JSON.parse(value);
    } catch {
      return defaults;
    }
  }

  set<T>(key: string, value: T[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(`tcms_${key}`, JSON.stringify(value));
  }

  initialize() {
    let tenants = this.get('tenants', DEFAULT_TENANTS);
    let users = this.get('users', DEFAULT_USERS);
    let contractors = this.get('contractors', DEFAULT_CONTRACTORS);
    let drivers = this.get('drivers', DEFAULT_DRIVERS);
    let trucks = this.get('trucks', DEFAULT_TRUCKS);
    let routes = this.get('routes', DEFAULT_ROUTES);
    let trips = this.get('trips', DEFAULT_TRIPS);
    let walletTransactions = this.get('wallet_transactions', DEFAULT_WALLET_TRANSACTIONS);
    let fuelLogs = this.get('fuel_logs', DEFAULT_FUEL_LOGS);
    let vehicleExpenses = this.get('vehicle_expenses', DEFAULT_VEHICLE_EXPENSES);
    let activityLogs = this.get('activity_logs', DEFAULT_ACTIVITY_LOGS);

    let changed = false;

    // 1. Ensure all users have a password field populated
    users = users.map(u => {
      if (!u.password) {
        changed = true;
        return { ...u, password: 'password123' };
      }
      return u;
    });

    // 2. Ensure rolePermissions are on all tenants
    tenants = tenants.map(t => {
      let tenantUpdated = false;
      if (!t.rolePermissions) {
        tenantUpdated = true;
        t.rolePermissions = {
          'Operator': [
            '/portal/dashboard',
            '/portal/trips',
            '/portal/trucks',
            '/portal/drivers',
            '/portal/contractors',
            '/portal/routes',
            '/portal/fuel',
            '/portal/expenses',
            '/portal/challans',
            '/portal/gps'
          ],
          'Finance User': [
            '/portal/dashboard',
            '/portal/challans',
            '/portal/invoices',
            '/portal/expenses',
            '/portal/reports',
            '/portal/profitability'
          ],
          'Customer User': [
            '/portal/dashboard',
            '/portal/trips',
            '/portal/gps',
            '/portal/challans',
            '/portal/invoices',
            '/portal/reports'
          ]
        };
      }
      if (tenantUpdated) changed = true;
      return t;
    });

    // 3. Programmatic seed of Vasudev Infra (tenant-3) if not present
    if (!tenants.some(t => t.id === 'tenant-3')) {
      changed = true;
      
      // Seed Tenant
      const vasudevTenant: Tenant = {
        id: 'tenant-3',
        name: 'Vasudev Infra',
        code: 'VDI',
        address: 'Vasudev Complex, Mundra Port Road, Gandhidham, Kutch, Gujarat, 370201',
        gstNumber: '24AAAVD4567V1Z3',
        panNumber: 'AAAVD4567V',
        logoUrl: '/logos/vasudev.png',
        contactPerson: 'Mitesh',
        mobile: '9900990099',
        email: 'vasudev.admin@tcms.com',
        primaryColor: '#f97316', // Amber/Orange
        customWorkflow: ['Pending', 'Assigned', 'Loading', 'Dispatched', 'In Transit', 'Reached Destination', 'Delivered', 'Completed', 'Cancelled'],
        numberSeries: {
          challanPrefix: 'VDI-26-',
          invoicePrefix: 'INV-VDI-26-',
          nextChallanNo: 3046,
          nextInvoiceNo: 1512,
        },
        whatsappSettings: {
          provider: 'Meta Cloud API',
          apiKey: 'meta_secret_key_vasudev',
          number: '919900990099',
        },
        gpsSettings: {
          autoUpdate: true,
          intervalSeconds: 30,
        },
        aiSettings: {
          delayThresholdMinutes: 45,
          fuelVariancePercent: 8,
          routeDeviationMeters: 500,
        },
        status: 'Active',
        subscription: {
          plan: 'Enterprise Fleet',
          maxTrucks: 50,
          maxDrivers: 50,
          features: {
            gpsTracking: true,
            aiInsights: true,
            whatsappAutomation: true,
            weighbridgeModule: true,
          },
        },
        rolePermissions: {
          'Operator': [
            '/portal/dashboard',
            '/portal/trips',
            '/portal/trucks',
            '/portal/drivers',
            '/portal/contractors',
            '/portal/routes',
            '/portal/fuel',
            '/portal/expenses',
            '/portal/challans',
            '/portal/gps'
          ],
          'Finance User': [
            '/portal/dashboard',
            '/portal/challans',
            '/portal/invoices',
            '/portal/expenses',
            '/portal/reports',
            '/portal/profitability'
          ],
          'Customer User': [
            '/portal/dashboard',
            '/portal/trips',
            '/portal/gps',
            '/portal/challans',
            '/portal/invoices',
            '/portal/reports'
          ]
        }
      };
      tenants.push(vasudevTenant);

      // Seed Users
      const vasudevUsers: User[] = [
        { id: 'vdi-u-1', tenantId: 'tenant-3', name: 'Mitesh', email: 'vasudev.admin@tcms.com', mobile: '9900990099', role: 'Company Admin', status: 'Active', password: 'password123' },
        { id: 'vdi-u-2', tenantId: 'tenant-3', name: 'Ramesh Operator', email: 'vasudev.operator1@tcms.com', mobile: '9100010001', role: 'Operator', status: 'Active', password: 'password123' },
        { id: 'vdi-u-3', tenantId: 'tenant-3', name: 'Suresh Operator', email: 'vasudev.operator2@tcms.com', mobile: '9100010002', role: 'Operator', status: 'Active', password: 'password123' },
        { id: 'vdi-u-4', tenantId: 'tenant-3', name: 'Mahesh Finance', email: 'vasudev.finance@tcms.com', mobile: '9100010003', role: 'Finance User', status: 'Active', password: 'password123' },
        { id: 'vdi-u-5', tenantId: 'tenant-3', name: 'Kutch Salt Purchaser', email: 'vasudev.customer@tcms.com', mobile: '9100010004', role: 'Customer User', status: 'Active', password: 'password123' },
      ];
      users.push(...vasudevUsers);

      // Seed 5 Contractors
      const vdiContractors: Contractor[] = [
        { id: 'vdi-c-1', tenantId: 'tenant-3', name: 'Kutch Roadlines', mobile: '9825010001', email: 'ops@kutchroadlines.com', address: 'Plot 12, Sector 8, Gandhidham, Kutch, 370201', gstNumber: '24KUTCH1234K1Z1', panNumber: 'KUTCH1234K', bankName: 'State Bank of India', accountNumber: '30001010101', ifscCode: 'SBIN0001234', status: 'Active' },
        { id: 'vdi-c-2', tenantId: 'tenant-3', name: 'Mundra Bulk Carriers', mobile: '9825010002', email: 'ops@mundrabulk.com', address: 'Port Road, Mundra, Kutch, 370421', gstNumber: '24MUNDR1234M1Z2', panNumber: 'MUNDR1234M', bankName: 'HDFC Bank', accountNumber: '50100202020', ifscCode: 'HDFC0000456', status: 'Active' },
        { id: 'vdi-c-3', tenantId: 'tenant-3', name: 'Kandla Salt Transporters', mobile: '9825010003', email: 'ops@kandlasalt.com', address: 'Cargo Jetty, Kandla Port, Kutch, 370210', gstNumber: '24KANDL1234K1Z3', panNumber: 'KANDL1234K', bankName: 'ICICI Bank', accountNumber: '10203040506', ifscCode: 'ICIC0000999', status: 'Active' },
        { id: 'vdi-c-4', tenantId: 'tenant-3', name: 'Anjar Logistics Services', mobile: '9825010004', email: 'ops@anjarlogistics.com', address: 'GIDC Industrial Area, Anjar, Kutch, 370110', gstNumber: '24ANJAR1234A1Z4', panNumber: 'ANJAR1234A', bankName: 'Axis Bank', accountNumber: '91501000999', ifscCode: 'UTIB0000123', status: 'Active' },
        { id: 'vdi-c-5', tenantId: 'tenant-3', name: 'Bhuj Infrastructure Shippers', mobile: '9825010005', email: 'ops@bhujinfra.com', address: 'Madhapar Highway, Bhuj, Kutch, 370001', gstNumber: '24BHUJI1234B1Z5', panNumber: 'BHUJI1234B', bankName: 'Bank of Baroda', accountNumber: '08120100001', ifscCode: 'BARB0BHUJXX', status: 'Active' },
      ];
      contractors.push(...vdiContractors);

      // Seed 10 Drivers
      const vdiDrivers: Driver[] = [];
      const driverNames = ['Ramesh Kumar', 'Suresh Yadav', 'Vijay Singh', 'Ashok Patel', 'Rajesh Sharma', 'Vikram Rathore', 'Anil Joshi', 'Sanjay Gohil', 'Mahesh Jadeja', 'Dinesh Chawla'];
      for (let i = 0; i < 10; i++) {
        vdiDrivers.push({
          id: `vdi-d-${i + 1}`,
          tenantId: 'tenant-3',
          name: driverNames[i],
          mobile: `998877660${i}`,
          altMobile: `998877550${i}`,
          whatsappNumber: `91998877660${i}`,
          licenseNumber: `GJ12-DL-${10000 + i}`,
          licenseExpiry: '2030-05-15',
          aadhaarNumber: `1234-5678-900${i}`,
          address: 'Drivers Quarters, Vasudev Garage, Gandhidham',
          joiningDate: '2025-01-10',
          emergencyContact: '9988774433',
          status: 'Active',
          walletBalance: 2500 + i * 500
        });
      }
      drivers.push(...vdiDrivers);

      // Seed 20 Trucks
      const vdiTrucks: Truck[] = [];
      const truckTypes: Truck['type'][] = ['Taurus', 'Trailer', 'Container', 'Dumper'];
      for (let i = 0; i < 20; i++) {
        vdiTrucks.push({
          id: `vdi-t-${i + 1}`,
          tenantId: 'tenant-3',
          truckNumber: `GJ-12-BY-${2000 + i}`,
          type: truckTypes[i % 4],
          capacity: i % 2 === 0 ? 25 : 32,
          ownerName: i < 12 ? 'Vasudev Infra owned' : 'Market Hired Truck',
          driverId: `vdi-d-${(i % 10) + 1}`,
          contractorId: i >= 12 ? `vdi-c-${(i % 5) + 1}` : undefined,
          gpsEnabled: true,
          insuranceExpiry: '2027-02-18',
          permitExpiry: '2027-06-25',
          fitnessExpiry: '2028-01-12',
          pucExpiry: '2026-12-30',
          fastagBalance: 1200 + i * 400,
          tyresCount: i % 2 === 0 ? 10 : 12,
          status: i % 5 === 0 ? 'On Trip' : 'Available'
        });
      }
      trucks.push(...vdiTrucks);

      // Seed 5 Routes in Kutch
      const vdiRoutes: Route[] = [
        { id: 'vdi-r-1', tenantId: 'tenant-3', name: 'Mundra Port to Gandhidham GIDC', pickup: 'Mundra Port Coal/Salt Wharf', destination: 'Gandhidham GIDC Chemical Sector', distanceKm: 65, durationHours: 2.5, expectedFuel: 24, standardRate: 450, tollCharges: 160 },
        { id: 'vdi-r-2', tenantId: 'tenant-3', name: 'Kandla Port to Bhuj Industrial Area', pickup: 'Kandla Port Salt Jetty', destination: 'Bhuj Industrial Area madhapar', distanceKm: 75, durationHours: 3, expectedFuel: 28, standardRate: 500, tollCharges: 210 },
        { id: 'vdi-r-3', tenantId: 'tenant-3', name: 'Mandvi Salt Works to Anjar GIDC', pickup: 'Mandvi Salt Pans', destination: 'Anjar GIDC Steel Sector', distanceKm: 90, durationHours: 3.5, expectedFuel: 32, standardRate: 580, tollCharges: 240 },
        { id: 'vdi-r-4', tenantId: 'tenant-3', name: 'Bhuj to Morbi Ceramic Hub', pickup: 'Bhuj Clay Mines', destination: 'Morbi Ceramic Industrial Zone', distanceKm: 145, durationHours: 5, expectedFuel: 55, standardRate: 950, tollCharges: 380 },
        { id: 'vdi-r-5', tenantId: 'tenant-3', name: 'Mundra Port to Sanand GIDC', pickup: 'Mundra Port Terminal 2', destination: 'Sanand Industrial Estate, Ahmedabad', distanceKm: 340, durationHours: 9, expectedFuel: 120, standardRate: 1600, tollCharges: 780 }
      ];
      routes.push(...vdiRoutes);

      // Seed 45 Trips
      // We will seed 35 historical "Completed" trips, 7 "In Transit" trips, and 3 "Pending/Assigned" trips
      const materials = ['Industrial Salt', 'Refined Salt (Raw)', 'Clay Material', 'Salt Bulk Cargo', 'Chemical Minerals'];
      for (let i = 0; i < 45; i++) {
        const routeIdx = i % 5;
        const route = vdiRoutes[routeIdx];
        const driverIdx = i % 10;
        const truckIdx = i % 20;
        
        let status = 'Completed';
        if (i >= 35 && i < 42) status = 'In Transit';
        else if (i === 42 || i === 43) status = 'Assigned';
        else if (i === 44) status = 'Pending';

        const qty = 24 + (i % 8);
        const amt = qty * route.standardRate;
        const tripNo = `VDI-26-${(3001 + i).toString()}`;
        
        const isCompleted = status === 'Completed';
        const isInTransit = status === 'In Transit';

        const gross = isCompleted ? qty + 12.5 : undefined;
        const tare = isCompleted ? 12.5 : undefined;
        const net = isCompleted ? qty : undefined;
        const moisture = isCompleted ? (2 + (i % 6)) : undefined; // Some above 4% for penalty check

        trips.push({
          id: `vdi-tr-${i + 1}`,
          tenantId: 'tenant-3',
          tripNumber: tripNo,
          contractorId: vdiTrucks[truckIdx].contractorId,
          driverId: `vdi-d-${driverIdx + 1}`,
          truckId: `vdi-t-${truckIdx + 1}`,
          routeId: route.id,
          pickup: route.pickup,
          destination: route.destination,
          material: materials[i % 5],
          quantity: qty,
          rate: route.standardRate,
          amount: amt,
          status: status,
          priority: i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low',
          createdAt: new Date(Date.now() - (45 - i) * 24 * 3600 * 1000).toISOString(),
          weighbridgeSlipNo: isCompleted ? `WB-VDI-${9000 + i}` : undefined,
          grossWeight: gross,
          tareWeight: tare,
          netWeight: net,
          moisturePercent: moisture,
          qualityGrade: isCompleted ? (moisture && moisture > 4 ? 'B Grade (High Moisture)' : 'A Grade') : undefined,
          weighbridgeOperator: isCompleted ? 'D. P. Jadeja' : undefined,
          weighbridgeDate: isCompleted ? new Date(Date.now() - (45 - i) * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString() : undefined,
          loadingSlipNo: isCompleted ? `LSLIP-VDI-${8000 + i}` : undefined,
          podUploaded: isCompleted ? true : undefined,
          podVerificationStatus: isCompleted ? (i % 10 === 0 ? 'Discrepancy' : 'Verified') : undefined,
          currentLat: isInTransit ? 22.9 + (i % 4) * 0.1 : undefined,
          currentLng: isInTransit ? 69.8 + (i % 4) * 0.1 : undefined,
          gpsPath: isInTransit ? [
            { lat: 22.842, lng: 69.721, timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
            { lat: 22.915, lng: 70.102, timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
          ] : undefined
        });

        // Seed wallet transaction for advances
        if (isCompleted || isInTransit) {
          walletTransactions.push({
            id: `vdi-wtx-${i * 2 + 1}`,
            driverId: `vdi-d-${driverIdx + 1}`,
            tripId: `vdi-tr-${i + 1}`,
            type: 'Advance Diesel',
            amount: 5000,
            description: `Fuel advance for trip ${tripNo} (DSL-VDI-${1000 + i})`,
            date: new Date(Date.now() - (45 - i) * 24 * 3600 * 1000 + 1 * 3600 * 1000).toISOString()
          });
          walletTransactions.push({
            id: `vdi-wtx-${i * 2 + 2}`,
            driverId: `vdi-d-${driverIdx + 1}`,
            tripId: `vdi-tr-${i + 1}`,
            type: 'Advance Cash',
            amount: 2000,
            description: `Pocket expense advance for trip ${tripNo} (CSH-VDI-${1000 + i})`,
            date: new Date(Date.now() - (45 - i) * 24 * 3600 * 1000 + 1.5 * 3600 * 1000).toISOString()
          });

          // Seed Fuel Log
          const expected = route.expectedFuel;
          const actual = expected + (i % 2 === 0 ? 2 : -1);
          const variance = actual - expected;
          fuelLogs.push({
            id: `vdi-fl-${i + 1}`,
            tripId: `vdi-tr-${i + 1}`,
            routeId: route.id,
            truckId: `vdi-t-${truckIdx + 1}`,
            expectedFuel: expected,
            actualFuel: actual,
            variance: Number(variance.toFixed(1)),
            refuelLocation: 'Reliance Petrol Pump, Gandhidham Bypass',
            slipNumber: `FSLIP-VDI-${1000 + i}`,
            date: new Date(Date.now() - (45 - i) * 24 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(),
            hasTheftAlert: variance > 5,
          });
        }
      }

      // Seed Activity Logs
      activityLogs.unshift({
        id: `vdi-log-1`,
        tenantId: 'tenant-3',
        userId: 'vdi-u-1',
        userName: 'Mitesh',
        action: 'Initialize DB',
        details: 'Vasudev Infra seeded with 5 Contractors, 20 Trucks, and 45 Trips in Kutch region.',
        timestamp: new Date().toISOString()
      });
    }

    if (changed) {
      this.set('tenants', tenants);
      this.set('users', users);
      this.set('contractors', contractors);
      this.set('drivers', drivers);
      this.set('trucks', trucks);
      this.set('routes', routes);
      this.set('trips', trips);
      this.set('wallet_transactions', walletTransactions);
      this.set('fuel_logs', fuelLogs);
      this.set('vehicle_expenses', vehicleExpenses);
      this.set('activity_logs', activityLogs);
    }
  }

  reset() {
    if (!this.isBrowser()) return;
    localStorage.setItem('tcms_tenants', JSON.stringify(DEFAULT_TENANTS));
    localStorage.setItem('tcms_users', JSON.stringify(DEFAULT_USERS));
    localStorage.setItem('tcms_contractors', JSON.stringify(DEFAULT_CONTRACTORS));
    localStorage.setItem('tcms_drivers', JSON.stringify(DEFAULT_DRIVERS));
    localStorage.setItem('tcms_trucks', JSON.stringify(DEFAULT_TRUCKS));
    localStorage.setItem('tcms_routes', JSON.stringify(DEFAULT_ROUTES));
    localStorage.setItem('tcms_trips', JSON.stringify(DEFAULT_TRIPS));
    localStorage.setItem('tcms_wallet_transactions', JSON.stringify(DEFAULT_WALLET_TRANSACTIONS));
    localStorage.setItem('tcms_fuel_logs', JSON.stringify(DEFAULT_FUEL_LOGS));
    localStorage.setItem('tcms_vehicle_expenses', JSON.stringify(DEFAULT_VEHICLE_EXPENSES));
    localStorage.setItem('tcms_activity_logs', JSON.stringify(DEFAULT_ACTIVITY_LOGS));
  }

  getTenants(): Tenant[] {
    const tenants = this.get('tenants', DEFAULT_TENANTS);
    let updated = false;
    const patched = tenants.map(t => {
      let tenantUpdated = false;
      let sub = t.subscription;
      if (!sub) {
        tenantUpdated = true;
        if (t.id === 'tenant-1') {
          sub = {
            plan: 'Enterprise Fleet' as const,
            maxTrucks: 50,
            maxDrivers: 50,
            features: {
              gpsTracking: true,
              aiInsights: true,
              whatsappAutomation: true,
              weighbridgeModule: true,
            }
          };
        } else if (t.id === 'tenant-2') {
          sub = {
            plan: 'Transport Contractor' as const,
            maxTrucks: 5,
            maxDrivers: 5,
            features: {
              gpsTracking: true,
              aiInsights: true,
              whatsappAutomation: false,
              weighbridgeModule: false,
            }
          };
        } else {
          sub = {
            plan: 'Startup Fleet' as const,
            maxTrucks: 2,
            maxDrivers: 2,
            features: {
              gpsTracking: false,
              aiInsights: false,
              whatsappAutomation: false,
              weighbridgeModule: false,
            }
          };
        }
      }

      let perms = t.rolePermissions;
      if (!perms) {
        tenantUpdated = true;
        perms = {
          'Operator': [
            '/portal/dashboard',
            '/portal/trips',
            '/portal/trucks',
            '/portal/drivers',
            '/portal/contractors',
            '/portal/routes',
            '/portal/fuel',
            '/portal/expenses',
            '/portal/challans',
            '/portal/gps'
          ],
          'Finance User': [
            '/portal/dashboard',
            '/portal/challans',
            '/portal/invoices',
            '/portal/expenses',
            '/portal/reports',
            '/portal/profitability'
          ],
          'Customer User': [
            '/portal/dashboard',
            '/portal/trips',
            '/portal/gps',
            '/portal/challans',
            '/portal/invoices',
            '/portal/reports'
          ]
        };
      }

      if (tenantUpdated) {
        updated = true;
        return {
          ...t,
          subscription: sub,
          rolePermissions: perms,
        };
      }
      return t;
    });

    if (updated) {
      this.saveTenants(patched);
      return patched;
    }
    return tenants;
  }
  getUsers(tenantId?: string): User[] {
    const list = this.get('users', DEFAULT_USERS);
    return tenantId ? list.filter(u => u.tenantId === tenantId || u.tenantId === 'all') : list;
  }
  getContractors(tenantId: string): Contractor[] {
    return this.get('contractors', DEFAULT_CONTRACTORS).filter(c => c.tenantId === tenantId);
  }
  getDrivers(tenantId: string): Driver[] {
    return this.get('drivers', DEFAULT_DRIVERS).filter(d => d.tenantId === tenantId);
  }
  getTrucks(tenantId: string): Truck[] {
    return this.get('trucks', DEFAULT_TRUCKS).filter(t => t.tenantId === tenantId);
  }
  getRoutes(tenantId: string): Route[] {
    return this.get('routes', DEFAULT_ROUTES).filter(r => r.tenantId === tenantId);
  }
  getTrips(tenantId: string): Trip[] {
    return this.get('trips', DEFAULT_TRIPS).filter(t => t.tenantId === tenantId);
  }
  getWalletTransactions(driverId: string): WalletTransaction[] {
    return this.get('wallet_transactions', DEFAULT_WALLET_TRANSACTIONS).filter(w => w.driverId === driverId);
  }
  getFuelLogs(tenantId: string): FuelLog[] {
    const trips = this.getTrips(tenantId).map(t => t.id);
    return this.get('fuel_logs', DEFAULT_FUEL_LOGS).filter(f => trips.includes(f.tripId));
  }
  getVehicleExpenses(tenantId: string): VehicleExpense[] {
    const trucks = this.getTrucks(tenantId).map(t => t.id);
    return this.get('vehicle_expenses', DEFAULT_VEHICLE_EXPENSES).filter(e => trucks.includes(e.truckId));
  }
  getActivityLogs(tenantId: string): ActivityLog[] {
    return this.get('activity_logs', DEFAULT_ACTIVITY_LOGS).filter(l => l.tenantId === tenantId);
  }

  saveTenants(list: Tenant[]) { this.set('tenants', list); }
  saveUsers(list: User[]) { this.set('users', list); }
  saveContractors(list: Contractor[]) { this.set('contractors', list); }
  saveDrivers(list: Driver[]) { this.set('drivers', list); }
  saveTrucks(list: Truck[]) { this.set('trucks', list); }
  saveRoutes(list: Route[]) { this.set('routes', list); }
  saveTrips(list: Trip[]) { this.set('trips', list); }
  saveWalletTransactions(list: WalletTransaction[]) { this.set('wallet_transactions', list); }
  saveFuelLogs(list: FuelLog[]) { this.set('fuel_logs', list); }
  saveVehicleExpenses(list: VehicleExpense[]) { this.set('vehicle_expenses', list); }
  saveActivityLogs(list: ActivityLog[]) { this.set('activity_logs', list); }

  addTrip(tenantId: string, trip: Omit<Trip, 'id' | 'tenantId' | 'createdAt' | 'tripNumber'>): Trip {
    const list = this.get('trips', DEFAULT_TRIPS);
    const tenants = this.getTenants();
    const tIdx = tenants.findIndex(t => t.id === tenantId);
    
    let tripNo = 'TRIP-2026-00001';
    if (tIdx !== -1) {
      const tenant = tenants[tIdx];
      const seq = tenant.numberSeries.nextChallanNo;
      tripNo = `${tenant.numberSeries.challanPrefix}${seq.toString().padStart(5, '0')}`;
      tenants[tIdx].numberSeries.nextChallanNo += 1;
      this.saveTenants(tenants);
    }

    const newTrip: Trip = {
      ...trip,
      id: `trip-${Date.now()}`,
      tenantId,
      tripNumber: tripNo,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newTrip);
    this.saveTrips(list);
    
    this.addLog(tenantId, 'user-3', 'Naresh Kumar Operator', 'Create Trip', `Created trip ${tripNo}`);
    return newTrip;
  }

  updateTrip(tenantId: string, id: string, updates: Partial<Trip>): Trip | null {
    const list = this.get('trips', DEFAULT_TRIPS);
    const idx = list.findIndex(t => t.id === id && t.tenantId === tenantId);
    if (idx === -1) return null;
    const oldTrip = list[idx];
    const newTrip = { ...oldTrip, ...updates };
    list[idx] = newTrip;
    this.saveTrips(list);

    if (updates.status && oldTrip.status !== updates.status) {
      this.addLog(tenantId, 'user-3', 'Naresh Kumar Operator', 'Update Status', `Trip ${oldTrip.tripNumber} status updated to ${updates.status}`);
    }
    return newTrip;
  }

  addLog(tenantId: string, userId: string, userName: string, action: string, details: string) {
    const list = this.get('activity_logs', DEFAULT_ACTIVITY_LOGS);
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      tenantId,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newLog);
    this.saveActivityLogs(list);
  }

  signupTenant(companyName: string, email: string, contactPerson: string, mobile: string, color: string): Tenant {
    const tenantsList = this.getTenants();
    const code = companyName.substring(0, 3).toUpperCase() + Math.floor(10 + Math.random() * 90);
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: companyName,
      code,
      address: '',
      gstNumber: '',
      panNumber: '',
      contactPerson,
      mobile,
      email,
      primaryColor: color || '#0284c7',
      status: 'Pending Approval',
      customWorkflow: ['Pending', 'Assigned', 'In Transit', 'Completed', 'Cancelled'],
      numberSeries: {
        challanPrefix: `${code}-`,
        invoicePrefix: `INV-${code}-`,
        nextChallanNo: 1000,
        nextInvoiceNo: 1000,
      },
      whatsappSettings: {
        provider: 'Meta Cloud API',
        apiKey: '',
        number: '',
      },
      gpsSettings: {
        autoUpdate: true,
        intervalSeconds: 30,
      },
      aiSettings: {
        delayThresholdMinutes: 45,
        fuelVariancePercent: 8,
        routeDeviationMeters: 500,
      },
      subscription: {
        plan: 'Startup Fleet',
        maxTrucks: 2,
        maxDrivers: 2,
        features: {
          gpsTracking: false,
          aiInsights: false,
          whatsappAutomation: false,
          weighbridgeModule: false,
        },
      },
      rolePermissions: {
        'Operator': [
          '/portal/dashboard',
          '/portal/trips',
          '/portal/trucks',
          '/portal/drivers',
          '/portal/contractors',
          '/portal/routes',
          '/portal/fuel',
          '/portal/expenses',
          '/portal/challans',
          '/portal/gps'
        ],
        'Finance User': [
          '/portal/dashboard',
          '/portal/challans',
          '/portal/invoices',
          '/portal/expenses',
          '/portal/reports',
          '/portal/profitability'
        ],
        'Customer User': [
          '/portal/dashboard',
          '/portal/trips',
          '/portal/gps',
          '/portal/challans',
          '/portal/invoices',
          '/portal/reports'
        ]
      }
    };
    
    tenantsList.push(newTenant);
    this.saveTenants(tenantsList);
    
    // Create Company Admin user for this tenant
    const usersList = this.get('users', DEFAULT_USERS);
    const newUser: User = {
      id: `user-${Date.now()}`,
      tenantId: newTenant.id,
      name: contactPerson,
      email,
      mobile,
      role: 'Company Admin',
      status: 'Active'
    };
    usersList.push(newUser);
    this.saveUsers(usersList);
    
    return newTenant;
  }

  approveTenant(tenantId: string): void {
    const tenantsList = this.getTenants();
    const idx = tenantsList.findIndex(t => t.id === tenantId);
    if (idx !== -1) {
      tenantsList[idx].status = 'Active';
      this.saveTenants(tenantsList);
      this.addLog(tenantId, 'user-1', 'Super Admin', 'Approve Tenant', `Approved company registration for ${tenantsList[idx].name}`);
    }
  }
}

export const localDb = new LocalDb();
