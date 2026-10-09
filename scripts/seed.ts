/**
 * Seeds the CyberAutoSuite database with a realistic workshop:
 * staff logins, service catalogue, parts, customers, vehicles,
 * appointments, job cards across every workflow stage, and invoices.
 *
 *   npm run seed          # keeps existing data, upserts the essentials
 *   npm run seed:fresh    # wipes the collections first
 */
import path from 'node:path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

try {
  process.loadEnvFile(path.join(process.cwd(), '.env.local'));
} catch {
  try {
    process.loadEnvFile(path.join(process.cwd(), '.env'));
  } catch {
    console.warn('No .env.local found — falling back to defaults.');
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyberautocrm';
const FRESH = process.argv.includes('--fresh');

// Models are registered through the app's own schemas.
import User from '../src/models/User';
import Customer from '../src/models/Customer';
import Vehicle, { type IVehicle } from '../src/models/Vehicle';
import Service from '../src/models/Service';
import Appointment from '../src/models/Appointment';
import ServiceOrder from '../src/models/ServiceOrder';
import Part, { type IPart } from '../src/models/Part';
import Invoice from '../src/models/Invoice';
import ContactMessage from '../src/models/ContactMessage';
import AuditLog from '../src/models/AuditLog';
import Setting from '../src/models/Setting';
import { ORDER_STATUS } from '../src/lib/constants';

const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000);

function code(prefix: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${out}`;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const SERVICES = [
  {
    name: 'Comprehensive Periodic Service',
    image: '/images/service-periodic.jpg',
    category: 'Maintenance',
    basePrice: 6499,
    estimatedHours: 4,
    icon: 'wrench',
    isFeatured: true,
    shortDescription: 'Full 42-point service with engine oil, all filters and fluid top-ups.',
    includes: ['Engine oil + filter', 'Air & cabin filter', 'Brake inspection', 'Fluid top-up', 'Wash & vacuum'],
  },
  {
    name: 'Express Oil & Filter Change',
    image: '/images/service-oil.jpg',
    category: 'Maintenance',
    basePrice: 2899,
    estimatedHours: 1.5,
    icon: 'droplet',
    isFeatured: true,
    shortDescription: 'In and out in 90 minutes with genuine oil and a new filter.',
    includes: ['Synthetic engine oil', 'Oil filter', 'Level checks'],
  },
  {
    name: 'Computerised Engine Diagnostics',
    image: '/images/service-diagnostics.jpg',
    category: 'Diagnostics',
    basePrice: 1499,
    estimatedHours: 1,
    icon: 'activity',
    isFeatured: true,
    shortDescription: 'OBD-II scan with a plain-English fault report on your phone.',
    includes: ['Full ECU scan', 'Live sensor data', 'Written report'],
  },
  {
    name: 'Brake Pad & Disc Overhaul',
    image: '/images/service-brakes.jpg',
    category: 'Repair',
    basePrice: 5499,
    estimatedHours: 3,
    icon: 'disc',
    shortDescription: 'Pads, discs, calliper service and a road-test sign-off.',
    includes: ['Pad replacement', 'Disc skimming', 'Calliper cleaning', 'Brake fluid bleed'],
  },
  {
    name: 'AC Service & Regassing',
    image: '/images/service-ac.jpg',
    category: 'AC & Cooling',
    basePrice: 3499,
    estimatedHours: 2,
    icon: 'snowflake',
    isFeatured: true,
    shortDescription: 'Leak test, condenser clean and refrigerant recharge.',
    includes: ['Leak detection', 'Condenser cleaning', 'Gas recharge', 'Cabin filter'],
  },
  {
    name: 'Wheel Alignment & Balancing',
    image: '/images/service-tyres.jpg',
    category: 'Tyres & Wheels',
    basePrice: 1299,
    estimatedHours: 1,
    icon: 'circle-dot',
    shortDescription: '3D laser alignment with a printed before/after sheet.',
    includes: ['4-wheel alignment', 'Wheel balancing', 'Tyre pressure'],
  },
  {
    name: 'Battery Health Check & Replacement',
    image: '/images/workshop-engine-check.jpg',
    category: 'Electrical',
    basePrice: 899,
    estimatedHours: 0.5,
    icon: 'battery-charging',
    shortDescription: 'Load test, terminal clean-up and same-day replacement.',
    includes: ['Load test', 'Alternator check', 'Terminal cleaning'],
  },
  {
    name: 'Clutch Assembly Replacement',
    image: '/images/workshop-engine-check.jpg',
    category: 'Repair',
    basePrice: 14999,
    estimatedHours: 7,
    icon: 'cog',
    shortDescription: 'Clutch plate, cover and bearing replaced with OEM parts.',
    includes: ['Clutch plate', 'Pressure plate', 'Release bearing', 'Gearbox oil'],
  },
  {
    name: 'Ceramic Coating & Paint Protection',
    image: '/images/service-detailing.jpg',
    category: 'Detailing',
    basePrice: 18999,
    estimatedHours: 10,
    icon: 'sparkles',
    isFeatured: true,
    shortDescription: '9H ceramic coat with a 3-year gloss warranty.',
    includes: ['Clay bar decontamination', 'Machine polish', '9H ceramic coat', 'Interior detail'],
  },
  {
    name: 'Dent Removal & Panel Repaint',
    image: '/images/workshop-interior.jpg',
    category: 'Bodywork',
    basePrice: 7499,
    estimatedHours: 12,
    icon: 'hammer',
    shortDescription: 'Dent pulling, filler work and colour-matched repaint per panel.',
    includes: ['Dent pulling', 'Primer & filler', 'Colour matching', 'Clear coat'],
  },
  {
    name: 'Suspension & Steering Overhaul',
    image: '/images/workshop-lift.jpg',
    category: 'Repair',
    basePrice: 9499,
    estimatedHours: 5,
    icon: 'move-vertical',
    shortDescription: 'Shockers, bushes and links replaced for a quiet ride.',
    includes: ['Shock absorbers', 'Bushings', 'Link rods', 'Alignment'],
  },
  {
    name: 'Pre-Purchase Inspection',
    image: '/images/service-periodic.jpg',
    category: 'Diagnostics',
    basePrice: 2499,
    estimatedHours: 2,
    icon: 'search-check',
    shortDescription: '150-point used-car inspection with photos and a buy/avoid verdict.',
    includes: ['Body & paint scan', 'Engine health', 'Accident history', 'Photo report'],
  },
  {
    name: 'Headlight Restoration',
    image: '/images/service-detailing.jpg',
    category: 'Detailing',
    basePrice: 1799,
    estimatedHours: 1.5,
    icon: 'lightbulb',
    shortDescription: 'Yellowed lenses polished back to clear and UV-sealed.',
    includes: ['Wet sanding', 'Polish', 'UV sealant'],
  },
  {
    name: 'EV Battery & Motor Health Check',
    image: '/images/service-diagnostics.jpg',
    category: 'Electrical',
    basePrice: 3999,
    estimatedHours: 2.5,
    icon: 'zap',
    shortDescription: 'State-of-health report for electric and hybrid drivetrains.',
    includes: ['Cell balance report', 'Thermal check', 'Charging system test'],
  },
];

const PARTS = [
  ['OIL-5W30-4L', 'Synthetic Engine Oil 5W-30 (4L)', 'Lubricants', 'Castrol', 2100, 2850, 42],
  ['FLT-OIL-201', 'Oil Filter — Compact Petrol', 'Filters', 'Bosch', 240, 420, 60],
  ['FLT-AIR-330', 'Air Filter — Sedan', 'Filters', 'Mann', 380, 650, 35],
  ['FLT-CAB-118', 'Cabin AC Filter (Carbon)', 'Filters', 'Valeo', 410, 790, 28],
  ['BRK-PAD-F22', 'Front Brake Pad Set', 'Brakes', 'Brembo', 1850, 3200, 24],
  ['BRK-DSC-F10', 'Front Brake Disc (Pair)', 'Brakes', 'Brembo', 3600, 5900, 10],
  ['BAT-DIN55', 'Battery 55Ah DIN', 'Electrical', 'Exide', 4200, 5890, 12],
  ['SPK-IRID-4', 'Iridium Spark Plug Set (4)', 'Electrical', 'NGK', 1450, 2490, 30],
  ['WPR-BLD-24', 'Wiper Blade 24"', 'Accessories', 'Bosch', 320, 620, 44],
  ['CLT-KIT-880', 'Clutch Kit — 3 Piece', 'Transmission', 'Valeo', 7800, 11900, 6],
  ['SHK-ABS-FR', 'Front Shock Absorber', 'Suspension', 'Monroe', 2650, 4300, 14],
  ['BSH-CTRL-A', 'Control Arm Bushing', 'Suspension', 'Febi', 420, 790, 36],
  ['AC-GAS-R134', 'AC Refrigerant R134a (1kg)', 'AC', 'Honeywell', 850, 1490, 20],
  ['AC-COMP-OIL', 'AC Compressor Oil', 'AC', 'Denso', 560, 980, 15],
  ['COOL-ORG-5L', 'Organic Coolant (5L)', 'Lubricants', 'Shell', 980, 1650, 22],
  ['TYR-185-65', 'Tyre 185/65 R15', 'Tyres', 'MRF', 4300, 5950, 16],
  ['CER-COAT-9H', 'Ceramic Coating 9H (50ml)', 'Detailing', 'Gyeon', 3200, 6500, 8],
  ['POL-COMP-1L', 'Cutting Compound (1L)', 'Detailing', '3M', 890, 1550, 18],
  ['HDL-BULB-H4', 'Headlight Bulb H4', 'Electrical', 'Philips', 420, 790, 26],
  ['FUS-KIT-STD', 'Automotive Fuse Kit', 'Electrical', 'Bussmann', 180, 390, 50],
  ['BLT-TIM-440', 'Timing Belt Kit', 'Engine', 'Gates', 3900, 6400, 7],
  ['RAD-ASY-220', 'Radiator Assembly', 'Engine', 'Denso', 5600, 8900, 4],
  ['MIR-SIDE-L', 'Side Mirror Assembly (Left)', 'Body', 'OEM', 2400, 3900, 5],
  ['BMP-CLIP-20', 'Bumper Clip Set (20 pcs)', 'Body', 'OEM', 160, 340, 3],
];

const VEHICLES = [
  ['Maruti Suzuki', 'Swift', 'VXi', 'Petrol', 'Manual'],
  ['Maruti Suzuki', 'Baleno', 'Zeta', 'Petrol', 'AMT'],
  ['Hyundai', 'i20', 'Asta', 'Petrol', 'Manual'],
  ['Hyundai', 'Creta', 'SX(O)', 'Diesel', 'Automatic'],
  ['Tata', 'Nexon', 'XZ+', 'Petrol', 'Manual'],
  ['Tata', 'Nexon EV', 'Max', 'Electric', 'Automatic'],
  ['Mahindra', 'XUV700', 'AX7', 'Diesel', 'Automatic'],
  ['Honda', 'City', 'VX CVT', 'Petrol', 'CVT'],
  ['Toyota', 'Innova Crysta', 'GX', 'Diesel', 'Manual'],
  ['Kia', 'Seltos', 'HTX', 'Petrol', 'DCT'],
  ['Volkswagen', 'Virtus', 'GT', 'Petrol', 'DCT'],
  ['Skoda', 'Slavia', 'Style', 'Petrol', 'Automatic'],
  ['MG', 'Hector', 'Sharp', 'Diesel', 'Manual'],
  ['Renault', 'Kiger', 'RXZ', 'Petrol', 'AMT'],
  ['BMW', '3 Series', '330i', 'Petrol', 'Automatic'],
  ['Mercedes-Benz', 'C-Class', 'C200', 'Petrol', 'Automatic'],
];

const CUSTOMERS = [
  ['Rohit Malhotra', 'rohit.malhotra@example.com', '9812345671', 'Chandigarh'],
  ['Priya Nair', 'priya.nair@example.com', '9812345672', 'Mohali'],
  ['Aman Sharma', 'aman.sharma@example.com', '9812345673', 'Panchkula'],
  ['Sneha Kulkarni', 'sneha.k@example.com', '9812345674', 'Zirakpur'],
  ['Vikram Singh', 'vikram.singh@example.com', '9812345675', 'Chandigarh'],
  ['Fatima Khan', 'fatima.khan@example.com', '9812345676', 'Mohali'],
  ['Arjun Reddy', 'arjun.reddy@example.com', '9812345677', 'Chandigarh'],
  ['Meera Iyer', 'meera.iyer@example.com', '9812345678', 'Panchkula'],
  ['Harpreet Kaur', 'harpreet.kaur@example.com', '9812345679', 'Ludhiana'],
  ['Daniel Fernandes', 'daniel.f@example.com', '9812345680', 'Chandigarh'],
  ['Ishita Bose', 'ishita.bose@example.com', '9812345681', 'Mohali'],
  ['Kabir Grewal', 'kabir.grewal@example.com', '9812345682', 'Zirakpur'],
  ['Nandini Rao', 'nandini.rao@example.com', '9812345683', 'Chandigarh'],
  ['Sameer Joshi', 'sameer.joshi@example.com', '9812345684', 'Panchkula'],
];

const BUSINESSES = [
  ['Skyline Logistics Pvt Ltd', 'fleet@skylinelogistics.example', '9814000011', 'Fleet of 12 vans'],
  ['Northgate Cab Services', 'ops@northgatecabs.example', '9814000012', 'Monthly AMC'],
];

const COMPLAINTS = [
  'Rattling noise from the front right suspension over speed breakers.',
  'AC cools poorly in traffic but fine on the highway.',
  'Check engine light came on after refuelling.',
  'Brake pedal feels spongy and squeals in the morning.',
  'Car pulls to the left above 60 km/h.',
  'Battery drains if the car sits idle for three days.',
  'Clutch slipping while climbing an incline.',
  'Due for scheduled 40,000 km service.',
  'Headlights look hazy and dim at night.',
  'Minor dent on the rear-left door from a parking scrape.',
];

const DIAGNOSES = [
  'Worn front stabiliser links; replaced both sides and re-torqued.',
  'Condenser choked with debris; cleaned and regassed to spec.',
  'Loose fuel cap triggered an EVAP code; cleared after reseat.',
  'Front pads at 2mm; replaced pads and skimmed discs.',
  'Alignment out of toe spec; corrected to factory values.',
  'Battery failed a load test at 9.4V; replaced under warranty.',
  'Clutch plate glazed and worn; full kit replaced.',
  'Routine service completed; no further faults observed.',
];

const MESSAGES = [
  ['Rahul Verma', 'rahul.verma@example.com', 'AMC for 6 cars', 'We run a small rental fleet. Do you offer an annual maintenance contract for six cars?'],
  ['Divya Menon', 'divya.menon@example.com', 'Ceramic coating slot', 'Is a ceramic coating slot free this Saturday? My car is a 2023 Seltos.'],
  ['Imran Shaikh', 'imran.shaikh@example.com', 'Pickup and drop', 'Do you pick up from Sector 70 Mohali? I cannot drive in during the week.'],
  ['Tanvi Desai', 'tanvi.desai@example.com', 'EV service capability', 'Do your technicians handle Nexon EV high-voltage systems?'],
];

async function main() {
  console.log('→ Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  if (FRESH) {
    console.log('→ Wiping existing collections…');
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Vehicle.deleteMany({}),
      Service.deleteMany({}),
      Appointment.deleteMany({}),
      ServiceOrder.deleteMany({}),
      Part.deleteMany({}),
      Invoice.deleteMany({}),
      ContactMessage.deleteMany({}),
      AuditLog.deleteMany({}),
      Setting.deleteMany({}),
    ]);
  }

  // ---------------------------------------------------------------- settings
  await Setting.findOneAndUpdate({ key: 'global' }, { key: 'global' }, { upsert: true, new: true });

  // ------------------------------------------------------------------- staff
  const pass = async (plain: string) => bcrypt.hash(plain, 10);

  const staffSeed = [
    {
      name: 'Aditya Verma',
      email: process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@cyberautosuite.com',
      password: process.env.SEED_SUPERADMIN_PASSWORD || 'SuperAdmin@123',
      role: 'SUPER_ADMIN',
      phone: '9800000001',
    },
    {
      name: 'Neha Bansal',
      email: 'admin@cyberautosuite.com',
      password: 'Admin@123',
      role: 'ADMIN',
      phone: '9800000002',
    },
    {
      name: 'Rajeev Thakur',
      email: 'manager@cyberautosuite.com',
      password: 'Manager@123',
      role: 'MANAGER',
      phone: '9800000003',
    },
  ];

  const techniciansSeed = [
    ['Gurpreet Sandhu', 'gurpreet.tech@cyberautosuite.com', 'Engine & Transmission', ['Engine rebuild', 'Clutch', 'Timing belt'], 650],
    ['Mohit Rawat', 'mohit.tech@cyberautosuite.com', 'Electricals & Diagnostics', ['OBD-II', 'Wiring', 'ECU'], 600],
    ['Salman Ansari', 'salman.tech@cyberautosuite.com', 'AC & Cooling', ['AC regas', 'Radiator', 'Heater core'], 550],
    ['Deepak Yadav', 'deepak.tech@cyberautosuite.com', 'Suspension & Brakes', ['Alignment', 'Brakes', 'Shockers'], 580],
    ['Anjali Pawar', 'anjali.tech@cyberautosuite.com', 'Detailing & Paint', ['Ceramic coating', 'Polish', 'Dent removal'], 520],
  ];

  const staff: Record<string, mongoose.Types.ObjectId> = {};

  for (const s of staffSeed) {
    const doc = await User.findOneAndUpdate(
      { email: s.email },
      {
        name: s.name,
        email: s.email,
        passwordHash: await pass(s.password),
        phone: s.phone,
        role: s.role,
        isActive: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    staff[s.role] = doc._id;
  }

  const technicianIds: mongoose.Types.ObjectId[] = [];
  for (const [i, t] of techniciansSeed.entries()) {
    const [name, email, specialization, skills, rate] = t as [string, string, string, string[], number];
    const doc = await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        passwordHash: await pass('Tech@123'),
        phone: `98000001${10 + i}`,
        role: 'TECHNICIAN',
        isActive: true,
        technician: {
          employeeId: `EMP-${String(i + 1).padStart(3, '0')}`,
          specialization,
          skills,
          hourlyRate: rate,
          availability: i === 4 ? 'BUSY' : 'AVAILABLE',
          rating: Number((4.2 + Math.random() * 0.75).toFixed(1)),
          jobsCompleted: randInt(40, 260),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    // NOTE: a re-run refreshes the demo password on purpose, so the documented
    // credentials always work.
    technicianIds.push(doc._id);
  }

  console.log(`✓ Staff: ${staffSeed.length} admins + ${technicianIds.length} technicians`);

  // ---------------------------------------------------------------- services
  const serviceDocs = [];
  for (const s of SERVICES) {
    const doc = await Service.findOneAndUpdate(
      { name: s.name },
      {
        $set: {
          ...s,
          slug: slugify(s.name),
          description: `${s.shortDescription} Carried out by factory-trained technicians using OEM-grade parts, with a digital job card you can follow in real time from your phone.`,
          isActive: true,
        },
        // Live counters are never clobbered by a re-run.
        $setOnInsert: { bookingCount: randInt(8, 180) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    serviceDocs.push(doc);
  }
  console.log(`✓ Services: ${serviceDocs.length}`);

  // ------------------------------------------------------------------- parts
  const partDocs: mongoose.HydratedDocument<IPart>[] = [];
  for (const p of PARTS) {
    const [sku, name, category, brand, costPrice, unitPrice, stockQty] = p as [
      string, string, string, string, number, number, number,
    ];
    const doc = await Part.findOneAndUpdate(
      { sku },
      {
        $set: { sku, name, category, brand, costPrice, unitPrice, unit: 'pc', isActive: true },
        // Stock levels and shelf data are operational — seed them once only.
        $setOnInsert: {
          stockQty,
          reorderLevel: randInt(5, 12),
          rackLocation: `R${randInt(1, 9)}-${String.fromCharCode(65 + randInt(0, 5))}${randInt(1, 9)}`,
          supplier: rand(['Autoparts Hub', 'Northside Distributors', 'OEM Direct', 'Speedline Traders']),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    partDocs.push(doc);
  }
  console.log(`✓ Parts: ${partDocs.length}`);

  // --------------------------------------------------------------- customers
  const customerDocs = [];

  for (const [name, email, phone, city] of CUSTOMERS) {
    const doc = await Customer.findOneAndUpdate(
      { phone },
      {
        $set: { name, email, phone, customerType: 'INDIVIDUAL', isActive: true },
        // A customer code, once issued, must never change.
        $setOnInsert: {
          code: code('CUS'),
          address: { line1: `House ${randInt(10, 400)}, Sector ${randInt(2, 80)}`, city, state: 'Punjab', pincode: `16${randInt(1000, 9999)}` },
          preferredContact: rand(['PHONE', 'WHATSAPP', 'EMAIL'] as const),
          tags: Math.random() > 0.6 ? [rand(['loyal', 'premium', 'referral', 'fleet-lead'])] : [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    customerDocs.push(doc);
  }

  for (const [company, email, phone, note] of BUSINESSES) {
    const doc = await Customer.findOneAndUpdate(
      { phone },
      {
        $set: { name: company, company, email, phone, customerType: 'BUSINESS', notes: note, isActive: true },
        $setOnInsert: {
          code: code('CUS'),
          gstin: `04${String.fromCharCode(65 + randInt(0, 25))}BCDE${randInt(1000, 9999)}F1Z5`,
          address: { line1: 'Industrial Area Phase 1', city: 'Chandigarh', state: 'Chandigarh', pincode: '160002' },
          tags: ['fleet'],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    customerDocs.push(doc);
  }

  // A demo customer login wired to the first customer record.
  const demoCustomer = customerDocs[0];
  const customerUser = await User.findOneAndUpdate(
    { email: 'customer@cyberautosuite.com' },
    {
      name: demoCustomer.name,
      email: 'customer@cyberautosuite.com',
      passwordHash: await pass('Customer@123'),
      phone: demoCustomer.phone,
      role: 'CUSTOMER',
      customer: demoCustomer._id,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  demoCustomer.user = customerUser._id;
  await demoCustomer.save();

  console.log(`✓ Customers: ${customerDocs.length}`);

  // ---------------------------------------------------------------- vehicles
  // Registration numbers are randomised, so generating them again on a re-run
  // would pile up duplicates. Reuse what is already on file instead.
  let vehicleDocs: mongoose.HydratedDocument<IVehicle>[] = [];
  let regCounter = 1000;
  const vehiclesExist = !FRESH && (await Vehicle.countDocuments()) > 0;

  if (vehiclesExist) {
    vehicleDocs = await Vehicle.find({});
    console.log(`• Vehicles already present (${vehicleDocs.length}) — reusing`);
  } else
  for (const [idx, customer] of customerDocs.entries()) {
    const count = customer.customerType === 'BUSINESS' ? randInt(2, 3) : Math.random() > 0.72 ? 2 : 1;
    for (let v = 0; v < count; v += 1) {
      const [make, model, variant, fuelType, transmission] = VEHICLES[(idx + v) % VEHICLES.length];
      regCounter += randInt(1, 9);
      const registrationNumber = `CH0${randInt(1, 9)}${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}${regCounter}`;

      const doc = await Vehicle.findOneAndUpdate(
        { registrationNumber },
        {
          customer: customer._id,
          registrationNumber,
          make,
          model,
          variant,
          year: randInt(2015, 2025),
          color: rand(['Pearl White', 'Midnight Black', 'Metallic Grey', 'Fiery Red', 'Ocean Blue', 'Silver']),
          fuelType,
          transmission,
          odometer: randInt(8000, 142000),
          insuranceProvider: rand(['ICICI Lombard', 'HDFC Ergo', 'Bajaj Allianz', 'Tata AIG']),
          insuranceExpiry: daysAhead(randInt(-20, 320)),
          pucExpiry: daysAhead(randInt(-10, 300)),
          isActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      vehicleDocs.push(doc);
    }
  }
  console.log(`✓ Vehicles: ${vehicleDocs.length}`);

  // ------------------------------------------------- appointments + job cards
  if (FRESH || (await Appointment.countDocuments()) === 0) {
    const appointments = [];
    const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00'];

    // Past + today + upcoming bookings.
    for (let i = 0; i < 46; i += 1) {
      const vehicle = rand(vehicleDocs);
      const picked = [rand(serviceDocs), ...(Math.random() > 0.65 ? [rand(serviceDocs)] : [])];
      const uniq = [...new Map(picked.map((s) => [String(s._id), s])).values()];

      const offset = i < 26 ? -randInt(1, 55) : i < 32 ? 0 : randInt(1, 18);
      const scheduledAt = offset === 0 ? new Date() : offset < 0 ? daysAgo(-offset) : daysAhead(offset);
      if (offset === 0) scheduledAt.setHours(randInt(9, 17), 0, 0, 0);

      const status =
        offset < 0
          ? rand(['COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const)
          : offset === 0
            ? rand(['CONFIRMED', 'IN_PROGRESS', 'PENDING'] as const)
            : rand(['PENDING', 'CONFIRMED', 'CONFIRMED'] as const);

      appointments.push({
        code: code('APT'),
        customer: vehicle.customer,
        vehicle: vehicle._id,
        services: uniq.map((s) => s._id),
        scheduledAt,
        slot: rand(slots),
        status,
        source: rand(['ONLINE', 'ONLINE', 'PHONE', 'WALK_IN', 'ADMIN'] as const),
        assignedTechnician: Math.random() > 0.35 ? rand(technicianIds) : null,
        estimatedCost: uniq.reduce((sum, s) => sum + s.basePrice, 0),
        concern: rand(COMPLAINTS),
        pickupRequired: Math.random() > 0.78,
        createdBy: staff.MANAGER,
        statusHistory: [{ status, at: scheduledAt, by: staff.MANAGER, note: 'Seeded booking' }],
      });
    }

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`✓ Appointments: ${createdAppointments.length}`);

    // Job cards spread across the whole workflow, biased to finished work.
    const orders = [];
    const liveStatuses = ORDER_STATUS.filter((s) => s !== 'CANCELLED');

    for (let i = 0; i < 38; i += 1) {
      const appointment = createdAppointments[i % createdAppointments.length];
      const vehicle = vehicleDocs.find((v) => String(v._id) === String(appointment.vehicle))!;
      const past = new Date(appointment.scheduledAt).getTime() < Date.now();

      const status = past
        ? i % 7 === 0
          ? rand(['READY', 'QUALITY_CHECK'] as const)
          : 'DELIVERED'
        : rand(liveStatuses.slice(0, 5));

      const chosenServices = [rand(serviceDocs), ...(Math.random() > 0.6 ? [rand(serviceDocs)] : [])];
      const items = [...new Map(chosenServices.map((s) => [String(s._id), s])).values()].map((s) => ({
        service: s._id,
        name: s.name,
        price: s.basePrice,
        hours: s.estimatedHours,
        qty: 1,
      }));

      const chosenParts = Array.from({ length: randInt(0, 3) }, () => rand(partDocs));
      const parts = [...new Map(chosenParts.map((p) => [String(p._id), p])).values()].map((p) => ({
        part: p._id,
        name: p.name,
        sku: p.sku,
        qty: randInt(1, 2),
        unitPrice: p.unitPrice,
      }));

      const createdAt = daysAgo(randInt(0, 60));
      const delivered = status === 'DELIVERED';
      const assignedTechs = [rand(technicianIds), ...(Math.random() > 0.7 ? [rand(technicianIds)] : [])];

      orders.push({
        code: code('JOB'),
        customer: appointment.customer,
        vehicle: appointment.vehicle,
        appointment: appointment._id,
        status,
        priority: rand(['LOW', 'NORMAL', 'NORMAL', 'HIGH', 'URGENT'] as const),
        technicians: [...new Set(assignedTechs.map(String))].map((id) => new mongoose.Types.ObjectId(id)),
        items,
        parts,
        complaint: appointment.concern,
        diagnosis: ['OPEN', 'DIAGNOSING'].includes(status) ? undefined : rand(DIAGNOSES),
        odometerIn: vehicle.odometer,
        odometerOut: delivered ? vehicle.odometer + randInt(5, 60) : undefined,
        fuelLevel: rand(['1/4', '1/2', '3/4', 'Full']),
        discount: Math.random() > 0.75 ? randInt(200, 1200) : 0,
        taxRate: 18,
        estimateApproved: status !== 'OPEN',
        startedAt: ['OPEN', 'DIAGNOSING'].includes(status) ? undefined : createdAt,
        promisedAt: new Date(createdAt.getTime() + randInt(1, 4) * 86400000),
        completedAt: ['READY', 'DELIVERED'].includes(status) ? new Date(createdAt.getTime() + 86400000) : undefined,
        deliveredAt: delivered ? new Date(createdAt.getTime() + 2 * 86400000) : undefined,
        customerRating: delivered && Math.random() > 0.35 ? randInt(3, 5) : undefined,
        customerFeedback: delivered && Math.random() > 0.7 ? rand([
          'Quick turnaround and the live status updates were genuinely useful.',
          'Fair pricing, explained every line on the estimate before starting.',
          'Car came back cleaner than I left it. Will be back.',
        ]) : undefined,
        createdBy: staff.MANAGER,
        createdAt,
        workLog: [
          { at: createdAt, by: staff.MANAGER, byName: 'Rajeev Thakur', status: 'OPEN', note: 'Job card opened at reception' },
          ...(status !== 'OPEN'
            ? [{ at: new Date(createdAt.getTime() + 3600000), by: assignedTechs[0], byName: 'Technician', status, note: rand(DIAGNOSES) }]
            : []),
        ],
      });
    }

    const createdOrders = await ServiceOrder.insertMany(orders);
    // insertMany skips the pre-save hook, so settle the money columns here.
    for (const order of createdOrders) {
      order.recalculate();
      await order.save();
    }
    console.log(`✓ Job cards: ${createdOrders.length}`);

    // ------------------------------------------------------------- invoices
    let invoiceSeq = 1;
    const year = new Date().getFullYear();
    const invoiced = createdOrders.filter((o) => ['DELIVERED', 'READY'].includes(o.status));

    for (const order of invoiced) {
      const invoice = new Invoice({
        number: `INV-${year}-${String(invoiceSeq++).padStart(4, '0')}`,
        customer: order.customer,
        vehicle: order.vehicle,
        serviceOrder: order._id,
        lines: [
          ...order.items.map((i) => ({ description: i.name, qty: i.qty, unitPrice: i.price, kind: 'LABOUR' as const })),
          ...order.parts.map((p) => ({ description: `${p.name} (${p.sku})`, qty: p.qty, unitPrice: p.unitPrice, kind: 'PART' as const })),
        ],
        discount: order.discount,
        taxRate: 18,
        status: 'SENT',
        issuedAt: order.completedAt ?? order.createdAt,
        dueDate: new Date((order.completedAt ?? order.createdAt).getTime() + 7 * 86400000),
        createdBy: staff.ADMIN,
      });

      // Mix of fully paid, part-paid and overdue invoices.
      invoice.recalculate();
      const roll = Math.random();
      if (order.status === 'DELIVERED' && roll > 0.22) {
        invoice.payments.push({
          at: order.deliveredAt ?? new Date(),
          amount: invoice.total,
          method: rand(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'] as const),
          reference: `TXN${randInt(100000, 999999)}`,
          receivedBy: staff.ADMIN,
        });
      } else if (roll > 0.1) {
        invoice.payments.push({
          at: new Date(),
          amount: Math.round(invoice.total * 0.4),
          method: rand(['UPI', 'CASH'] as const),
          reference: `TXN${randInt(100000, 999999)}`,
          receivedBy: staff.ADMIN,
        });
      } else {
        invoice.dueDate = daysAgo(randInt(2, 20));
      }

      await invoice.save();
      order.invoice = invoice._id;
      await order.save();
    }
    console.log(`✓ Invoices: ${invoiced.length}`);

    // Roll customer spend/visit counters up from delivered work.
    for (const customer of customerDocs) {
      const delivered = createdOrders.filter(
        (o) => String(o.customer) === String(customer._id) && o.status === 'DELIVERED',
      );
      if (!delivered.length) continue;
      customer.visitCount = delivered.length;
      customer.totalSpend = delivered.reduce((sum, o) => sum + o.grandTotal, 0);
      customer.lastVisitAt = delivered[0].deliveredAt ?? new Date();
      await customer.save();
    }

    for (const vehicle of vehicleDocs) {
      const delivered = createdOrders.filter(
        (o) => String(o.vehicle) === String(vehicle._id) && o.status === 'DELIVERED',
      );
      if (!delivered.length) continue;
      vehicle.serviceCount = delivered.length;
      vehicle.lastServiceAt = delivered[0].deliveredAt ?? new Date();
      vehicle.nextServiceDue = daysAhead(randInt(20, 180));
      await vehicle.save();
    }
  } else {
    console.log('• Appointments already present — skipped transactional seed (use --fresh to rebuild)');
  }

  // ---------------------------------------------------------------- messages
  if (FRESH || (await ContactMessage.countDocuments()) === 0) {
    await ContactMessage.insertMany(
      MESSAGES.map(([name, email, subject, message], i) => ({
        name,
        email,
        phone: `98140000${20 + i}`,
        subject,
        message,
        status: i === 0 ? 'NEW' : i === 1 ? 'NEW' : i === 2 ? 'READ' : 'REPLIED',
        reply: i === 3 ? 'Yes — two of our technicians are HV-certified for EV drivetrains.' : undefined,
      })),
    );
    console.log(`✓ Enquiries: ${MESSAGES.length}`);
  }

  await AuditLog.create({
    actorName: 'Seed script',
    actorRole: 'SYSTEM',
    action: 'SEED',
    entity: 'Database',
    summary: FRESH ? 'Database rebuilt from seed' : 'Seed data upserted',
  });

  console.log('\n──────────── Demo logins ────────────');
  console.log('Super Admin  superadmin@cyberautosuite.com  SuperAdmin@123');
  console.log('Admin        admin@cyberautosuite.com       Admin@123');
  console.log('Manager      manager@cyberautosuite.com     Manager@123');
  console.log('Technician   gurpreet.tech@cyberautosuite.com  Tech@123');
  console.log('Customer     customer@cyberautosuite.com    Customer@123');
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('✓ Seed complete.');
}

main().catch(async (err) => {
  console.error('✗ Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
