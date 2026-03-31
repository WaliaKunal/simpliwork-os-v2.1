'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/firebase';

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("REDIRECT RESULT RECEIVED:", result.user.email);
        }
      })
      .catch((error) => {
        console.error("Redirect error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AUTH → firebaseUser:", firebaseUser?.email);
      try {
        if (!firebaseUser?.email) {
          setUser(null);
          return;
        }

        const email = firebaseUser.email.toLowerCase();
        console.log("USER EMAIL:", email);

        console.log("AUTH → checking domain:", email);
        // Domain restriction
        if (!email.endsWith("@simpliwork.com")) {
          console.error("Invalid domain:", email);
          console.log("AUTH → SIGNING OUT USER");
          await auth.signOut();
          setUser(null);
          return;
        }

        console.log("AUTH → querying Firestore for:", email.toLowerCase());
        // Firestore lookup
        const userDoc = await getDoc(doc(db, "users", email));

        console.log("AUTH → userDoc exists:", userDoc.exists());
        console.log("AUTH → userDoc data:", userDoc.data());

        if (!userDoc.exists()) {
          console.error("User not authorized:", email);
          console.log("AUTH → SIGNING OUT USER");
          await auth.signOut();
          setUser(null);
          return;
        }

        const role = userDoc.data().role;
        console.log("ROLE:", role);

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
    console.log("LOGIN TRIGGERED");
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const logout = async () => {
    console.log("AUTH → SIGNING OUT USER");
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
