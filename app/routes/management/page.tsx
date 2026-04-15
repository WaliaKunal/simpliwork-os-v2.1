'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useRouter } from 'next/navigation';

type Deal = {
  id: string;
  stage?: string;
  sales_owner_email?: string;
  source_name?: string;
};

type DealActivity = {
  id: string;
  deal_id: string;
  created_at: any;
};

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div style={styles.statCard}>
    <p style={styles.statValue}>{value}</p>
    <p style={styles.statLabel}>{title}</p>
  </div>
);

export default function Page() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dealsSnap = await getDocs(collection(db, 'deals'));
        const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[];

        const activitiesSnap = await getDocs(collection(db, 'deal_activities'));
        const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DealActivity[];

        const latestActivityByDeal: { [key: string]: Date } = {};

        activities.forEach(activity => {
          if (activity.deal_id && activity.created_at) {
            const dt = activity.created_at?.toDate
              ? activity.created_at.toDate()
              : new Date(activity.created_at);

            if (!latestActivityByDeal[activity.deal_id] || dt > latestActivityByDeal[activity.deal_id]) {
              latestActivityByDeal[activity.deal_id] = dt;
            }
          }
        });

        const now = new Date();
        const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDays = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const sevenDays = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const hot: Deal[] = [];
        const attention: Deal[] = [];
        const dead: Deal[] = [];

        deals.forEach(d => {
          const last = latestActivityByDeal[d.id];
          const stage = d.stage || '';

          if (last && last > oneDay && ['Proposal Sent', 'Negotiation', 'LOI Initiated'].includes(stage)) {
            hot.push(d);
          }

          if (last && last < threeDays && last >= sevenDays && stage !== 'Closed') {
            attention.push(d);
          }

          if (last && last < sevenDays) {
            dead.push(d);
          }
        });

        setStats({
          totalDeals: deals.length,
          staleDeals: deals.filter(d => {
            const last = latestActivityByDeal[d.id];
            return last && last < threeDays;
          }).length,
          hot,
          attention,
          dead,
          latestActivityByDeal,
        });

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !stats) {
    return <div style={styles.container}>Loading...</div>;
  }

  const renderList = (list: Deal[]) => {
    if (!list.length) return <p style={styles.noItems}>None</p>;

    return list.map(d => (
      <div
        key={d.id}
        style={styles.dealRow}
        onClick={() => router.push(`/routes/deals/${d.id}`)}
      >
        <div><b>{d.id}</b></div>
        <div>{d.stage}</div>
        <div>
          {stats.latestActivityByDeal[d.id]
            ? stats.latestActivityByDeal[d.id].toLocaleString()
            : 'No activity'}
        </div>
      </div>
    ));
  };

  return (
    <div style={styles.container}>
      <h1>Management Dashboard</h1>

      <div style={styles.row}>
        <StatCard title="Total Deals" value={stats.totalDeals} />
        <StatCard title="Stale Deals (3d+)" value={stats.staleDeals} />
      </div>

      <h2>🔥 Hot Deals</h2>
      {renderList(stats.hot)}

      <h2>⚠️ Needs Attention</h2>
      {renderList(stats.attention)}

      <h2>💀 Dead Deals</h2>
      {renderList(stats.dead)}
    </div>
  );
}

const styles: any = {
  container: { padding: 40, fontFamily: 'monospace' },
  row: { display: 'flex', gap: 20, marginBottom: 30 },
  statCard: { border: '1px solid #ccc', padding: 20 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },

  dealRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 12,
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  },

  noItems: { color: '#888', fontStyle: 'italic' },
};