'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useParams } from 'next/navigation';

// TYPES
type Deal = {
  id: string;
  company_name?: string;
  approx_requirement_size?: number;
  stage?: string;
  building_name?: string;
  requirement_text?: string;
};

type LayoutRequest = {
  deal_id: string;
  layout_url?: string;
};

export default function DealDetail() {
  const params = useParams();
  const stages = ['New', 'Qualified', 'Layout Requested', 'Layout Delivered', 'Proposal Sent', 'Negotiation', 'LOI Initiated', 'LOI Signed', 'Closed'];
  
  // STATE
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stage, setStage] = useState<string>('');
  const [layoutUrl, setLayoutUrl] = useState<string | null>(null);

  // DATA FETCHING
  const fetchDealData = async () => {
    if (!params.id) return;

    // 1. Fetch Deal
    const dealDocRef = doc(db, 'deals', params.id as string);
    const dealSnap = await getDoc(dealDocRef);

    if (dealSnap.exists()) {
      const dealData = { id: dealSnap.id, ...dealSnap.data() } as Deal;
      setDeal(dealData);
      setStage(dealData.stage || 'New');

      // 2. Fetch Layout Request to find layout_url
      const layoutRequestsCollection = collection(db, 'layout_requests');
      const layoutRequestsSnap = await getDocs(layoutRequestsCollection);
      const matchingRequest = layoutRequestsSnap.docs
        .map(doc => doc.data() as LayoutRequest)
        .find(req => req.deal_id === params.id);

      if (matchingRequest && matchingRequest.layout_url) {
        setLayoutUrl(matchingRequest.layout_url);
      } else {
        setLayoutUrl(null);
      }
    }
  };

  useEffect(() => {
    fetchDealData();
  }, [params.id]);

  // ACTIONS
  const updateStage = async () => {
    if (!deal) return;
    await updateDoc(doc(db, 'deals', deal.id), { stage: stage });
    alert('Stage updated');
    fetchDealData(); // Re-fetch to reflect changes
  };

  const requestLayout = async () => {
    if (!deal) return;
    const newStage = 'Layout Requested';
    await updateDoc(doc(db, 'deals', deal.id), { stage: newStage });
    await addDoc(collection(db, 'layout_requests'), {
      deal_id: deal.id,
      company_name: deal.company_name || '',
      building_name: deal.building_name || '',
      created_at: new Date(),
    });
    alert('Layout requested');
    // Update local state for instant UI feedback
    setDeal(prev => (prev ? { ...prev, stage: newStage } : null));
    setStage(newStage);
  };

  if (!deal) {
    return <div style={styles.container}><p>Loading...</p></div>;
  }

  // RENDER
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.companyName}>{deal.company_name}</h1>
        <span style={{ ...styles.badge, ...styles.badgeStage }}>{deal.stage}</span>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Requirement</h2>
        <div style={styles.requirementBox}>
          <p>{deal.requirement_text || 'No specific requirements detailed.'}</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Building & Size</h2>
        <p><strong>Building:</strong> {deal.building_name || 'N/A'}</p>
        <p><strong>Approx. Size:</strong> {deal.approx_requirement_size ? `${deal.approx_requirement_size} sqft` : 'N/A'}</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Layout</h2>
        {layoutUrl ? (
          <a href={layoutUrl} target="_blank" rel="noopener noreferrer" style={styles.buttonBlue}>Download Layout</a>
        ) : deal.stage === 'Layout Requested' ? (
          <p>Layout pending delivery.</p>
        ) : (
          <button onClick={requestLayout} style={styles.buttonBlue}>Request Layout</button>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Update Stage</h2>
        <div style={styles.actionContainer}>
          <select value={stage} onChange={e => setStage(e.target.value)} style={styles.select}>
            {stages.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <button onClick={updateStage} style={styles.buttonGreen}>Save Stage</button>
        </div>
      </div>
    </div>
  );
}

// STYLES
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto', color: '#333' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '30px' },
  companyName: { fontSize: '36px', margin: 0, color: '#111' },
  badge: { padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: 'white', textTransform: 'capitalize' },
  badgeStage: { backgroundColor: '#007bff' },
  section: { border: '1px solid #ddd', borderRadius: '8px', padding: '25px', marginBottom: '30px', backgroundColor: '#fff' },
  sectionTitle: { fontSize: '22px', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' },
  requirementBox: { backgroundColor: '#f9f9f9', border: '1px solid #eee', padding: '20px', borderRadius: '6px', lineHeight: '1.6' },
  actionContainer: { display: 'flex', alignItems: 'center' },
  select: { padding: '12px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', flex: 1 },
  buttonGreen: { padding: '12px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#28a745', color: 'white', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' },
  buttonBlue: { padding: '12px 20px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }
};