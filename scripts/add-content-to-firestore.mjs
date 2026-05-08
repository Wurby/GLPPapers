/**
 * add-content-to-firestore.mjs
 *
 * Reads each document's .txt file from Firebase Storage and writes the full
 * text back to the Firestore document as a `content` field. Run once; safe to
 * re-run (skips docs that already have content unless FORCE=true).
 *
 * Prerequisites:
 *   - scripts/service-account.json (same key used by migrate-to-firebase.mjs)
 *   - cd scripts && npm install
 *   - node add-content-to-firestore.mjs
 *
 * Options (env vars):
 *   DRY_RUN=true      — print what would change, write nothing  (default: false)
 *   FORCE=true        — overwrite docs that already have content (default: false)
 *   CONCURRENCY=10    — parallel Storage downloads               (default: 10)
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const DRY_RUN     = process.env.DRY_RUN === 'true';
const FORCE       = process.env.FORCE === 'true';
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '10', 10);
const MAX_BYTES   = 900_000; // stay well under Firestore's 1 MB doc limit

const SERVICE_ACCOUNT_PATH = join(__dirname, 'service-account.json');

// ── Init ──────────────────────────────────────────────────────────────────────

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    '\nMissing service-account.json.\n' +
    'Download it from Firebase Console → Project Settings → Service Accounts.\n' +
    `Save it to: ${SERVICE_ACCOUNT_PATH}\n`
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: serviceAccount.project_id + '.firebasestorage.app',
});

const db     = admin.firestore();
const bucket = admin.storage().bucket();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function downloadText(storageRef) {
  const [buffer] = await bucket.file(storageRef).download();
  const text = buffer.toString('utf8');
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
    // Truncate to MAX_BYTES worth of characters (rough estimate)
    return text.slice(0, MAX_BYTES);
  }
  return text;
}

/** Run `fn` over `items` with at most `limit` in-flight at once. */
async function pool(items, limit, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

/** Commit Firestore updates in batches of 500. */
async function flushUpdates(updates) {
  const BATCH_SIZE = 500;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = db.batch();
    updates.slice(i, i + BATCH_SIZE).forEach(({ ref, content }) =>
      batch.update(ref, { content })
    );
    await batch.commit();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no writes will be made.\n');

  console.log('Loading documents from Firestore…');
  const snapshot = await db.collection('documents').get();
  console.log(`  ${snapshot.size} documents total.`);

  const toProcess = snapshot.docs.filter(
    (d) => FORCE || !d.data().content
  );

  if (toProcess.length === 0) {
    console.log('\nAll documents already have content. Use FORCE=true to overwrite.');
    return;
  }

  console.log(
    `\n${toProcess.length} document${toProcess.length !== 1 ? 's' : ''} to update` +
    (FORCE && toProcess.length < snapshot.size ? ' (FORCE mode)' : '') +
    '.\n'
  );

  if (DRY_RUN) {
    toProcess.slice(0, 5).forEach((d) => console.log(' ', d.data().storageRef));
    if (toProcess.length > 5) console.log(`  … and ${toProcess.length - 5} more`);
    return;
  }

  let done = 0;
  let errors = 0;
  const updates = [];

  await pool(toProcess, CONCURRENCY, async (docSnap) => {
    const { storageRef } = docSnap.data();
    try {
      const content = await downloadText(storageRef);
      updates.push({ ref: docSnap.ref, content });
    } catch (err) {
      errors++;
      console.warn(`  WARN: failed to fetch ${storageRef} — ${err.message}`);
    }

    done++;
    if (done % 500 === 0 || done === toProcess.length) {
      process.stdout.write(`\r  fetched ${done} / ${toProcess.length}…`);
    }

    // Flush whenever we have 500 updates ready to keep memory bounded
    if (updates.length >= 500) {
      const chunk = updates.splice(0, 500);
      await flushUpdates(chunk);
    }
  });

  // Flush remaining
  if (updates.length > 0) await flushUpdates(updates);

  console.log(`\n\nDone. Updated ${done - errors} documents.`);
  if (errors > 0) console.warn(`${errors} file${errors !== 1 ? 's' : ''} could not be fetched (see warnings above).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
