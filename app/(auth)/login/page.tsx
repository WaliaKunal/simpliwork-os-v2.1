
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="p-8 border rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-6">Deal Operating System</h1>
        <p className="mb-6 text-gray-600">Please sign in to continue</p>
        <Button onClick={signInWithGoogle} size="lg">
          Sign In with Google
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
