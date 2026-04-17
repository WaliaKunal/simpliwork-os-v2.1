'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useRouter } from 'next/navigation';

type Deal = {
  id: string;
  company_name?: string;
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
    <span style={styles.dealId}>
      {deal.company_name || deal.id}
    </span>
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

        const layoutSnap = await getDocs(collection(db, 'layout_requests'));
        const layoutRequests = layoutSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LayoutRequest[];

        const activitySnap = await getDocs(collection(db, 'deal_activities'));
        const activities = activitySnap.docs.map(d => ({ id: d.id, ...d.data() })) as DealActivity[];

        const totalDeals = deals.length;

        // --- Layout iterations ---
        const requestCountsByDeal: { [key: string]: number } = {};
        layoutRequests.forEach(req => {
          if (req.deal_id) {
            requestCountsByDeal[req.deal_id] = (requestCountsByDeal[req.deal_id] || 0) + 1;
          }
        });

        const dealsWithIterations = Object.values(requestCountsByDeal).filter(c => c > 1).length;

        // --- Activity mapping ---
        const latestActivityByDeal: { [key: string]: Date } = {};

        activities.forEach(a => {
          if (a.deal_id && a.created_at) {
            const date = a.created_at?.toDate
              ? a.created_at.toDate()
              : new Date(a.created_at);

            if (!latestActivityByDeal[a.deal_id] || date > latestActivityByDeal[a.deal_id]) {
              latestActivityByDeal[a.deal_id] = date;
            }
          }
        });

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // --- CEO METRICS ---
        const noActivityDeals = deals.filter(d => !latestActivityByDeal[d.id]).length;

        // --- INTELLIGENCE ENGINE (SCORING) ---
        const scoredDeals: { deal: Deal; score: number }[] = [];

        deals.forEach(deal => {
          const lastActivity = latestActivityByDeal[deal.id];
          const stage = deal.stage || 'Unknown';

          let score = 0;

          // Stage importance
          if (stage === 'Negotiation') score += 5;
          if (stage === 'LOI Initiated') score += 6;
          if (stage === 'Proposal Sent') score += 4;

          // Recency
          if (lastActivity) {
            if (lastActivity > last24h) score += 3;
            else if (lastActivity > last3d) score += 1;
            else score -= 2;
          } else {
            score -= 3;
          }

          scoredDeals.push({ deal, score });
        });

        // Sort by importance
        scoredDeals.sort((a, b) => b.score - a.score);

        const hotDeals = scoredDeals.filter(d => d.score >= 6).map(d => d.deal);
        const needsAttentionDeals = scoredDeals.filter(d => d.score >= 2 && d.score < 6).map(d => d.deal);
        const deadDeals = scoredDeals.filter(d => d.score < 2).map(d => d.deal);

        setStats({
          totalDeals,
          dealsWithIterations,
          noActivityDeals,
          latestActivityByDeal,
          hotDeals,
          needsAttentionDeals,
          deadDeals,
        });

      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, []);

  if (loading || !stats) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Management Dashboard</h1>

      <div style={styles.cardContainer}>
        <StatCard title="Total Deals" value={stats.totalDeals} />
        <StatCard title="Deals with Iterations" value={stats.dealsWithIterations} />
        <StatCard title="No Activity Deals" value={stats.noActivityDeals} />
      </div>

      <Section
        title="🔥 Hot Deals"
        deals={stats.hotDeals}
        latest={stats.latestActivityByDeal}
        router={router}
      />

      <Section
        title="⚠️ Needs Attention"
        deals={stats.needsAttentionDeals}
        latest={stats.latestActivityByDeal}
        router={router}
      />

      <Section
        title="💀 Dead Deals"
        deals={stats.deadDeals}
        latest={stats.latestActivityByDeal}
        router={router}
      />
    </div>
  );
}

// --- Reusable section ---
function Section({ title, deals, latest, router }: any) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>

      {deals.length === 0 ? (
        <p style={styles.noItemsText}>None</p>
      ) : (
        deals.map((deal: Deal) => (
          <DealListItem
            key={deal.id}
            deal={deal}
            lastActivityDate={latest[deal.id]}
            onClick={() => router.push(`/deals/${deal.id}`)}
          />
        ))
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace' },
  title: { fontSize: '28px', marginBottom: '30px' },
  cardContainer: { display: 'flex', gap: '20px', marginBottom: '30px' },

  statCard: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    minWidth: '180px',
  },
  statValue: { fontSize: '24px', fontWeight: 'bold' },
  statLabel: { fontSize: '12px' },

  section: { marginBottom: '30px' },
  sectionTitle: { fontSize: '20px', marginBottom: '10px' },

  dealItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  },

  dealId: { fontWeight: 'bold' },
  dealStage: {},
  dealActivity: { fontSize: '12px' },

  noItemsText: { fontStyle: 'italic', color: '#888' },
};