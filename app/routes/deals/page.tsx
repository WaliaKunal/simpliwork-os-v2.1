'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import Link from 'next/link';
type Deal = { id: string; company_name?: string; approx_requirement_size?: number; stage?: string; };
export default function DealsPage(){
const [deals,setDeals]=useState<Deal[]>([]);
useEffect(()=>{
const fetchDeals=async()=>{
const snap=await getDocs(collection(db,'deals'));
const list=snap.docs.map(d=>({id:d.id,...d.data()})) as Deal[];
setDeals(list);
};
fetchDeals();
},[]);
return (
<div style={{padding:40,fontFamily:'monospace'}}>
<h1>Deals</h1>
<p><a href='/routes/deals/new'>+ Create Deal</a></p>
{deals.map(d=>( 
<Link key={d.id} href={'/routes/deals/'+d.id}>
<div style={{border:'1px solid #ccc',padding:10,marginBottom:10,cursor:'pointer'}}>
<p><strong>{d.company_name}</strong></p>
<p>Size: {d.approx_requirement_size}</p>
<p>Stage: {d.stage}</p><p>Building: {d.building_name}</p>
</div>
</Link>
))}
</div>
);
}
