import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../serviceAccountKey.json";

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

export const adminAuth = getAuth();
export const adminDb = getFirestore();