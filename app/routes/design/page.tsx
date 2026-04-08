'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

type LayoutRequest = {
  id: string;
  company_name?: string;
  building_name?: string;
  deal_id?: string;
  created_at?: Timestamp;
};

export default function DesignPage() {
  const [requests, setRequests] = useState<LayoutRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'layout_requests'));
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LayoutRequest[];
        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching layout requests:", error);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>
        Design Layout Requests
      </h1>

      {requests.length > 0 ? (
        requests.map(request => (
          <div
            key={request.id}
            style={{
              border: '1px solid #ccc',
              padding: 15,
              marginBottom: 15,
              borderRadius: 6
            }}
          >
            <h3>{request.company_name}</h3>
            <p><strong>Building:</strong> {request.building_name || 'N/A'}</p>
            <p><strong>Deal ID:</strong> {request.deal_id || 'N/A'}</p>
            <p>
              <strong>Requested At:</strong>{' '}
              {request.created_at?.seconds
                ? new Date(request.created_at.seconds * 1000).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        ))
      ) : (
        <p>No layout requests found.</p>
      )}
    </div>
  );
}
