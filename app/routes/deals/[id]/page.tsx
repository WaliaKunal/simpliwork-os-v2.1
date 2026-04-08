'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useParams } from 'next/navigation';
type Deal = { id: string; company_name?: string; approx_requirement_size?: number; stage?: string; source_organisation?: string; };
export default function DealDetail(){
const params = useParams();
const id = params.id as string;
const [deal,setDeal]=useState<Deal | null>(null);
useEffect(()=>{
const fetchDeal=async()=>{
const snap=await getDoc(doc(db,'deals',id));
if(snap.exists()){
setDeal({id:snap.id,...snap.data()} as Deal);
}
};
if(id) fetchDeal();
},[id]);
if(deal===null) return <div style={{padding:40}}>Loading...</div>;
return (
<div style={{padding:40,fontFamily:'monospace'}}>
<h1>Deal Detail</h1>
<p><strong>Company:</strong> {deal.company_name}</p>
<p><strong>Size:</strong> {deal.approx_requirement_size}</p>
<p><strong>Stage:</strong> {deal.stage}</p>
<p><strong>Source:</strong> {deal.source_organisation}</p>
</div>
);
}
