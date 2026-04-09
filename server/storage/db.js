/**
 * Equal Scales — SQLite Database Bootstrap
 *
 * Initializes and manages the local SQLite database.
 * Uses better-sqlite3 for synchronous, reliable local access.
 *
 * Initialization is idempotent: safe to call on every app start.
 * The database file lives at ~/EqualScalesVault/equal-scales.db.
 * The vault directory is created if it doesn't exist.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VAULT_ROOT, DB_PATH, TEMPLATES_DIR, CLIENTS_DIR } from './paths.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

/**
 * Initialize the database: create vault directories, open DB, run schema.
 * Idempotent — safe to call multiple times.
 */
function initDatabase() {
  // Ensure vault directories exist
  const dirs = [VAULT_ROOT, TEMPLATES_DIR, CLIENTS_DIR];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[DB] Created directory:', dir);
    }
  }

  // Open (or create) the database
  db = new Database(DB_PATH);
  console.log('[DB] Opened database at:', DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run schema — CREATE IF NOT EXISTS makes this idempotent
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('[DB] Schema applied successfully');

  return db;
}

/**
 * Get the database instance. Throws if not initialized.
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection gracefully.
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Database closed');
  }
}

export { initDatabase, getDb, closeDatabase };
