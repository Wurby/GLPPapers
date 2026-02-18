/**
 * Deletes all documents from the Firestore `documents` collection.
 * Run this before re-running the migration to avoid duplicates.
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'service-account.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function clearCollection(collectionName) {
  const BATCH_SIZE = 500;
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection(collectionName).limit(BATCH_SIZE).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.docs.length;
    console.log(`  deleted ${deleted} so far…`);
  }

  console.log(`Done — deleted ${deleted} documents from '${collectionName}'.`);
}

console.log('Clearing documents collection…');
await clearCollection('documents');
