'use client';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useRouter } from 'next/navigation';

export default function NewDeal(){
  const router = useRouter();

  const [company,setCompany] = useState('');
  const [size,setSize] = useState('');
  const [requirementText,setRequirementText] = useState('');

  const createDeal = async () => {
    const docRef = await addDoc(collection(db,'deals'),{
      company_name: company,
      approx_requirement_size: Number(size),
      requirement_text: requirementText,
      stage: 'New',
      created_at: new Date()
    });

    router.push('/routes/deals/' + docRef.id);
  };

  return (
    <div style={{padding:40,fontFamily:'monospace'}}>
      <h1>Create Deal</h1>

      <input
        placeholder="Company Name"
        value={company}
        onChange={e=>setCompany(e.target.value)}
        style={{display:'block',marginBottom:10,padding:8}}
      />

      <input
        placeholder="Size"
        value={size}
        onChange={e=>setSize(e.target.value)}
        style={{display:'block',marginBottom:10,padding:8}}
      />

      <textarea
        placeholder="Client requirement (workstations, meeting rooms, notes)"
        value={requirementText}
        onChange={e=>setRequirementText(e.target.value)}
        style={{width:'100%',height:120,marginBottom:10,padding:10}}
      />

      <button onClick={createDeal} style={{padding:10}}>
        Create Deal
      </button>
    </div>
  );
}
