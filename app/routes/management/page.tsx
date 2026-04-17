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

type LayoutRequest = {
  id: string;
  deal_id?: string;
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

const DealListItem = ({
  deal,
  lastActivityDate,
  onClick,
}: {
  deal: Deal;
  lastActivityDate?: Date;
  onClick: () => void;
}) => (
  <div style={styles.dealItem} onClick={onClick}>
    <span style={styles.dealId}>ID: {deal.id}</span>
    <span style={styles.dealStage}>Stage: {deal.stage || 'N/A'}</span>
    <span style={styles.dealActivity}>
      Last Activity: {lastActivityDate ? lastActivityDate.toLocaleString() : 'None'}
    </span>
  </div>
);

export default function Page() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        const dealsSnap = await getDocs(collection(db, 'deals'));
        const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[];

        const requestsSnap = await getDocs(collection(db, 'layout_requests'));
        const layoutRequests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LayoutRequest[];

        const activitiesSnap = await getDocs(collection(db, 'deal_activities'));
        const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DealActivity[];

        const totalDeals = deals.length;

        const requestCountsByDeal = layoutRequests.reduce((acc, req) => {
          if (req.deal_id) {
            acc[req.deal_id] = (acc[req.deal_id] || 0) + 1;
          }
          return acc;
        }, {} as { [key: string]: number });

        const dealsWithIterations = Object.values(requestCountsByDeal).filter(count => count > 1).length;

        const latestActivityByDeal: { [key: string]: Date } = {};

        activities.forEach(activity => {
          if (activity.deal_id && activity.created_at) {
            const activityDate = activity.created_at?.toDate
              ? activity.created_at.toDate()
              : new Date(activity.created_at);

            if (
              !latestActivityByDeal[activity.deal_id] ||
              activityDate > latestActivityByDeal[activity.deal_id]
            ) {
              latestActivityByDeal[activity.deal_id] = activityDate;
            }
          }
        });

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const staleDealsCount = deals.filter(deal => {
          const lastActivityDate = latestActivityByDeal[deal.id];
          return lastActivityDate && lastActivityDate < threeDaysAgo;
        }).length;

        const needsAttentionDeals: Deal[] = [];
        const hotDeals: Deal[] = [];
        const deadDeals: Deal[] = [];

        deals.forEach(deal => {
          const lastActivityDate = latestActivityByDeal[deal.id];
          const stage = deal.stage || 'Unknown';

          if (
            lastActivityDate &&
            lastActivityDate < threeDaysAgo &&
            lastActivityDate >= sevenDaysAgo &&
            stage !== 'Closed'
          ) {
            needsAttentionDeals.push(deal);
          }

          const hotStages = ['Proposal Sent', 'Negotiation', 'LOI Initiated'];
          if (
            lastActivityDate &&
            lastActivityDate > twentyFourHoursAgo &&
            hotStages.includes(stage)
          ) {
            hotDeals.push(deal);
          }

          if (lastActivityDate && lastActivityDate < sevenDaysAgo) {
            deadDeals.push(deal);
          }
        });

        const fallbackNeedsAttentionDeals =
          needsAttentionDeals.length === 0 &&
          hotDeals.length === 0 &&
          deadDeals.length === 0
            ? deals
            : needsAttentionDeals;

        setStats({
          totalDeals,
          dealsWithIterations,
          staleDealsCount,
          latestActivityByDeal,
          needsAttentionDeals: fallbackNeedsAttentionDeals,
          hotDeals,
          deadDeals,
        });
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, []);

  if (loading || !stats) {
    return <div style={styles.container}>Loading Dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Management Dashboard</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Key Metrics</h2>
        <div style={styles.cardContainer}>
          <StatCard title="Total Deals" value={stats.totalDeals} />
          <StatCard title="Deals with Iterations" value={stats.dealsWithIterations} />
          <StatCard title="Stale Deals (3d+)" value={stats.staleDealsCount} />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Hot Deals 🔥</h2>
        <div>
          {stats.hotDeals.length > 0 ? (
            stats.hotDeals.map((deal: Deal) => (
              <DealListItem
                key={deal.id}
                deal={deal}
                lastActivityDate={stats.latestActivityByDeal[deal.id]}
                onClick={() => router.push(`/deals/${deal.id}`)}
              />
            ))
          ) : (
            <p style={styles.noItemsText}>No hot deals</p>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Needs Attention ⚠️</h2>
        <div>
          {stats.needsAttentionDeals.length > 0 ? (
            stats.needsAttentionDeals.map((deal: Deal) => (
              <DealListItem
                key={deal.id}
                deal={deal}
                lastActivityDate={stats.latestActivityByDeal[deal.id]}
                onClick={() => router.push(`/deals/${deal.id}`)}
              />
            ))
          ) : (
            <p style={styles.noItemsText}>No deals need attention</p>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Dead Deals 💀</h2>
        <div>
          {stats.deadDeals.length > 0 ? (
            stats.deadDeals.map((deal: Deal) => (
              <DealListItem
                key={deal.id}
                deal={deal}
                lastActivityDate={stats.latestActivityByDeal[deal.id]}
                onClick={() => router.push(`/deals/${deal.id}`)}
              />
            ))
          ) : (
            <p style={styles.noItemsText}>No dead deals</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace' },
  title: { fontSize: '28px', marginBottom: '30px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '20px', marginBottom: '15px' },
  cardContainer: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  statCard: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    minWidth: '180px',
  },
  statValue: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0' },
  statLabel: { fontSize: '12px', margin: 0 },
  dealItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    gap: '12px',
    flexWrap: 'wrap',
  },
  dealId: { fontWeight: 'bold' },
  dealStage: {},
  dealActivity: { fontSize: '12px' },
  noItemsText: { fontStyle: 'italic', color: '#666' },
};