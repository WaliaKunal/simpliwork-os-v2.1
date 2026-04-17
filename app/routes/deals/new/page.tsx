'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export default function NewDealPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [requirementSize, setRequirementSize] = useState('');
  const [requirementNotes, setRequirementNotes] = useState('');
  const [salesOwner, setSalesOwner] = useState('kwalia@simpliwork.com');
  const [source, setSource] = useState('Direct');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      alert('Company Name is required.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'deals'), {
        company_name: companyName,
        approx_requirement_size: Number(requirementSize) || 0,
        requirement_text: requirementNotes,

        // 🔴 CRITICAL FIELDS
        sales_owner_email: salesOwner,
        source_name: source,

        stage: 'New',
        created_at: new Date(),
      });

      alert('Deal created');
      router.push('/routes/deals');

    } catch (err) {
      console.error(err);
      alert('Error creating deal');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Create New Deal</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Requirement Size"
          value={requirementSize}
          onChange={(e) => setRequirementSize(e.target.value)}
          style={styles.input}
        />

        <textarea
          placeholder="Requirement Notes"
          value={requirementNotes}
          onChange={(e) => setRequirementNotes(e.target.value)}
          style={styles.textarea}
        />

        {/* 🔥 NEW: SALES OWNER */}
        <select
          value={salesOwner}
          onChange={(e) => setSalesOwner(e.target.value)}
          style={styles.input}
        >
          <option value="kwalia@simpliwork.com">Kunal</option>
          <option value="sales1@simpliwork.com">Sales 1</option>
        </select>

        {/* 🔥 NEW: SOURCE */}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={styles.input}
        >
          <option value="Direct">Direct</option>
          <option value="CBRE">CBRE</option>
          <option value="JLL">JLL</option>
          <option value="Cushman">Cushman</option>
          <option value="Colliers">Colliers</option>
        </select>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Creating...' : 'Create Deal'}
        </button>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace' },
  title: { fontSize: '24px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },

  input: { padding: '10px', border: '1px solid #ccc' },
  textarea: { padding: '10px', border: '1px solid #ccc' },

  button: {
    padding: '12px',
    background: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
};