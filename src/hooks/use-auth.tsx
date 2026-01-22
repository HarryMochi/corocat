'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<any>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Using `undefined` to denote the initial state where auth status is not yet determined.
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  const loading = user === undefined;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync user profile with Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          uid: currentUser.uid,
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      }
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isAuthPage = ['/login', '/signup', '/', '/verify-email'].includes(pathname);
    if (!loading && user && user.emailVerified && isAuthPage) {
        router.push('/learn');
    }
  }, [user, loading, pathname, router]);

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
        const displayName = email.split('@')[0];
        await updateProfile(userCredential.user, { displayName });
        
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          displayName: displayName,
          email: userCredential.user.email,
          uid: userCredential.user.uid,
          creationTime: new Date().toISOString(),
        }, { merge: true });

        const updatedUser = auth.currentUser;
        await updatedUser?.reload();
        setUser(updatedUser);

        await sendEmailVerification(userCredential.user);
    }
    return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  const logout = () => {
    return signOut(auth).then(() => {
      setUser(null);
      router.push('/login');
    });
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
        return sendEmailVerification(auth.currentUser);
    }
    throw new Error("No user is currently signed in.");
  }

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const value = {
    user: user === undefined ? null : user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    sendVerificationEmail,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
