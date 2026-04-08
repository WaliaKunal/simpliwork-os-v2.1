"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebase';

// --- Interfaces ---
interface Deal {
  id: string;
  stage?: string;
  source_name?: string;
  sales_owner_email?: string;
  building_name?: string;
}

interface LayoutRequest {
  id: string;
  deal_id: string;
}

interface Stats {
  // Overview
  totalDeals: number;
  activeDeals: number;
  loiSignedCount: number;

  // Pipeline
  dealsByStage: Record<string, number>;

  // Source / IPC Intelligence
  dealsBySource: Record<string, number>;
  loiBySource: Record<string, number>;
  conversionBySource: Record<string, string>;

  // Sales Performance
  dealsBySalesOwner: Record<string, number>;
  loiBySalesOwner: Record<string, number>;
  activeDealsBySalesOwner: Record<string, number>;

  // Building Intelligence
  dealsByBuilding: Record<string, number>;
  qualifiedDealsByBuilding: Record<string, number>;

  // Activity Signals
  stuckDealsCount: number;
  dealsWithMultipleLayouts: number;

  // Layout Intelligence
  totalLayoutRequests: number;
  avgLayoutsPerDeal: string;
}

// --- UI Components ---
const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
    {children}
  </section>
);

// --- Main Dashboard Page ---
export default function ManagementDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const dealsSnapshot = await getDocs(collection(db, 'deals'));
        const layoutRequestsSnapshot = await getDocs(collection(db, 'layout_requests'));

        const deals: Deal[] = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
        const layoutRequests: LayoutRequest[] = layoutRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LayoutRequest));

        // 1. OVERVIEW
        const totalDeals = deals.length;
        const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
        const loiSignedCount = deals.filter(d => d.stage === 'LOI Signed').length;

        // 2. PIPELINE
        const dealsByStage = deals.reduce((acc, deal) => {
          const stage = deal.stage || 'No Stage';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // 3. SOURCE / IPC INTELLIGENCE
        const dealsBySource: Record<string, number> = {};
        const loiBySource: Record<string, number> = {};
        deals.forEach(deal => {
            const source = deal.source_name || 'Unknown';
            dealsBySource[source] = (dealsBySource[source] || 0) + 1;
            if (deal.stage === 'LOI Signed') {
                loiBySource[source] = (loiBySource[source] || 0) + 1;
            }
        });
        const conversionBySource: Record<string, string> = {};
        Object.keys(dealsBySource).forEach(source => {
            const total = dealsBySource[source];
            const lois = loiBySource[source] || 0;
            const conversion = total > 0 ? (lois / total) * 100 : 0;
            conversionBySource[source] = `${conversion.toFixed(1)}%`;
        });

        // 4. SALES PERFORMANCE
        const dealsBySalesOwner: Record<string, number> = {};
        const loiBySalesOwner: Record<string, number> = {};
        const activeDealsBySalesOwner: Record<string, number> = {};
        deals.forEach(deal => {
            const owner = deal.sales_owner_email || 'Unassigned';
            dealsBySalesOwner[owner] = (dealsBySalesOwner[owner] || 0) + 1;
            if (deal.stage === 'LOI Signed') {
                loiBySalesOwner[owner] = (loiBySalesOwner[owner] || 0) + 1;
            }
            if (deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost') {
                activeDealsBySalesOwner[owner] = (activeDealsBySalesOwner[owner] || 0) + 1;
            }
        });

        // 5. BUILDING INTELLIGENCE
        const dealsByBuilding: Record<string, number> = {};
        const qualifiedDealsByBuilding: Record<string, number> = {};
        deals.forEach(deal => {
            const building = deal.building_name || 'Unknown';
            dealsByBuilding[building] = (dealsByBuilding[building] || 0) + 1;
            if (deal.stage === 'Qualified') {
                qualifiedDealsByBuilding[building] = (qualifiedDealsByBuilding[building] || 0) + 1;
            }
        });

        // 6. ACTIVITY SIGNALS
        const stuckDealsCount = deals.filter(d => ['Touring', 'Layout Requested'].includes(d.stage || '')).length;
        const layoutsPerDeal = layoutRequests.reduce((acc, req) => {
            if(req.deal_id) acc[req.deal_id] = (acc[req.deal_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const dealsWithMultipleLayouts = Object.values(layoutsPerDeal).filter(count => count > 1).length;

        // 7. LAYOUT INTELLIGENCE
        const totalLayoutRequests = layoutRequests.length;
        const avgLayoutsPerDeal = totalDeals > 0 ? (totalLayoutRequests / totalDeals).toFixed(2) : '0.00';
        
        setStats({
          totalDeals,
          activeDeals,
          loiSignedCount,
          dealsByStage,
          dealsBySource,
          loiBySource,
          conversionBySource,
          dealsBySalesOwner,
          loiBySalesOwner,
          activeDealsBySalesOwner,
          dealsByBuilding,
          qualifiedDealsByBuilding,
          stuckDealsCount,
          dealsWithMultipleLayouts,
          totalLayoutRequests,
          avgLayoutsPerDeal
        });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please check the console for more details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading Management Dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!stats) {
    return <div className="p-6 text-center">No data available to display.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Management Intelligence Dashboard</h1>
      </header>

      <Section title="Overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Deals" value={stats.totalDeals} />
          <StatCard title="Active Deals" value={stats.activeDeals} />
          <StatCard title="LOI Signed" value={stats.loiSignedCount} />
        </div>
      </Section>
      
      <Section title="Pipeline">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.dealsByStage).sort(([,a],[,b]) => b - a).map(([stage, count]) => (
                <StatCard key={stage} title={stage} value={count} />
            ))}
        </div>
      </Section>

      <Section title="Source / IPC Intelligence">
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Source</th>
                <th className="py-3 px-6 text-center">Total Deals</th>
                <th className="py-3 px-6 text-center">LOI Signed</th>
                <th className="py-3 px-6 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {Object.keys(stats.dealsBySource).sort((a,b) => stats.dealsBySource[b] - stats.dealsBySource[a]).map(source => (
                <tr key={source} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left font-medium">{source}</td>
                  <td className="py-3 px-6 text-center">{stats.dealsBySource[source] || 0}</td>
                  <td className="py-3 px-6 text-center">{stats.loiBySource[source] || 0}</td>
                  <td className="py-3 px-6 text-right">{stats.conversionBySource[source] || '0.0%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Sales Performance">
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Sales Owner</th>
                <th className="py-3 px-6 text-center">Total Deals</th>
                <th className="py-3 px-6 text-center">Active Deals</th>
                <th className="py-3 px-6 text-center">LOI Signed</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {Object.keys(stats.dealsBySalesOwner).sort((a,b) => stats.dealsBySalesOwner[b] - stats.dealsBySalesOwner[a]).map(owner => (
                <tr key={owner} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left font-medium">{owner}</td>
                  <td className="py-3 px-6 text-center">{stats.dealsBySalesOwner[owner] || 0}</td>
                  <td className="py-3 px-6 text-center">{stats.activeDealsBySalesOwner[owner] || 0}</td>
                  <td className="py-3 px-6 text-center">{stats.loiBySalesOwner[owner] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      
      <Section title="Building Intelligence">
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Building</th>
                <th className="py-3 px-6 text-center">Total Deals</th>
                <th className="py-3 px-6 text-center">Qualified Deals</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {Object.keys(stats.dealsByBuilding).sort((a,b) => stats.dealsByBuilding[b] - stats.dealsByBuilding[a]).map(building => (
                <tr key={building} className={`border-b border-gray-200 hover:bg-gray-100 ${(stats.qualifiedDealsByBuilding[building] || 0) === 0 ? 'bg-yellow-100' : ''}`}>
                  <td className="py-3 px-6 text-left font-medium">{building}</td>
                  <td className="py-3 px-6 text-center">{stats.dealsByBuilding[building] || 0}</td>
                  <td className="py-3 px-6 text-center">{stats.qualifiedDealsByBuilding[building] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 mt-2">* Buildings with 0 Qualified deals are highlighted.</p>
      </Section>

      <Section title="Activity Signals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Deals in 'Stuck' Stages" value={stats.stuckDealsCount} />
          <StatCard title="Deals w/ Multiple Layouts" value={stats.dealsWithMultipleLayouts} />
        </div>
      </Section>

      <Section title="Layout Intelligence">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Total Layout Requests" value={stats.totalLayoutRequests} />
          <StatCard title="Avg Layouts per Deal" value={stats.avgLayoutsPerDeal} />
        </div>
      </Section>

    </div>
  );
}
