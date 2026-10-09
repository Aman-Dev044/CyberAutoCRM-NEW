/**
 * Removes records created by smoke/E2E testing against a live database.
 * Matches on the test markers only — seeded demo data is untouched.
 *
 *   npx tsx scripts/cleanup-test-data.ts
 */
import path from 'node:path';
import mongoose from 'mongoose';

try {
  process.loadEnvFile(path.join(process.cwd(), '.env.local'));
} catch {
  console.warn('No .env.local found — using defaults.');
}

import Appointment from '../src/models/Appointment';
import ContactMessage from '../src/models/ContactMessage';
import Customer from '../src/models/Customer';
import Invoice from '../src/models/Invoice';
import Part from '../src/models/Part';
import ServiceOrder from '../src/models/ServiceOrder';
import Vehicle from '../src/models/Vehicle';

const TEST_CUSTOMER_NAMES = [/^E2E /i, /^Smoke Test User$/i];
const TEST_REGISTRATIONS = ['CH88E2E777', 'CH88E2E999', 'CH99ZZ0001'];
const TEST_EMAILS = ['smoke@test.example', 'e2e@test.example'];

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyberautocrm-Ai';
  await mongoose.connect(uri);
  console.log('→ Connected');

  const customers = await Customer.find({
    $or: [
      { name: { $in: TEST_CUSTOMER_NAMES } },
      { email: { $in: TEST_EMAILS } },
      { phone: { $in: ['9000011122', '9112233445', '9112233999'] } },
    ],
  }).select('_id name');

  const customerIds = customers.map((c) => c._id);
  console.log(`→ Test customers: ${customers.map((c) => c.name).join(', ') || 'none'}`);

  const vehicles = await Vehicle.find({
    $or: [
      { registrationNumber: { $in: TEST_REGISTRATIONS } },
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
    ],
  }).select('_id registrationNumber');
  const vehicleIds = vehicles.map((v) => v._id);

  const orders = await ServiceOrder.find({
    $or: [
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
      ...(vehicleIds.length ? [{ vehicle: { $in: vehicleIds } }] : []),
    ],
  }).select('_id code parts');

  // Hand any reserved parts back to stock before deleting the job cards.
  for (const order of orders) {
    for (const line of order.parts) {
      if (line.part) {
        await Part.findByIdAndUpdate(line.part, { $inc: { stockQty: line.qty } });
      }
    }
  }

  const orderIds = orders.map((o) => o._id);
  const scope = [
    ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
    ...(vehicleIds.length ? [{ vehicle: { $in: vehicleIds } }] : []),
  ];

  const results = {
    invoices: scope.length
      ? (await Invoice.deleteMany({ $or: [...scope, { serviceOrder: { $in: orderIds } }] }))
          .deletedCount
      : 0,
    orders: orderIds.length
      ? (await ServiceOrder.deleteMany({ _id: { $in: orderIds } })).deletedCount
      : 0,
    appointments: scope.length ? (await Appointment.deleteMany({ $or: scope })).deletedCount : 0,
    vehicles: vehicleIds.length
      ? (await Vehicle.deleteMany({ _id: { $in: vehicleIds } })).deletedCount
      : 0,
    customers: customerIds.length
      ? (await Customer.deleteMany({ _id: { $in: customerIds } })).deletedCount
      : 0,
    messages: (await ContactMessage.deleteMany({ email: { $in: TEST_EMAILS } })).deletedCount,
  };

  console.table(results);
  await mongoose.disconnect();
  console.log('✓ Cleanup complete.');
}

main().catch(async (err) => {
  console.error('✗ Cleanup failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
