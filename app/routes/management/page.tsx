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

type DealActivity = {
  id: string;
  deal_id: string;
  created_at: any;
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div style={styles.statCard}>
    <div style={styles.statValue}>{value}</div>
    <div style={styles.statLabel}>{title}</div>
  </div>
);

export default function Page() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const dealsSnap = await getDocs(collection(db, 'deals'));
      const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Deal[];

      const actSnap = await getDocs(collection(db, 'deal_activities'));
      const activities = actSnap.docs.map(d => ({ id: d.id, ...d.data() })) as DealActivity[];

      const latest: any = {};

      activities.forEach(a => {
        const dt = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
        if (!latest[a.deal_id] || dt > latest[a.deal_id]) {
          latest[a.deal_id] = dt;
        }
      });

      const now = new Date();
      const last3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // --- PRIORITY ENGINE ---
      const scored: any[] = [];

      deals.forEach(d => {
        const last = latest[d.id];
        const stage = d.stage || '';

        let score = 0;

        if (stage === 'Negotiation') score += 5;
        if (stage === 'LOI Initiated') score += 6;
        if (stage === 'Proposal Sent') score += 4;

        if (last) {
          if (last > new Date(now.getTime() - 24 * 60 * 60 * 1000)) score += 3;
          else if (last > last3d) score += 1;
          else score -= 2;
        } else {
          score -= 3;
        }

        scored.push({ deal: d, score });
      });

      scored.sort((a, b) => b.score - a.score);

      const hot = scored.filter(x => x.score >= 6).map(x => x.deal);
      const attention = scored.filter(x => x.score >= 2 && x.score < 6).map(x => x.deal);
      const dead = scored.filter(x => x.score < 2).map(x => x.deal);

      // --- SALES PERFORMANCE ---
      const sales: any = {};
      deals.forEach(d => {
        const owner = d.sales_owner_email || 'Unassigned';
        if (!sales[owner]) sales[owner] = { total: 0, active: 0 };

        sales[owner].total++;

        if (d.stage !== 'Closed' && d.stage !== 'Lost') {
          sales[owner].active++;
        }
      });

      // --- SOURCE PERFORMANCE ---
      const source: any = {};
      deals.forEach(d => {
        const s = d.source_name || 'Unknown';
        source[s] = (source[s] || 0) + 1;
      });

      // --- PIPELINE HEALTH ---
      const stageCount: any = {};
      deals.forEach(d => {
        const st = d.stage || 'Unknown';
        stageCount[st] = (stageCount[st] || 0) + 1;
      });

      setData({
        total: deals.length,
        hot,
        attention,
        dead,
        latest,
        sales,
        source,
        stageCount,
      });
    };

    run();
  }, []);

  if (!data) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1>Management Dashboard</h1>

      {/* --- KEY --- */}
      <div style={styles.row}>
        <StatCard title="Total Deals" value={data.total} />
        <StatCard title="Hot Deals" value={data.hot.length} />
        <StatCard title="Needs Attention" value={data.attention.length} />
        <StatCard title="Dead Deals" value={data.dead.length} />
      </div>

      {/* --- HOT --- */}
      <Section title="🔥 Hot Deals" deals={data.hot} latest={data.latest} router={router} />

      <Section title="⚠️ Needs Attention" deals={data.attention} latest={data.latest} router={router} />

      <Section title="💀 Dead Deals" deals={data.dead} latest={data.latest} router={router} />

      {/* --- SALES --- */}
      <h2>Sales Performance</h2>
      {Object.entries(data.sales).map(([k, v]: any) => (
        <div key={k} style={styles.line}>
          {k.split('@')[0]} → Total: {v.total} | Active: {v.active}
        </div>
      ))}

      {/* --- SOURCE --- */}
      <h2>Source Performance</h2>
      {Object.entries(data.source).map(([k, v]: any) => (
        <div key={k} style={styles.line}>
          {k} → {v}
        </div>
      ))}

      {/* --- PIPELINE --- */}
      <h2>Pipeline Distribution</h2>
      {Object.entries(data.stageCount).map(([k, v]: any) => (
        <div key={k} style={styles.line}>
          {k} → {v}
        </div>
      ))}
    </div>
  );
}

function Section({ title, deals, latest, router }: any) {
  return (
    <>
      <h2>{title}</h2>
      {deals.length === 0 ? (
        <div style={{ fontStyle: 'italic' }}>None</div>
      ) : (
        deals.map((d: Deal) => (
          <div
            key={d.id}
            style={styles.deal}
            onClick={() => router.push(`/deals/${d.id}`)}
          >
            {d.company_name || d.id} | {d.stage} |{' '}
            {latest[d.id] ? latest[d.id].toLocaleString() : 'No activity'}
          </div>
        ))
      )}
    </>
  );
}

const styles: any = {
  container: { padding: 40, fontFamily: 'monospace' },
  row: { display: 'flex', gap: 20, marginBottom: 20 },
  statCard: { border: '1px solid #ccc', padding: 15 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },

  deal: {
    padding: 10,
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
  },

  line: {
    padding: 6,
  },
};