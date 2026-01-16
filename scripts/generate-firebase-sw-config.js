import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars from .env.local if it exists
dotenv.config({ path: '.env.local' });
// Also load from process.env (Vercel)
const env = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = `// Generated Firebase Config
const firebaseConfig = {
    apiKey: "${env.VITE_FIREBASE_API_KEY || ''}",
    authDomain: "${env.VITE_FIREBASE_AUTH_DOMAIN || ''}",
    projectId: "${env.VITE_FIREBASE_PROJECT_ID || ''}",
    storageBucket: "${env.VITE_FIREBASE_STORAGE_BUCKET || ''}",
    messagingSenderId: "${env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''}",
    appId: "${env.VITE_FIREBASE_APP_ID || ''}"
};
`;

const outputPath = path.resolve(__dirname, '../public/firebase-config-sw.js');

try {
    fs.writeFileSync(outputPath, config);
    console.log('✅ firebase-config-sw.js generated successfully.');
} catch (err) {
    console.error('❌ Error generating firebase-config-sw.js:', err);
    process.exit(1);
}
