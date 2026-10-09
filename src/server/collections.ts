import 'server-only';
import type { CollectionConfig } from '@/lib/crud';
import {
  customerSchema,
  customerUpdateSchema,
  partSchema,
  partUpdateSchema,
  serviceSchema,
  serviceUpdateSchema,
  vehicleSchema,
  vehicleUpdateSchema,
} from '@/lib/validators';
import { generateCode, slugify } from '@/lib/utils';
import Customer from '@/models/Customer';
import Part from '@/models/Part';
import Service from '@/models/Service';
import Vehicle from '@/models/Vehicle';

/**
 * Shared CRUD descriptors. Route files only re-export handlers, so these
 * live outside the `app/api` tree where Next.js validates module exports.
 */

export const customerConfig: CollectionConfig<unknown> = {
  model: Customer,
  entity: 'Customer',
  createSchema: customerSchema,
  updateSchema: customerUpdateSchema,
  permissions: {
    view: 'customer:view',
    create: 'customer:create',
    update: 'customer:update',
    delete: 'customer:delete',
  },
  searchFields: ['name', 'email', 'phone', 'company', 'code'],
  filterFields: ['customerType'],
  booleanFields: ['isActive'],
  defaultSort: { createdAt: -1 },
  beforeCreate: (payload) => ({ ...payload, code: generateCode('CUS') }),
  label: (doc) => doc.name,
};

export const vehicleConfig: CollectionConfig<unknown> = {
  model: Vehicle,
  entity: 'Vehicle',
  createSchema: vehicleSchema,
  updateSchema: vehicleUpdateSchema,
  permissions: {
    view: 'vehicle:view',
    create: 'vehicle:create',
    update: 'vehicle:update',
    delete: 'vehicle:delete',
  },
  searchFields: ['registrationNumber', 'make', 'model', 'vin'],
  filterFields: ['customer', 'fuelType', 'transmission'],
  booleanFields: ['isActive'],
  populate: [{ path: 'customer', select: 'name phone code email' }],
  defaultSort: { createdAt: -1 },
  label: (doc) => doc.registrationNumber,
};

export const serviceConfig: CollectionConfig<unknown> = {
  model: Service,
  entity: 'Service',
  createSchema: serviceSchema,
  updateSchema: serviceUpdateSchema,
  permissions: {
    view: 'service:view',
    create: 'service:create',
    update: 'service:update',
    delete: 'service:delete',
  },
  searchFields: ['name', 'category', 'shortDescription'],
  filterFields: ['category'],
  booleanFields: ['isActive', 'isFeatured'],
  defaultSort: { name: 1 },
  beforeCreate: (payload) => ({
    ...payload,
    slug: `${slugify(payload.name)}-${Math.random().toString(36).slice(2, 6)}`,
  }),
  beforeUpdate: (payload, doc) => ({
    ...payload,
    ...(payload.name && payload.name !== doc.name
      ? { slug: `${slugify(payload.name)}-${String(doc._id).slice(-4)}` }
      : {}),
  }),
  label: (doc) => doc.name,
};

export const partConfig: CollectionConfig<unknown> = {
  model: Part,
  entity: 'Part',
  createSchema: partSchema,
  updateSchema: partUpdateSchema,
  permissions: {
    view: 'part:view',
    create: 'part:create',
    update: 'part:update',
    delete: 'part:delete',
  },
  searchFields: ['name', 'sku', 'brand', 'category'],
  filterFields: ['category', 'brand'],
  booleanFields: ['isActive'],
  defaultSort: { name: 1 },
  label: (doc) => `${doc.sku} ${doc.name}`,
};
