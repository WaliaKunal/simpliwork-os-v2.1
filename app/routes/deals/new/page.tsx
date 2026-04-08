'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useRouter } from 'next/navigation';
type Building = { id: string; name?: string; };
export default function NewDeal(){
const [company,setCompany]=useState('');
const [size,setSize]=useState('');
const [buildings,setBuildings]=useState<Building[]>([]);
const [selectedBuilding,setSelectedBuilding]=useState('');
const router=useRouter();
useEffect(()=>{
const fetchBuildings=async()=>{
const snap=await getDocs(collection(db,'buildings'));
const list=snap.docs.map(d=>({id:d.id,...d.data()})) as Building[];
setBuildings(list);
};
fetchBuildings();
},[]);
const createDeal=async()=>{
await addDoc(collection(db,'deals'),{
company_name:company,
approx_requirement_size:Number(size),
building_id:selectedBuilding,
stage:'New',
created_at:new Date()
});
router.push('/routes/deals');
};
return (
<div style={{padding:40,fontFamily:'monospace'}}>
<h1>New Deal</h1>
<input placeholder='Company' value={company} onChange={e=>setCompany(e.target.value)} />
<br/><br/>
<input placeholder='Size' value={size} onChange={e=>setSize(e.target.value)} />
<br/><br/>
<select style={{padding:10,width:'100%',color:'black',background:'white',border:'1px solid #ccc'}} value={selectedBuilding} onChange={e=>setSelectedBuilding(e.target.value)}>
<option style={{color:'black'}} value=''>Select Building</option>
{buildings.map(b=>(<option style={{color:'black'}} key={b.id} value={b.id}>{b.name}</option>))}
</select>
<br/><br/>
<button onClick={createDeal}>Create</button>
</div>
);
}
