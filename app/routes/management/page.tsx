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
  created_at: any; // Firestore Timestamp or Date
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

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        // Fetch data
        const dealsSnap = await getDocs(collection(db, 'deals'));
        const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[];

        const requestsSnap = await getDocs(collection(db, 'layout_requests'));
        const layoutRequests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LayoutRequest[];
        
        const activitiesSnap = await getDocs(collection(db, 'deal_activities'));
        const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DealActivity[];

        // --- Existing Calculations ---
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

        const dealsWithMoreThanOneRequest = Object.values(requestCountsByDeal).filter(count => count > 1).length;

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

        // --- Pipeline Health ---
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

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const staleDealsCount = deals.filter(deal => {
          const lastActivityDate = latestActivityByDeal[deal.id];
          return lastActivityDate && lastActivityDate < threeDaysAgo;
        }).length;

        // Final stats object
        setStats({
          totalDeals,
          dealsByStage,
          layoutRequested: dealsByStage['Layout Requested'] || 0,
          layoutDelivered: dealsByStage['Layout Delivered'] || 0,
          totalLayoutRequests: layoutRequests.length,
          dealsWithIterations: dealsWithMoreThanOneRequest,
          loiSigned: dealsByStage['LOI Signed'] || 0,
          dealsBySalesOwner,
          activeDealsBySalesOwner,
          dealsBySource,
          staleDealsCount,
        });

      } catch (error) {
        console.error("Failed to generate dashboard data:", error);
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
          <StatCard title="Total Layout Requests" value={stats.totalLayoutRequests} />
          <StatCard title="Deals in LOI Signed" value={stats.loiSigned} />
          <StatCard title="Deals with >1 Layout Request" value={stats.dealsWithIterations} />
          <StatCard title="Stale Deals (3d+)" value={stats.staleDealsCount} />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Deal Stages</h2>
        <div style={styles.cardContainer}>
          {Object.entries(stats.dealsByStage || {}).map(([stage, count]) => (
            <StatCard key={stage} title={stage} value={count as number} />
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Layout Funnel</h2>
        <div style={styles.cardContainer}>
          <StatCard title="Layout Requested" value={stats.layoutRequested} />
          <StatCard title="Layout Delivered" value={stats.layoutDelivered} />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sales Performance</h2>
        <div style={styles.cardContainer}>
          {Object.keys(stats.dealsBySalesOwner).map(owner => (
            <div key={owner} style={styles.groupedCardContainer}>
              <h3 style={styles.groupedCardTitle}>
                {owner.includes('@') ? owner.split('@')[0] : owner}
              </h3>
              <StatCard title="Total Deals" value={stats.dealsBySalesOwner[owner]} />
              <StatCard title="Active Deals" value={stats.activeDealsBySalesOwner[owner] || 0} />
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Source Performance</h2>
        <div style={styles.cardContainer}>
          {Object.entries(stats.dealsBySource).map(([source, count]) => (
            <StatCard key={source} title={source} value={count as number} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace', backgroundColor: '#f4f4f9' },
  title: { fontSize: '28px', marginBottom: '30px', color: '#333' },
  section: { backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '25px', marginBottom: '30px' },
  sectionTitle: { fontSize: '20px', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
  cardContainer: { display: 'flex', flexWrap: 'wrap', gap: '20px' },
  statCard: { backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '20px', minWidth: '180px', textAlign: 'center' },
  statValue: { fontSize: '32px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#007bff' },
  statLabel: { fontSize: '14px', color: '#555', margin: 0 },
  groupedCardContainer: { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' },
  groupedCardTitle: { fontSize: '16px', textAlign: 'center', margin: '0 0 10px 0', color: '#333', fontWeight: 'bold' },
};