import { ROLES, type Role } from './constants';

/**
 * Permission keys are `<resource>:<action>`. Everything in the app funnels
 * through `can()` so a single table decides what each role may do.
 */
export const PERMISSIONS = [
  'dashboard:view',
  'customer:view', 'customer:create', 'customer:update', 'customer:delete',
  'vehicle:view', 'vehicle:create', 'vehicle:update', 'vehicle:delete',
  'appointment:view', 'appointment:create', 'appointment:update', 'appointment:delete',
  'order:view', 'order:create', 'order:update', 'order:delete', 'order:assign',
  'service:view', 'service:create', 'service:update', 'service:delete',
  'part:view', 'part:create', 'part:update', 'part:delete',
  'invoice:view', 'invoice:create', 'invoice:update', 'invoice:delete', 'invoice:pay',
  'report:view',
  'message:view', 'message:update',
  'user:view', 'user:create', 'user:update', 'user:delete',
  'settings:view', 'settings:update',
  'audit:view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MANAGER_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'customer:view', 'customer:create', 'customer:update',
  'vehicle:view', 'vehicle:create', 'vehicle:update',
  'appointment:view', 'appointment:create', 'appointment:update',
  'order:view', 'order:create', 'order:update', 'order:assign',
  'service:view',
  'part:view', 'part:update',
  'invoice:view', 'invoice:create', 'invoice:update', 'invoice:pay',
  'report:view',
  'message:view', 'message:update',
];

const TECHNICIAN_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'customer:view',
  'vehicle:view',
  'appointment:view',
  'order:view', 'order:update',
  'service:view',
  'part:view',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  'customer:delete', 'vehicle:delete', 'appointment:delete', 'order:delete',
  'service:create', 'service:update', 'service:delete',
  'part:create', 'part:delete',
  'invoice:delete',
  'user:view', 'user:create', 'user:update',
  'settings:view', 'settings:update',
  'audit:view',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [...PERMISSIONS],
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
  [ROLES.MANAGER]: MANAGER_PERMISSIONS,
  [ROLES.TECHNICIAN]: TECHNICIAN_PERMISSIONS,
  [ROLES.CUSTOMER]: [],
};

export function can(role: Role | undefined | null, permission: Permission) {
  if (!role) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role | undefined | null, permissions: Permission[]) {
  return permissions.some((p) => can(role, p));
}

export function canManageUserWithRole(actor: Role, target: Role) {
  if (actor === ROLES.SUPER_ADMIN) return true;
  if (actor === ROLES.ADMIN) return !([ROLES.SUPER_ADMIN, ROLES.ADMIN] as Role[]).includes(target);
  return false;
}
