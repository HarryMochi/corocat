import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | undefined;
let db: Firestore | undefined;

export function getFirebaseAdmin() {
  if (!app) {
    const apps = getApps();
    
    if (apps.length === 0) {
      console.log('🔥 Initializing Firebase Admin...');
      
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      
      console.log('✅ Firebase Admin initialized');
    } else {
      app = apps[0];
    }
  }
  
  return app;
}

export function getFirestoreAdmin(): Firestore {
  if (!db) {
    getFirebaseAdmin();
    db = getFirestore();
  }
  return db;
}
