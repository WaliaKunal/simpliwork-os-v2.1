'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

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

const DealListItem = ({ deal, lastActivityDate }: { deal: Deal; lastActivityDate?: Date }) => (
  <div style={styles.dealItem}>
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

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        const dealsSnap = await getDocs(collection(db, 'deals'));
        const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[];

        const requestsSnap = await getDocs(collection(db, 'layout_requests'));
        const layoutRequests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LayoutRequest[];

        const activitiesSnap = await getDocs(collection(db, 'deal_activities'));
        const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DealActivity[];

        // --- Base Metrics ---
        const totalDeals = deals.length;

        const dealsByStage = deals.reduce((acc, deal) => {
          const stage = deal.stage || 'Unknown';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        const requestCountsByDeal = layoutRequests.reduce((acc, req) => {
          if (req.deal_id) acc[req.deal_id] = (acc[req.deal_id] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // ✅ FIX: define dealsWithIterations properly
        const dealsWithIterations = Object.values(requestCountsByDeal).filter(count => count > 1).length;

        // --- Sales Performance ---
        const dealsBySalesOwner: { [key: string]: number } = {};
        const activeDealsBySalesOwner: { [key: string]: number } = {};

        deals.forEach(deal => {
          const owner = deal.sales_owner_email || 'Unassigned';
          dealsBySalesOwner[owner] = (dealsBySalesOwner[owner] || 0) + 1;

          const isActive = deal.stage !== 'Closed' && deal.stage !== 'Lost';
          if (isActive) {
            activeDealsBySalesOwner[owner] = (activeDealsBySalesOwner[owner] || 0) + 1;
          }
        });

        // --- Source Performance ---
        const dealsBySource = deals.reduce((acc, deal) => {
          const source = deal.source_name || 'Unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // --- Activity Mapping ---
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

        // --- Priority Engine ---
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

        setStats({
          totalDeals,
          dealsByStage,
          layoutRequested: dealsByStage['Layout Requested'] || 0,
          layoutDelivered: dealsByStage['Layout Delivered'] || 0,
          totalLayoutRequests: layoutRequests.length,
          dealsWithIterations,
          loiSigned: dealsByStage['LOI Signed'] || 0,
          dealsBySalesOwner,
          activeDealsBySalesOwner,
          dealsBySource,
          staleDealsCount,
          latestActivityByDeal,
          needsAttentionDeals,
          hotDeals,
          deadDeals,
        });

      } catch (error) {
        console.error("Dashboard error:", error);
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
        {stats.hotDeals.map((d: Deal) => (
          <DealListItem key={d.id} deal={d} lastActivityDate={stats.latestActivityByDeal[d.id]} />
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Needs Attention ⚠️</h2>
        {stats.needsAttentionDeals.map((d: Deal) => (
          <DealListItem key={d.id} deal={d} lastActivityDate={stats.latestActivityByDeal[d.id]} />
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Dead Deals 💀</h2>
        {stats.deadDeals.map((d: Deal) => (
          <DealListItem key={d.id} deal={d} lastActivityDate={stats.latestActivityByDeal[d.id]} />
        ))}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace' },
  title: { fontSize: '28px', marginBottom: '30px' },
  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '20px', marginBottom: '15px' },
  cardContainer: { display: 'flex', gap: '20px' },
  statCard: { padding: '20px', border: '1px solid #ddd' },
  statValue: { fontSize: '24px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px' },
  dealItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' },
  dealId: { fontWeight: 'bold' },
  dealStage: {},
  dealActivity: { fontSize: '12px' },
};