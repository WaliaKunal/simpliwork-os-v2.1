
'use client';

import { useEffect, useState } from 'react';
import { DealColumn } from '@/components/DealColumn';
import { db } from '@/lib/firebase/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Deal } from '@/lib/types';

export const KanbanBoard = () => {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'deals'), (snapshot) => {
      const dealsData = snapshot.docs.map((doc) => ({ ...doc.data(), deal_id: doc.id }) as Deal);
      setDeals(dealsData);
    });
    return () => unsubscribe();
  }, []);

  const columns = ['Pitch', 'Negotiation', 'Closing'];

  return (
    <div className="flex space-x-4">
      {columns.map((column) => (
        <DealColumn
          key={column}
          title={column}
          deals={deals.filter((deal) => deal.stage === column)}
        />
      ))}
    </div>
  );
};
