import "server-only";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app;

// Function to get or initialize the app
function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    return initializeApp();
}

app = getFirebaseAdminApp();

export const adminDb = getFirestore(app);
