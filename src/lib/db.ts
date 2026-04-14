import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { hashPassword } from './password';

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    }).then(async (db) => {
      // ---------------------------------------------------------------------------------
      // SQLITE AT-REST HARDENING (PRAGMAs)
      // ---------------------------------------------------------------------------------
      // Enforce zero-filling of deleted data to prevent memory scraping
      await db.run('PRAGMA secure_delete = ON');
      // Enforce strict foreign key constraints preventing orphaned payload bypasses
      await db.run('PRAGMA foreign_keys = ON');
      // Mitigate accidental corruption via synchronous journal commits
      await db.run('PRAGMA journal_mode = WAL');
      await db.run('PRAGMA synchronous = NORMAL');

      // Initialize the database with the unsafe users table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          flag TEXT
        );
      `);
      
      // Ensure admin exists with CTF flag (hidden in the DB for CTF challenge)
      // Password is hashed using Node.js crypto.scrypt — never stored in plaintext
      const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
      if (!adminExists) {
        const hashedPwd = hashPassword('admin123');
        await db.run(
          'INSERT INTO users (username, password, flag) VALUES (?, ?, ?)',
          ['admin', hashedPwd, 'FLAG{s3cur3l0ck_SQLi_m4st3r}']
        );
      } else {
        // Add flag column to existing admin if missing
        try {
          await db.run('ALTER TABLE users ADD COLUMN flag TEXT');
        } catch { /* column may already exist */ }
        await db.run('UPDATE users SET flag = ? WHERE username = ? AND flag IS NULL', [
          'FLAG{s3cur3l0ck_SQLi_m4st3r}',
          'admin',
        ]);

        // Migrate plaintext password to hashed if not already hashed
        // Hashed passwords contain a ':' separating salt and hash
        if (adminExists.password && !adminExists.password.includes(':')) {
          const hashedPwd = hashPassword(adminExists.password);
          await db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPwd, 'admin']);
        }
      }
      return db;
    });
  }
  return dbPromise;
}
