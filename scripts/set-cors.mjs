import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'service-account.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: serviceAccount.project_id + '.firebasestorage.app',
});

const bucket = admin.storage().bucket();

await bucket.setCorsConfiguration([
  {
    origin: ['*'],
    method: ['GET'],
    maxAgeSeconds: 3600,
  },
]);

console.log('CORS configured successfully.');
