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
  sales_owner_email: 'kwalia@simpliwork.com',
  source_name: 'Direct',
        company_name: companyName,
        approx_requirement_size: Number(requirementSize) || 0,
        requirement_text: requirementNotes,
        stage: 'New',
        created_at: new Date(),
      });
      alert('New deal created successfully!');
      router.push('/routes/deals');
    } catch (error) {
      console.error("Error creating deal:", error);
      alert('Failed to create deal. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Create New Deal</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Requirement Size (sqft)</label>
          <input
            type="number"
            value={requirementSize}
            onChange={(e) => setRequirementSize(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Requirement Notes</label>
          <textarea
            value={requirementNotes}
            onChange={(e) => setRequirementNotes(e.target.value)}
            style={styles.textarea}
            rows={4}
          />
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Creating...' : 'Create Deal'}
        </button>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '40px', fontFamily: 'monospace', maxWidth: '600px', margin: '0 auto' },
  title: { fontSize: '24px', marginBottom: '30px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { marginBottom: '8px', fontSize: '14px', color: '#555' },
  input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px' },
  textarea: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', fontFamily: 'monospace' },
  button: { padding: '15px', borderRadius: '5px', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '16px', cursor: 'pointer' },
};