'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';

const DebugAuthPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Raw Firebase Auth State</h1>
      {loading ? (
        <p>Loading auth state...</p>
      ) : (
        <p>User: {user ? user.email : 'null'}</p>
      )}
    </div>
  );
};

export default DebugAuthPage;
