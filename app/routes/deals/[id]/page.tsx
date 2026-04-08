'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
const [deal,setDeal]=useState<Deal | null>(null);
useEffect(()=>{
const fetchDeal=async()=>{
const snap=await getDoc(doc(db,'deals',params.id as string));
if(snap.exists()){
setDeal({id:snap.id,...snap.data()} as Deal);
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
</div>
);
}
