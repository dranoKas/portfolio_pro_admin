
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  // targetUID is removed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TARGET_UID constant is removed from here.
// If you need a default or specific UID for some initial setup, 
// it should be managed differently, not as a global constant for auth flow.

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      // The check against a specific TARGET_UID is removed.
      // Any successful Firebase authentication will allow the user to proceed.
      // Access control for specific data should be handled by Firestore rules and application logic.
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user); // Set user immediately
      router.push('/admin');
    } catch (e) {
      const authError = e as AuthError;
      console.error("Firebase SignIn Error:", authError);
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        setError("Identifiants incorrects. Veuillez vérifier votre email et mot de passe.");
      } else if (authError.code === 'auth/invalid-email') {
         setError("Format d'email invalide.");
      }
       else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null); // Ensure user state is cleared
      router.push('/login');
    } catch (e) {
      const authError = e as AuthError;
      setError(authError.message);
      console.error("Sign out error", authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
