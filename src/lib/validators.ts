import { z } from 'zod';
import {
  APPOINTMENT_STATUS,
  FUEL_TYPES,
  INVOICE_STATUS,
  ORDER_PRIORITY,
  ORDER_STATUS,
  PAYMENT_METHODS,
  ROLES,
  SERVICE_CATEGORIES,
  TRANSMISSIONS,
} from './constants';

/**
 * Every entity is declared twice on purpose:
 *
 *   <entity>Schema        — for POST. Carries `.default()` so a create call can
 *                           omit optional-with-sensible-default fields.
 *   <entity>UpdateSchema  — for PATCH. Built from the SAME field map but WITHOUT
 *                           defaults, because Zod's `.partial()` still applies a
 *                           field's default when the key is absent — which would
 *                           silently reset columns the caller never sent.
 */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const optionalObjectId = z.union([objectId, z.literal(''), z.null()]).optional();
const phone = z.string().min(7, 'Phone looks too short').max(20);
const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(''));
const optionalDate = z.string().optional().or(z.literal(''));

/* ------------------------------------------------------------------ auth */

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/* -------------------------------------------------------------- customer */

const customerFields = {
  name: z.string().min(2).max(120),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone,
  altPhone: optionalText(20),
  customerType: z.enum(['INDIVIDUAL', 'BUSINESS']),
  company: optionalText(140),
  gstin: optionalText(20),
  address: z
    .object({
      line1: optionalText(200),
      line2: optionalText(200),
      city: optionalText(80),
      state: optionalText(80),
      pincode: optionalText(12),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  notes: optionalText(2000),
  preferredContact: z.enum(['PHONE', 'EMAIL', 'SMS', 'WHATSAPP']),
  isActive: z.boolean().optional(),
};

export const customerSchema = z.object(customerFields).extend({
  customerType: customerFields.customerType.default('INDIVIDUAL'),
  preferredContact: customerFields.preferredContact.default('PHONE'),
});

export const customerUpdateSchema = z.object(customerFields).partial();

/* --------------------------------------------------------------- vehicle */

const vehicleFields = {
  customer: objectId,
  registrationNumber: z.string().min(4, 'Registration number is too short').max(20),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  variant: optionalText(60),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  color: optionalText(40),
  fuelType: z.enum(FUEL_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  vin: optionalText(40),
  engineNumber: optionalText(40),
  odometer: z.coerce.number().min(0),
  insuranceProvider: optionalText(100),
  insuranceExpiry: optionalDate,
  pucExpiry: optionalDate,
  notes: optionalText(2000),
};

export const vehicleSchema = z.object(vehicleFields).extend({
  fuelType: vehicleFields.fuelType.default('Petrol'),
  transmission: vehicleFields.transmission.default('Manual'),
  odometer: vehicleFields.odometer.default(0),
});

export const vehicleUpdateSchema = z.object(vehicleFields).partial();

/* --------------------------------------------------------------- service */

const serviceFields = {
  name: z.string().min(2).max(120),
  category: z.enum(SERVICE_CATEGORIES),
  shortDescription: optionalText(240),
  description: optionalText(4000),
  basePrice: z.coerce.number().min(0),
  estimatedHours: z.coerce.number().min(0.25),
  includes: z.array(z.string()).optional(),
  icon: optionalText(40),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

export const serviceSchema = z.object(serviceFields).extend({
  category: serviceFields.category.default('Maintenance'),
  estimatedHours: serviceFields.estimatedHours.default(1),
});

export const serviceUpdateSchema = z.object(serviceFields).partial();

/* ----------------------------------------------------------- appointment */

const appointmentFields = {
  customer: objectId,
  vehicle: objectId,
  services: z.array(objectId).min(1, 'Pick at least one service'),
  scheduledAt: z.string().min(4, 'Pick a date'),
  slot: z.string().min(4, 'Pick a time slot'),
  concern: optionalText(2000),
  notes: optionalText(2000),
  pickupRequired: z.boolean().optional(),
  pickupAddress: optionalText(300),
  assignedTechnician: optionalObjectId,
  source: z.enum(['ONLINE', 'PHONE', 'WALK_IN', 'ADMIN']).optional(),
  status: z.enum(APPOINTMENT_STATUS).optional(),
};

export const appointmentSchema = z.object(appointmentFields);
export const appointmentUpdateSchema = z.object(appointmentFields).partial();

/** Public booking form — finds or creates the customer and vehicle on the fly. */
export const publicBookingSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone,
  registrationNumber: z.string().min(4).max(20),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  fuelType: z.enum(FUEL_TYPES).default('Petrol'),
  services: z.array(objectId).min(1, 'Pick at least one service'),
  scheduledAt: z.string().min(4),
  slot: z.string().min(4),
  concern: optionalText(2000),
  pickupRequired: z.boolean().optional(),
  pickupAddress: optionalText(300),
});

/* ---------------------------------------------------------- service order */

export const orderLineSchema = z.object({
  service: optionalObjectId,
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  hours: z.coerce.number().min(0).default(1),
  qty: z.coerce.number().int().min(1).default(1),
});

export const orderPartSchema = z.object({
  part: optionalObjectId,
  name: z.string().min(1),
  sku: optionalText(60),
  qty: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
});

const serviceOrderFields = {
  customer: objectId,
  vehicle: objectId,
  appointment: optionalObjectId,
  priority: z.enum(ORDER_PRIORITY),
  technicians: z.array(objectId).optional(),
  items: z.array(orderLineSchema),
  parts: z.array(orderPartSchema),
  complaint: optionalText(2000),
  diagnosis: optionalText(4000),
  recommendation: optionalText(2000),
  odometerIn: z.coerce.number().min(0),
  odometerOut: z.coerce.number().min(0).optional(),
  fuelLevel: optionalText(20),
  discount: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(50),
  estimateApproved: z.boolean().optional(),
  promisedAt: optionalDate,
  status: z.enum(ORDER_STATUS).optional(),
};

export const serviceOrderSchema = z.object(serviceOrderFields).extend({
  priority: serviceOrderFields.priority.default('NORMAL'),
  items: serviceOrderFields.items.default([]),
  parts: serviceOrderFields.parts.default([]),
  odometerIn: serviceOrderFields.odometerIn.default(0),
  discount: serviceOrderFields.discount.default(0),
  taxRate: serviceOrderFields.taxRate.default(18),
});

export const serviceOrderUpdateSchema = z
  .object(serviceOrderFields)
  .partial()
  .extend({ workNote: optionalText(1000) });

/* ------------------------------------------------------------------ part */

const partFields = {
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(140),
  category: z.string().max(60),
  brand: optionalText(60),
  description: optionalText(2000),
  unit: z.string().max(12),
  costPrice: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  stockQty: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(0),
  rackLocation: optionalText(40),
  supplier: optionalText(100),
  compatibleWith: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
};

export const partSchema = z.object(partFields).extend({
  category: partFields.category.default('General'),
  unit: partFields.unit.default('pc'),
  costPrice: partFields.costPrice.default(0),
  stockQty: partFields.stockQty.default(0),
  reorderLevel: partFields.reorderLevel.default(5),
});

export const partUpdateSchema = z.object(partFields).partial();

/* --------------------------------------------------------------- invoice */

const invoiceLineSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().min(0).default(1),
  unitPrice: z.coerce.number().min(0),
  kind: z.enum(['LABOUR', 'PART', 'OTHER']).default('OTHER'),
});

