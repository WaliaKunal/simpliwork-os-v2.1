
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Deal } from '@/lib/types';

export const DealCard = ({ deal }: { deal: Deal }) => {
  return (
    <Link href={`/deals/${deal.deal_id}`}>
        <Card>
            <CardHeader>
                <CardTitle>{deal.company_name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{deal.deal_code}</p>
                <p className="text-sm text-gray-500">{deal.stage}</p>
            </CardContent>
        </Card>
    </Link>
  );
};
