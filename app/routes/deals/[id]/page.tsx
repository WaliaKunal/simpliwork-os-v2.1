'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useParams } from 'next/navigation';
type Deal = {
id: string;
company_name?: string;
approx_requirement_size?: number;
stage?: string;
building_name?: string;
};
export default function DealDetail(){
const params = useParams();
const stages = ['New','Qualified','Layout Requested','Layout Delivered','Proposal Sent','Negotiation','LOI Initiated','LOI Signed','Closed'];
const [deal,setDeal]=useState<Deal | null>(null); const [stage,setStage]=useState<string>('');
const updateStage = async () => { if (!deal) return; await updateDoc(doc(db,'deals',deal.id), { stage: stage }); alert('Stage updated'); };
useEffect(()=>{
const fetchDeal=async()=>{
const snap=await getDoc(doc(db,'deals',params.id as string));
if(snap.exists()){
const data={id:snap.id,...snap.data()} as Deal; setDeal(data); setStage(data.stage || 'New');
}
};
fetchDeal();
},[]);
return (
<div style={{padding:40,fontFamily:'monospace'}}>
<h1>{deal?.company_name}</h1>
<p>Size: {deal?.approx_requirement_size}</p>
<p>Stage: {deal?.stage}</p>
<p>Building: {deal?.building_name}</p>
<hr/>
<h3>Actions (next step)</h3>
<p>Coming next...</p>
<hr/><h3>Update Stage</h3><select value={stage} onChange={e=>setStage(e.target.value)} style={{padding:8,marginRight:10}}>{stages.map(s=>(<option key={s} value={s}>{s}</option>))}</select><button onClick={updateStage}>Save</button>
</div>
);
}
