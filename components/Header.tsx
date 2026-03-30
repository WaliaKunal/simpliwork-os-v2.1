
'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <Link href="/" className="text-xl font-bold">
        Deal Operating System
      </Link>
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <div className="text-right">
              <p className="font-semibold">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
