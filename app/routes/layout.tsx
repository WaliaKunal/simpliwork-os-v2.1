
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Header from '../../components/Header';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    const allowedPaths: { [key: string]: string[] } = {
      sales: ['/deals', '/import', '/'],
      design: ['/design', '/import', '/'],
      management: ['/management', '/import', '/'],
    };

    const userAllowed = allowedPaths[user.role || ''] || [];
    const currentBasePath = '/' + (pathname.split('/')[1] || '');

    if (userAllowed.includes(currentBasePath)) return;

    // If user is on a page they shouldn't be, redirect them home
    const homePath = user.role === 'sales' ? '/deals' : `/${user.role}`;
    router.push(homePath);

  }, [user, loading, pathname, router]);

  if (loading || (!user && pathname !== '/login')) {
    return <div>Loading...</div>; 
  }

  if (!user) {
    return <>{children}</>; // Render login page
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
