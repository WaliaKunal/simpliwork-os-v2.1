'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      console.log("REDIRECTING TO DASHBOARD");
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <button
        onClick={signInWithGoogle}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Sign in with Google
      </button>
    </div>
  );
}
