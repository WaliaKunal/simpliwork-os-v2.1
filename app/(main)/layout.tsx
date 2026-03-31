'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

const LoadingSpinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{
            border: '4px solid rgba(0, 0, 0, 0.1)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            borderLeftColor: '#09f',
            animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRouting, setIsRouting] = useState(true);

  useEffect(() => {
    // --- START: Temporary Debug Logs ---
    console.log("AUTH DEBUG → loading:", loading);
    console.log("AUTH DEBUG → user:", user);
    console.log("AUTH DEBUG → role:", user?.role);
    console.log("AUTH DEBUG → pathname:", pathname);
    // --- END: Temporary Debug Logs ---

    if (loading) {
        return;
    }

    if (!user) {
        router.replace('/login');
        return;
    }

    const roleBasePath: { [key: string]: string } = {
        management: "/management",
        sales: "/sales",
        design: "/design",
    };

    const role = user.role?.trim().toLowerCase() as keyof typeof roleBasePath;
    const target = roleBasePath[role];

    // --- START: Temporary Debug Logs ---
    console.log("AUTH DEBUG → target:", target);
    // --- END: Temporary Debug Logs ---

    if (target && (pathname === "/" || pathname === "/login")) {
        router.replace(target);
        return;
    }

    setIsRouting(false);

  }, [user, loading, pathname, router]);

  if (loading || isRouting) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full">
      {pathname !== '/login' && <Header />}
      {children}
    </div>
  );
}
