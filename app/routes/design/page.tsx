'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/lib/firebase/firebase';
import { storage } from '@/lib/firebase/firebase';

type LayoutRequest = {
  id: string;
  company_name?: string;
  building_name?: string;
  deal_id?: string;
};

export default function DesignPage() {
  const [requests, setRequests] = useState<LayoutRequest[]>([]);
  const [files, setFiles] = useState<{[key:string]: File | null}>({});

  useEffect(() => {
    const fetchRequests = async () => {
      const snap = await getDocs(collection(db, 'layout_requests'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LayoutRequest[];
      setRequests(list);
    };
    fetchRequests();
  }, []);

  const handleFileChange = (id: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [id]: file }));
  };

  const uploadLayout = async (req: LayoutRequest) => {
    console.log("upload started");
    const file = files[req.id];

    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      console.log("Selected file:", file.name);

      const storageRef = ref(storage, 'layouts/' + req.deal_id + '/' + file.name);
      await uploadBytes(storageRef, file);
      console.log("File uploaded to storage");

      const url = await getDownloadURL(storageRef);
      console.log("Download URL:", url);

      // Save URL in layout_requests
      await updateDoc(doc(db, 'deals', req.deal_id), {
        stage: 'Layout Delivered',
      });

      // Update deal stage
      if (req.deal_id) {
        await updateDoc(doc(db, 'deals', req.deal_id), {
          stage: 'Layout Delivered', updatedAt: new Date()
        });
      }

      alert('Layout uploaded successfully!');
    } catch (error: any) {
      console.error("Upload failed:", error);
      alert('Upload failed: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Design Dashboard</h1>

      {requests.map(r => (
        <div key={r.id} style={{ border:'1px solid #ccc', padding:15, marginBottom:15 }}>
          <p><strong>{r.company_name}</strong></p>
          <p>Building: {r.building_name}</p>

          <input
            type="file"
            accept="application/pdf"
            onChange={e => handleFileChange(r.id, e.target.files?.[0] || null)}
          />

          <button
            onClick={() => uploadLayout(r)}
            style={{ marginTop:10, padding:8 }}
          >
            Upload Layout
          </button>
        </div>
      ))}
    </div>
  );
}
