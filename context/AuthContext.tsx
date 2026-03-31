''''use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // Handle redirect result ONCE
    getRedirectResult(auth)
      .then(() => {
        console.log("AUTH → redirect result processed");
      })
      .catch((error) => {
        console.error("Redirect error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AUTH → firebaseUser:", firebaseUser?.email);

      if (!firebaseUser?.email) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const email = firebaseUser.email.toLowerCase();

        console.log("AUTH → checking domain:", email);

        if (!email.endsWith("@simpliwork.com")) {
          console.log("AUTH → SIGNING OUT (invalid domain)");
          await auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        console.log("AUTH → querying Firestore:", email);

        const userDoc = await getDoc(doc(db, "users", email));

        console.log("AUTH → userDoc exists:", userDoc.exists());

        if (!userDoc.exists()) {
          console.log("AUTH → SIGNING OUT (not in DB)");
          await auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

        const role = userDoc.data().role;

        console.log("AUTH → role:", role);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role,
        });

      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();

  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};'''