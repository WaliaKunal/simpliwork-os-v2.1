'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

// Types based on your app's structure
type Deal = {
  id: string;
  stage?: string;
  [key: string]: any; // Allow other properties
};

type LayoutRequest = {
  id: string;
  deal_id?: string;
  [key: string]: any;
};

// Helper component for a stat card
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div style={styles.statCard}>
    <p style={styles.statValue}>{value}</p>
    <p style={styles.statLabel}>{title}</p>
  </div>
);

export default function ManagementDashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [layoutRequests, setLayoutRequests] = useState<LayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dealsSnap = await getDocs(collection(db, 'deals'));
        const dealsData = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[];
        setDeals(dealsData);

        const requestsSnap = await getDocs(collection(db, 'layout_requests'));
        const requestsData = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LayoutRequest[];
        setLayoutRequests(requestsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading dashboard...</div>;
  }

  // --- CALCULATE STATS ---

  // Section 1: Overview
  const totalDeals = deals.length;
  const dealsByStage = deals.reduce((acc, deal) => {
    const stage = deal.stage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Section 2: Pipeline
  const pipelineStages = ['New', 'Qualified', 'Layout Requested', 'Layout Delivered', 'Proposal Sent', 'Negotiation', 'LOI Initiated', 'LOI Signed'];
  const pipelineCounts = pipelineStages.map(stage => ({
    stage,
    count: dealsByStage[stage] || 0
  }));

  // Section 3: Layout Intelligence
  const totalLayoutRequests = layoutRequests.length;
  const dealsWithAnyRequest = new Set(layoutRequests.map(req => req.deal_id)).size;
  const requestCountsByDeal = layoutRequests.reduce((acc, req) => {
    if(req.deal_id) acc[req.deal_id] = (acc[req.deal_id] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  const dealsWithIterations = Object.values(requestCountsByDeal).filter(count => count > 1).length;

  // Section 4: Conversion Signal
  const loiSignedCount = dealsByStage['LOI Signed'] || 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Management Dashboard</h1>

      {/* Section 1: Overview */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Overview</h2>
        <div style={styles.cardContainer}>
            <StatCard title="Total Deals" value={totalDeals} />
        </div>
        <h3 style={{marginTop: '20px', fontSize:'16px'}}>Deals by Stage</h3>
        <div style={styles.cardContainer}>
            {Object.entries(dealsByStage).map(([stage, count]) => (
              <StatCard key={stage} title={stage} value={count} />
            ))}
        </div>
      </div>

      {/* Section 2: Pipeline */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Pipeline</h2>
        <div style={styles.cardContainer}>
          {pipelineCounts.map(item => (
            <StatCard key={item.stage} title={item.stage} value={item.count} />
          ))}
        </div>
      </div>
      
      {/* Section 3: Layout Intelligence */}
      <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Layout Intelligence</h2>
          <div style={styles.cardContainer}>
              <StatCard title="Total Layout Requests" value={totalLayoutRequests} />
              <StatCard title="Deals w/ Layouts" value={dealsWithAnyRequest} />
              <StatCard title="Deals w/ Iterations (>1)" value={dealsWithIterations} />
          </div>
      </div>

      {/* Section 4: Simple Conversion Signal */}
      <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Simple Conversion Signal</h2>
          <div style={styles.cardContainer}>
              <StatCard title="Deals in LOI Signed" value={loiSignedCount} />
          </div>
      </div>

    </div>
  );
}

// --- STYLES ---
const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '40px', fontFamily: 'monospace', backgroundColor: '#f4f4f9', minHeight: '100vh' },
    title: { fontSize: '28px', marginBottom: '30px', color: '#333' },
    section: { backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '25px', marginBottom: '30px' },
    sectionTitle: { fontSize: '20px', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
    cardContainer: { display: 'flex', flexWrap: 'wrap', gap: '20px' },
    statCard: { backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '20px', minWidth: '150px', textAlign: 'center' },
    statValue: { fontSize: '32px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#007bff' },
    statLabel: { fontSize: '14px', color: '#555', margin: 0 },
};