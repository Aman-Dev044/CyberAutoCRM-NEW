import { PageHeader } from '@/components/admin/PageHeader';
import { JobCardForm } from '@/components/admin/JobCardForm';

export const metadata = { title: 'New Job Card' };

export default function NewOrderPage() {
  return (
    <>
      <PageHeader
        title="New job card"
        description="Open a repair order for a walk-in, or for work that was never booked online."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Job Cards', href: '/admin/orders' },
          { label: 'New' },
        ]}
      />
      <JobCardForm />
    </>
  );
}
