/**
 * Management Intelligence Dashboard
 * 
 * Provides an overview of deal pipeline, source performance, sales metrics,
 * building intelligence, and layout request activity.
 * 
 * Fetches data from 'deals' and 'layout_requests' Firestore collections.
 * 
 * STRICT RULES:
 * - Do NOT break existing code
 * - Do NOT change routing
 * - Use only Firestore collections: deals, layout_requests
 * - Avoid TypeScript errors
 */
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../lib/firebase/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

// TypeScript interfaces for our Firestore data
interface Deal {
  id: string;
  stage: string;
  source_name?: string;
  sales_owner_email?: string;
  building_name?: string;
  [key: string]: any; // Allow other properties
}

interface LayoutRequest {
  id: string;
  deal_id: string;
  [key: string]: any; // Allow other properties
}

// Interface for our aggregated statistics
interface Stats {
  totalDeals: number;
  activeDeals: number;
  loiSignedCount: number;
  pipelineByStage: { [key: string]: number };
  dealsBySource: { [key: string]: { total: number; loiSigned: number; conversion: number } };
  salesPerformance: { [key: string]: { total: number; loiSigned: number; active: number } };
  buildingIntelligence: { [key: string]: { total: number; qualified: number } };
  dealsWithMultipleLayouts: number;
  totalLayoutRequests: number;
  avgLayoutsPerDeal: number;
}

export default function ManagementDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        const dealsSnapshot = await getDocs(collection(db, 'deals'));
        const layoutRequestsSnapshot = await getDocs(collection(db, 'layout_requests'));

        const deals = dealsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as Deal));
        const layoutRequests = layoutRequestsSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() } as LayoutRequest));

        // 1. OVERVIEW
        const totalDeals = deals.length;
        const activeDeals = deals.filter(d => d.stage !== 'Closed-Won' && d.stage !== 'Closed-Lost').length;
        const loiSignedCount = deals.filter(d => d.stage === 'LOI Signed').length;

        // 2. PIPELINE
        const pipelineByStage = deals.reduce((acc, deal) => {
          const stage = deal.stage || 'No Stage';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        // 3. SOURCE / IPC INTELLIGENCE
        const dealsBySource: Stats['dealsBySource'] = {};
        deals.forEach(deal => {
          const source = deal.source_name || 'Unknown';
          if (!dealsBySource[source]) {
            dealsBySource[source] = { total: 0, loiSigned: 0, conversion: 0 };
          }
          dealsBySource[source].total++;
          if (deal.stage === 'LOI Signed') {
            dealsBySource[source].loiSigned++;
          }
        });
        Object.values(dealsBySource).forEach(sourceStats => {
          sourceStats.conversion = sourceStats.total > 0 ? (sourceStats.loiSigned / sourceStats.total) * 100 : 0;
        });

        // 4. SALES PERFORMANCE
        const salesPerformance: Stats['salesPerformance'] = {};
        deals.forEach(deal => {
          const owner = deal.sales_owner_email || 'Unassigned';
          if (!salesPerformance[owner]) {
            salesPerformance[owner] = { total: 0, loiSigned: 0, active: 0 };
          }
          salesPerformance[owner].total++;
          if (deal.stage === 'LOI Signed') {
            salesPerformance[owner].loiSigned++;
          }
          if (deal.stage !== 'Closed-Won' && deal.stage !== 'Closed-Lost') {
            salesPerformance[owner].active++;
          }
        });

        // 5. BUILDING INTELLIGENCE
        const buildingIntelligence: Stats['buildingIntelligence'] = {};
        deals.forEach(deal => {
          const building = deal.building_name || 'N/A';
          if (!buildingIntelligence[building]) {
            buildingIntelligence[building] = { total: 0, qualified: 0 };
          }
          buildingIntelligence[building].total++;
          if (deal.stage === 'Qualified') {
            buildingIntelligence[building].qualified++;
          }
        });

        // 6. ACTIVITY SIGNALS
        const layoutRequestsByDeal = layoutRequests.reduce((acc, req) => {
          if (req.deal_id) {
            acc[req.deal_id] = (acc[req.deal_id] || 0) + 1;
          }
          return acc;
        }, {} as { [key: string]: number });
        const dealsWithMultipleLayouts = Object.values(layoutRequestsByDeal).filter(count => count > 1).length;

        // 7. LAYOUT INTELLIGENCE
        const totalLayoutRequests = layoutRequests.length;
        const avgLayoutsPerDeal = totalDeals > 0 ? totalLayoutRequests / totalDeals : 0;

        setStats({
          totalDeals,
          activeDeals,
          loiSignedCount,
          pipelineByStage,
          dealsBySource,
          salesPerformance,
          buildingIntelligence,
          dealsWithMultipleLayouts,
          totalLayoutRequests,
          avgLayoutsPerDeal,
        });

      } catch (error) {
        console.error("Error building dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading Management Dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-center text-red-500">Error loading dashboard data. Check console for details.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Management Intelligence Dashboard</h1>

      {/* OVERVIEW */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{stats.totalDeals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">{stats.activeDeals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>LOI Signed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">{stats.loiSignedCount}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Pipeline</h2>
        <Card>
          <CardHeader>
            <CardTitle>Deals by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(stats.pipelineByStage).sort(([,a],[,b]) => b-a).map(([stage, count]) => (
                <div key={stage} className="p-4 bg-gray-100 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-gray-600">{stage}</h3>
                  <p className="text-3xl font-bold text-gray-800">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SOURCE / IPC INTELLIGENCE */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Source / IPC Intelligence</h2>
        <Card>
          <CardHeader>
            <CardTitle>Deal Source Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead>Total Deals</TableHead>
                  <TableHead>LOI Signed</TableHead>
                  <TableHead>Conversion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.dealsBySource).map(([source, data]) => (
                  <TableRow key={source}>
                    <TableCell className="font-medium">{source}</TableCell>
                    <TableCell>{data.total}</TableCell>
                    <TableCell>{data.loiSigned}</TableCell>
                    <TableCell>{data.conversion.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* SALES PERFORMANCE */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Sales Performance</h2>
        <Card>
          <CardHeader>
            <CardTitle>Performance by Sales Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Owner</TableHead>
                  <TableHead>Total Deals</TableHead>
                  <TableHead>Active Deals</TableHead>
                  <TableHead>LOI Signed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.salesPerformance).map(([owner, data]) => (
                  <TableRow key={owner}>
                    <TableCell className="font-medium">{owner}</TableCell>
                    <TableCell>{data.total}</TableCell>
                    <TableCell>{data.active}</TableCell>
                    <TableCell>{data.loiSigned}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* BUILDING INTELLIGENCE */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Building Intelligence</h2>
        <Card>
          <CardHeader>
            <CardTitle>Deals by Building</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Building Name</TableHead>
                  <TableHead>Total Deals</TableHead>
                  <TableHead>Qualified Deals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.buildingIntelligence)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([building, data]) => (
                  <TableRow key={building} className={data.qualified < 1 ? 'bg-yellow-100' : ''}>
                    <TableCell className="font-medium">{building}</TableCell>
                    <TableCell>{data.total}</TableCell>
                    <TableCell>{data.qualified}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-gray-500 mt-2">* Buildings with zero qualified deals are highlighted.</p>
          </CardContent>
        </Card>
      </section>

      {/* ACTIVITY & LAYOUT INTELLIGENCE */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Activity & Layout Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Layout Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-cyan-600">{stats.totalLayoutRequests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Layouts per Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-cyan-600">{stats.avgLayoutsPerDeal.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Deals w/ >1 Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600">{stats.dealsWithMultipleLayouts}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
