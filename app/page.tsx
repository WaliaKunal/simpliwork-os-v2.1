'use client';

import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  console.log("PAGE STATE →", { user, loading });

  return (
    <div style={{ padding: 40 }}>
      <h1>Debug Page</h1>
      <pre>{JSON.stringify({ user, loading }, null, 2)}</pre>
    </div>
  );
}