const invoiceFields = {
  customer: objectId,
  vehicle: optionalObjectId,
  serviceOrder: optionalObjectId,
  lines: z.array(invoiceLineSchema).min(1, 'Add at least one line item'),
  discount: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(50),
  dueDate: optionalDate,
  notes: optionalText(2000),
  status: z.enum(INVOICE_STATUS).optional(),
};

export const invoiceSchema = z.object(invoiceFields).extend({
  discount: invoiceFields.discount.default(0),
  taxRate: invoiceFields.taxRate.default(18),
});

export const invoiceUpdateSchema = z.object(invoiceFields).partial();

export const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  method: z.enum(PAYMENT_METHODS).default('CASH'),
  reference: optionalText(80),
});

/* ------------------------------------------------------------------ user */

const technicianProfileSchema = z.object({
  employeeId: optionalText(30),
  specialization: optionalText(80),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  availability: z.enum(['AVAILABLE', 'BUSY', 'ON_LEAVE']).optional(),
});

const userFields = {
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  phone: optionalText(20),
  role: z.enum([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TECHNICIAN, ROLES.CUSTOMER]),
  isActive: z.boolean().optional(),
  technician: technicianProfileSchema.optional(),
};

export const userSchema = z.object(userFields);
export const userUpdateSchema = z.object(userFields).partial();

/* --------------------------------------------------------------- contact */

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: optionalText(20),
  subject: z.string().min(2).max(200),
  message: z.string().min(5).max(4000),
});

/* -------------------------------------------------------------- settings */

export const settingsSchema = z.object({
  garage: z
    .object({
      name: z.string().min(2).max(120),
      tagline: optionalText(200),
      email: z.union([z.string().email(), z.literal('')]).optional(),
      phone: optionalText(20),
      altPhone: optionalText(20),
      address: optionalText(300),
      gstin: optionalText(20),
      logoUrl: optionalText(300),
    })
    .partial()
    .optional(),
  finance: z
    .object({
      currency: z.string().max(5),
      taxRate: z.coerce.number().min(0).max(50),
      invoicePrefix: z.string().max(10),
      paymentTermsDays: z.coerce.number().min(0).max(120),
    })
    .partial()
    .optional(),
  operations: z
    .object({
      openTime: z.string().max(5),
      closeTime: z.string().max(5),
      weekendOpenTime: z.string().max(5).optional(),
      weekendCloseTime: z.string().max(5).optional(),
      slotMinutes: z.coerce.number().min(10).max(120),
      maxDailyAppointments: z.coerce.number().min(1).max(200),
      bayCount: z.coerce.number().min(1).max(60),
    })
    .partial()
    .optional(),
  notifications: z
    .object({
      emailEnabled: z.boolean(),
      smsEnabled: z.boolean(),
      reminderHoursBefore: z.coerce.number().min(1).max(168),
    })
    .partial()
    .optional(),
});
