
import { Deal } from '@/lib/types';
import { DealCard } from './DealCard';

export const DealColumn = ({ title, deals }: { title: string, deals: Deal[] }) => {
  return (
    <div className="w-1/3 bg-gray-100 p-4 rounded-lg">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <div className="space-y-4">
        {deals.map((deal) => (
          <DealCard key={deal.deal_id} deal={deal} />
        ))}
      </div>
    </div>
  );
};
