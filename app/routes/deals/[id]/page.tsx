'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
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
  id: string;
  deal_id: string;
  layout_url?: string;
  revision_notes?: string;
  created_at: any; // Firestore timestamp
  version: number;
};

export default function DealDetail() {
  const params = useParams();
  const stages = ['New', 'Qualified', 'Layout Requested', 'Layout Delivered', 'Proposal Sent', 'Negotiation', 'LOI Initiated', 'LOI Signed', 'Closed'];
  
  // STATE
  const [deal, setDeal] = useState<Deal | null>(null);
  const [stage, setStage] = useState<string>('');
  const [layoutRequests, setLayoutRequests] = useState<LayoutRequest[]>([]);

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

      // 2. Fetch all layout requests for this deal, sorted by creation time
      const q = query(
        collection(db, 'layout_requests'), 
        where("deal_id", "==", params.id),
        orderBy("created_at", "asc")
      );
      const layoutRequestsSnap = await getDocs(q);
      const requests = layoutRequestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LayoutRequest);
      setLayoutRequests(requests);
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

  const requestInitialLayout = async () => {
    if (!deal) return;
    const newStage = 'Layout Requested';
    await updateDoc(doc(db, 'deals', deal.id), { stage: newStage });
    await addDoc(collection(db, 'layout_requests'), {
      deal_id: deal.id,
      company_name: deal.company_name || '',
      building_name: deal.building_name || '',
      created_at: new Date(),
      version: 1,
      revision_notes: 'Initial layout request.',
    });
    alert('Layout v1 requested');
    fetchDealData();
  };
  
  const requestChanges = async () => {
    if (!deal) return;

    const notes = prompt("Please enter your revision notes:");
    if (!notes || !notes.trim()) {
        alert("Revision notes are required to request changes.");
        return;
    }

    const nextVersion = layoutRequests.length + 1;

    try {
        await addDoc(collection(db, 'layout_requests'), {
            deal_id: deal.id,
            company_name: deal.company_name || '',
            building_name: deal.building_name || '',
            created_at: new Date(),
            version: nextVersion,
            revision_notes: notes,
        });
        alert(`Layout v${nextVersion} requested successfully.`);
        fetchDealData(); // Refresh data to show the new request
    } catch (error) {
        console.error("Failed to request changes:", error);
        alert("An error occurred while requesting changes.");
    }
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
        <h2 style={styles.sectionTitle}>Layouts</h2>
        {layoutRequests.length === 0 ? (
             <button onClick={requestInitialLayout} style={styles.buttonBlue}>Request Layout (v1)</button>
        ) : (
            <div>
                {layoutRequests.map((req, index) => (
                    <div key={req.id} style={styles.versionEntry}>
                       <strong style={styles.versionTitle}>Layout v{req.version || (index + 1)}</strong>
                       {req.layout_url ? (
                           <a href={req.layout_url} target="_blank" rel="noopener noreferrer" style={styles.buttonBlue}>Download</a>
                       ) : (
                           <span style={styles.pendingText}>Pending Upload</span>
                       )}
                       {req.revision_notes && <p style={styles.notes}>Notes: {req.revision_notes}</p>}
                    </div>
                ))}
                <button onClick={requestChanges} style={styles.buttonSecondary}>Request Changes</button>
            </div>
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
  buttonBlue: { padding: '10px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '14px', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  buttonSecondary: { padding: '12px 20px', borderRadius: '5px', border: '1px solid #6c757d', backgroundColor: '#6c757d', color: 'white', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px' },
  versionEntry: { borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  versionTitle: { fontSize: '16px' },
  notes: { fontSize: '12px', color: '#666', flexBasis: '100%', paddingTop: '5px' },
  pendingText: { fontSize: '14px', color: '#888', fontStyle: 'italic' },
};