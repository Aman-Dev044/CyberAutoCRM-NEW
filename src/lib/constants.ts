export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberAutoSuite';
export const AUTH_COOKIE = 'cas_session';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  TECHNICIAN: 'Technician',
  CUSTOMER: 'Customer',
};

/** Roles that may enter the /admin back-office. */
export const STAFF_ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TECHNICIAN'];

export const APPOINTMENT_STATUS = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const ORDER_STATUS = [
  'OPEN',
  'DIAGNOSING',
  'AWAITING_PARTS',
  'IN_PROGRESS',
  'QUALITY_CHECK',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

/** Columns shown on the workshop board, in workflow order. */
export const ORDER_BOARD: OrderStatus[] = [
  'OPEN',
  'DIAGNOSING',
  'AWAITING_PARTS',
  'IN_PROGRESS',
  'QUALITY_CHECK',
  'READY',
  'DELIVERED',
];

export const ORDER_PRIORITY = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type OrderPriority = (typeof ORDER_PRIORITY)[number];

export const INVOICE_STATUS = ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

export const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'WALLET'] as const;

export const SERVICE_CATEGORIES = [
  'Maintenance',
  'Repair',
  'Diagnostics',
  'Bodywork',
  'Detailing',
  'Tyres & Wheels',
  'Electrical',
  'AC & Cooling',
] as const;

export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] as const;
export const TRANSMISSIONS = ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'] as const;

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
] as const;
