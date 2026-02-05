'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { User as AppUser } from '../lib/types';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: (FirebaseUser & AppUser) | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(FirebaseUser & AppUser) | null | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const loading = user === undefined;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          let firestoreData = {};
          
          if (userSnap.exists()) {
            firestoreData = userSnap.data();
          } else {
            // Create user document with premium fields
            firestoreData = {
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              uid: currentUser.uid,
              lastLogin: new Date().toISOString(),
              limits: { coursesCreatedTimestamps: [], whiteboardsCreatedTotal: 0 },
              
              // Premium subscription fields
              isPremium: false,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              subscriptionStatus: null,
              subscriptionPlan: null,
              currentPeriodEnd: null,
            };
            await setDoc(userRef, firestoreData, { merge: true });
          }
          
          setUser({ ...currentUser, ...firestoreData } as (FirebaseUser & AppUser));
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 🔥 FIX: Don't auto-redirect if user has pending upgrade
    const hasPendingUpgrade = sessionStorage.getItem('pendingUpgrade') === 'true';
    
    if (hasPendingUpgrade) {
      console.log('⏸️ Skipping auto-redirect - pending upgrade detected');
      return;
    }
    
    const isAuthPage = ['/login', '/signup', '/', '/verify-email'].includes(pathname);
    if (!loading && user && user.emailVerified && isAuthPage) {
      console.log('✅ Auto-redirecting to /learn');
      router.push('/learn');
    }
  }, [user, loading, pathname, router]);

  const signup = async (email: string, password: string) => {
    try {
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
          
          // Initialize premium fields
          isPremium: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          subscriptionPlan: null,
          currentPeriodEnd: null,
        }, { merge: true });
        
        await sendEmailVerification(userCredential.user);
      }
      return userCredential;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Ensure premium fields exist for Google users
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            email: result.user.email,
            photoURL: result.user.photoURL,
            uid: result.user.uid,
            creationTime: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            limits: { coursesCreatedTimestamps: [], whiteboardsCreatedTotal: 0 },
            
            isPremium: false,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionStatus: null,
            subscriptionPlan: null,
            currentPeriodEnd: null,
          }, { merge: true });
        }
      }
      
      return result;
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    }
  };
  
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
  };
  
  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

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
