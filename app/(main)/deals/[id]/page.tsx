'use client';

import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
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

type Activity = {
  id: string;
  note: string;
  created_at: Date;
};

export default function DealPage() {
  const params = useParams();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities
  const fetchActivities = async () => {
    if (!dealId) return;

    try {
      const q = query(
        collection(db, 'deal_activities'),
        where('deal_id', '==', dealId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          note: d.note,
          created_at: (d.created_at as Timestamp).toDate(),
        };
      }) as Activity[];

      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  // Fetch deal
  useEffect(() => {
    if (!dealId) {
      setLoading(false);
      return;
    }

    const fetchDeal = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'deals', dealId));

        if (snap.exists()) {
          setDeal({ id: snap.id, ...snap.data() } as Deal);
          await fetchActivities();
        } else {
          setError('Deal not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch deal');
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [dealId]);

  // Add activity
  const addActivity = async () => {
    if (!newNote.trim()) {
      alert('Please enter a note.');
      return;
    }

    try {
      await addDoc(collection(db, 'deal_activities'), {
        deal_id: dealId,
        note: newNote,
        created_at: new Date(),
      });

      setNewNote('');
      await fetchActivities();
    } catch (err) {
      console.error(err);
      setError('Failed to add activity');
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (error) return <div style={{ padding: 40 }}>{error}</div>;
  if (!deal) return <div style={{ padding: 40 }}>Deal not found</div>;

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>{deal.company_name}</h1>

      <p><strong>Stage:</strong> {deal.stage}</p>
      <p><strong>Building:</strong> {deal.building_name}</p>
      <p><strong>Size:</strong> {deal.approx_requirement_size}</p>

      {/* Requirement */}
      <div style={{ marginTop: 30 }}>
        <h3>Requirement</h3>
        <p>{deal.requirement_text || 'No requirement provided'}</p>
      </div>

      {/* Activity Log */}
      <div style={{ marginTop: 40 }}>
        <h2>Activity Log</h2>

        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add update..."
          style={{
            width: '100%',
            padding: 10,
            marginTop: 10,
            marginBottom: 10,
          }}
        />

        <button
          onClick={addActivity}
          style={{
            padding: '10px 15px',
            background: '#007bff',
            color: 'white',
            border: 'none',
          }}
        >
          Add Update
        </button>

        <div style={{ marginTop: 20 }}>
          {activities.map((a) => (
            <div key={a.id} style={{ borderBottom: '1px solid #ddd', padding: 10 }}>
              <p>{a.note}</p>
              <small>{a.created_at.toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}