import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    }).then(async (db) => {
      // Initialize the database with the unsafe users table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password TEXT NOT NULL
        );
      `);
      
      // Ensure admin exists
      const adminExists = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
      if (!adminExists) {
         await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', 'admin123']);
      }
      return db;
    });
  }
  return dbPromise;
}
