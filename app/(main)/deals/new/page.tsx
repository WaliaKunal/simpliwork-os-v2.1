export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NewDealForm } from '@/components/NewDealForm';

export default function Page() {
  return (
    <div className="p-6">
      <NewDealForm />
    </div>
  );
}
