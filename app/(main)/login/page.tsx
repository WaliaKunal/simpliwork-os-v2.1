'use client';

import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <button onClick={() => {
        console.log("LOGIN CLICKED");
        signInWithGoogle();
      }} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        Sign in with Google
      </button>
    </div>
  );
};

export default LoginPage;
