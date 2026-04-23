import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (firebaseUser) {
        // Track the user doc dynamically so elevations apply instantly
        unsubSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as AppUser;
            // Provide explicit admin overrides
            if (userData.email === 'sangambhure8@gmail.com' || userData.email === 'sangambhure6@gmail.com' || userData.email === 'admin@pcb-ai.system') {
              userData.role = 'admin';
            }
            setUser(userData);
          } else {
            const defaultRole = (firebaseUser.email === 'sangambhure8@gmail.com' || firebaseUser.email === 'sangambhure6@gmail.com' || firebaseUser.email === 'admin@pcb-ai.system') ? 'admin' : 'student';
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: defaultRole as any,
              displayName: firebaseUser.displayName || '',
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile stream:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'student',
            displayName: firebaseUser.displayName || '',
          });
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
