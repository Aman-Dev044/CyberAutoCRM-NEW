import {
  BarChart3,
  CalendarCheck,
  CarFront,
  ClipboardList,
  Cog,
  FileText,
  Inbox,
  LayoutDashboard,
  Package,
  ScrollText,
  Sparkles,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/rbac';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** Marks the badge slot this item reads from, if any. */
  badge?: 'messages' | 'lowStock' | 'activeJobs';
  exact?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard:view',
        exact: true,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/admin/appointments', label: 'Appointments', icon: CalendarCheck, permission: 'appointment:view' },
      { href: '/admin/board', label: 'Workshop Board', icon: ClipboardList, permission: 'order:view', badge: 'activeJobs' },
      { href: '/admin/orders', label: 'Job Cards', icon: Wrench, permission: 'order:view' },
      { href: '/admin/technicians', label: 'Technicians', icon: UsersRound, permission: 'order:view' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users, permission: 'customer:view' },
      { href: '/admin/vehicles', label: 'Vehicles', icon: CarFront, permission: 'vehicle:view' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/admin/services', label: 'Services', icon: Sparkles, permission: 'service:view' },
      { href: '/admin/parts', label: 'Parts & Stock', icon: Package, permission: 'part:view', badge: 'lowStock' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/admin/invoices', label: 'Invoices', icon: FileText, permission: 'invoice:view' },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'report:view' },
    ],
  },
  {
    title: 'Inbox',
    items: [
      { href: '/admin/messages', label: 'Enquiries', icon: Inbox, permission: 'message:view', badge: 'messages' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/admin/users', label: 'Users & Roles', icon: Users, permission: 'user:view' },
      { href: '/admin/audit-logs', label: 'Audit Log', icon: ScrollText, permission: 'audit:view' },
      { href: '/admin/settings', label: 'Settings', icon: Cog, permission: 'settings:view' },
    ],
  },
];
