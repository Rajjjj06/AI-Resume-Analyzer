import admin from "firebase-admin";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

logger.info("Firebase Admin initialized");
console.log("Firebase Admin initialized");

export default admin;
