/**
 * migrate-to-firebase.mjs
 *
 * Uploads the local archive to Firebase:
 *   - Firestore `documents` collection  — one doc per archive file (metadata)
 *   - Firestore `archive/stats` doc     — aggregate statistics
 *   - Firebase Storage                  — the actual .txt files
 *
 * Prerequisites:
 *   1. cd scripts && npm install
 *   2. Download a service account key from Firebase Console →
 *      Project Settings → Service Accounts → Generate new private key
 *      Save it as scripts/service-account.json  (already in .gitignore)
 *   3. node migrate-to-firebase.mjs
 *
 * Options (edit below or pass as env vars):
 *   MANIFEST_PATH  — path to manifest.json  (default: ../witness/public/archive/manifest.json)
 *   ARCHIVE_PATH   — root of archive files  (default: ../witness/public/archive)
 *   SKIP_STORAGE   — set to "true" to skip file uploads (metadata only)
 */

import { readFileSync, existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────

const MANIFEST_PATH =
  process.env.MANIFEST_PATH ??
  join(__dirname, '../witness/public/archive/manifest.json');

const ARCHIVE_PATH =
  process.env.ARCHIVE_PATH ??
  join(__dirname, '../witness/public/archive');

const SKIP_STORAGE = process.env.SKIP_STORAGE === 'true';

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

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractYear(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr);
  if (str.length === 8) {
    const y = parseInt(str.substring(0, 4));
    return y >= 1900 && y <= 2100 ? y : null;
  }
  if (str.length === 4) {
    const y = parseInt(str);
    return y >= 1900 && y <= 2100 ? y : null;
  }
  if (str.length === 2) {
    const y = parseInt(str);
    return y <= 30 ? 2000 + y : 1900 + y;
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

/** Write Firestore docs in batches of 500 */
async function writeBatch(entries) {
  const BATCH_SIZE = 500;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + BATCH_SIZE);
    chunk.forEach(({ ref, data }) => batch.set(ref, data));
    await batch.commit();
    console.log(`  committed ${i + chunk.length} / ${entries.length}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reading manifest…');
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  const allDocs = [];
  const tagCounts = {};
  const typeCounts = {};
  let datedCount = 0;
  let earliest = null;
  let latest = null;

  // Flatten manifest into Firestore document records
  for (const [folderPath, folder] of Object.entries(manifest.folders)) {
    const cleanFolder = folderPath.startsWith('input/')
      ? folderPath.slice(6)
      : folderPath;

    for (const doc of folder.documents) {
      const cleanPath = doc.file_path.startsWith('input/')
        ? doc.file_path.slice(6)
        : doc.file_path;

      const year = extractYear(doc.date.document_date);

      // Accumulate stats
      doc.category.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; });
      typeCounts[doc.category.primary_type] =
        (typeCounts[doc.category.primary_type] ?? 0) + 1;
      if (year !== null) {
        datedCount++;
        if (earliest === null || year < earliest) earliest = year;
        if (latest === null || year > latest) latest = year;
      }

      allDocs.push({
        fileName: doc.file_name,
        path: cleanPath,
        folderPath: cleanFolder,
        date: doc.date.document_date,
        year,
        dateConfidence: doc.date.confidence,
        dateSource: doc.date.date_source,
        timePeriod: doc.date.time_period,
        tags: doc.category.tags,
        type: doc.category.primary_type,
        typeConfidence: doc.category.confidence,
        summary: doc.summary,
        storageRef: cleanPath,   // path within Firebase Storage
      });
    }
  }

  console.log(`Found ${allDocs.length} documents across ${Object.keys(manifest.folders).length} folders.`);

  // ── Write documents to Firestore ────────────────────────────────────────────
  console.log('\nWriting documents to Firestore…');
  // Use a deterministic doc ID from the path so re-runs overwrite rather than duplicate
  const entries = allDocs.map((data) => ({
    ref: db.collection('documents').doc(data.path.replace(/\//g, '__')),
    data,
  }));
  await writeBatch(entries);

  // ── Write stats to Firestore ────────────────────────────────────────────────
  console.log('\nWriting stats…');
  await db.doc('archive/stats').set({
    totalDocuments: allDocs.length,
    totalFolders: Object.keys(manifest.folders).length,
    documentTypes: typeCounts,
    topTags: Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    dateRange: {
      earliest: earliest ?? 0,
      latest: latest ?? 0,
      documents_with_dates: datedCount,
      coverage_percentage:
        allDocs.length > 0 ? (datedCount / allDocs.length) * 100 : 0,
    },
    documentsPerFolder: Object.fromEntries(
      Object.entries(manifest.folders).map(([p, f]) => [p, f.document_count])
    ),
  });

  // ── Upload files to Storage ─────────────────────────────────────────────────
  if (SKIP_STORAGE) {
    console.log('\nSkipping Storage upload (SKIP_STORAGE=true).');
  } else {
    console.log(`\nUploading ${allDocs.length} files to Firebase Storage…`);
    let uploaded = 0;
    let skipped = 0;

    for (const doc of allDocs) {
      const localPath = join(ARCHIVE_PATH, doc.storageRef);
      if (!existsSync(localPath)) {
        console.warn(`  MISSING: ${localPath}`);
        skipped++;
        continue;
      }
      const content = await readFile(localPath);
      await bucket.file(doc.storageRef).save(content, {
        metadata: { contentType: 'text/plain; charset=utf-8' },
      });
      uploaded++;
      if (uploaded % 100 === 0) {
        console.log(`  uploaded ${uploaded} / ${allDocs.length}`);
      }
    }
    console.log(`  done — ${uploaded} uploaded, ${skipped} skipped.`);
  }

  console.log('\nMigration complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
