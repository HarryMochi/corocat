import "server-only";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let app;

// Function to get or initialize the app
function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            return initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
        }
    }

    // Fallback to default credentials (e.g. if running on Vercel/GCP with auto-auth)
    // or a mock initialization if strictly necessary to avoid crash
    try {
        return initializeApp();
    } catch (error) {
        console.warn("Firebase Admin initialized without credentials (may fail on local without standard google credentials).");
        // Returns a dummy app to prevent import errors, but DB calls will fail.
        return initializeApp({ projectId: "demo-project" }, "demo-app");
    }
}

app = getFirebaseAdminApp();

export const adminDb = getFirestore(app);
