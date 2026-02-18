/**
 * Selects the archive data source based on VITE_USE_FIRESTORE.
 * Resolved at build time by Vite — no conditional hook calls.
 *
 * VITE_USE_FIRESTORE=false → static manifest.json (default)
 * VITE_USE_FIRESTORE=true  → Firestore + Firebase Storage
 */
import { useArchive } from './useArchive';
import { useFirestoreArchive } from './useFirestoreArchive';

export const useArchiveData =
  import.meta.env.VITE_USE_FIRESTORE === 'true' ? useFirestoreArchive : useArchive;
