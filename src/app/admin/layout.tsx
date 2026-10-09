import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { STAFF_ROLES } from '@/lib/constants';
import { connectDB } from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';
import Part from '@/models/Part';
import ServiceOrder from '@/models/ServiceOrder';
import { AdminShell } from '@/components/admin/AdminShell';

async function getBadges() {
  try {
    await connectDB();
    const [messages, lowStock, activeJobs] = await Promise.all([
      ContactMessage.countDocuments({ status: 'NEW' }),
      Part.countDocuments({ $expr: { $lte: ['$stockQty', '$reorderLevel'] }, isActive: true }),
      ServiceOrder.countDocuments({ status: { $nin: ['DELIVERED', 'CANCELLED'] } }),
    ]);
    return { messages, lowStock, activeJobs };
  } catch {
    return {};
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?next=/admin');
  if (!STAFF_ROLES.includes(session.role)) redirect('/portal');

  const badges = await getBadges();

  return (
    <AdminShell
      user={{
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
      }}
      badges={badges}
    >
      {children}
    </AdminShell>
  );
}
