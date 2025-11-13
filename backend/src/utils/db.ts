import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_PATH = process.env.DATABASE_URL || './data/nanobanana.db';

let db: sqlite3.Database | null = null;

/**
 * Initialize and return the database connection
 */
export function initializeDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    try {
      // Ensure data directory exists
      const dbDir = dirname(DATABASE_PATH);
      mkdirSync(dbDir, { recursive: true });

      // Create or open database
      db = new sqlite3.Database(DATABASE_PATH, (err) => {
        if (err) {
          console.error('Failed to open database:', err);
          reject(err);
          return;
        }

        console.log(`Database opened at ${DATABASE_PATH}`);

        // Enable foreign keys
        db!.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('Failed to enable foreign keys:', err);
            reject(err);
            return;
          }

          // Load and execute schema
          const schemaPath = join(__dirname, '../models/schema.sql');
          const schema = readFileSync(schemaPath, 'utf-8');

          // Split schema into individual statements and execute
          const statements = schema.split(';').filter((stmt) => stmt.trim());
          let completed = 0;

          const executeNext = () => {
            if (completed >= statements.length) {
              console.log('Database schema initialized successfully');
              resolve(db!);
              return;
            }

            const statement = statements[completed].trim();
            if (statement) {
              db!.run(statement, (err) => {
                if (err && !err.message.includes('already exists')) {
                  console.error('Error executing schema statement:', err);
                  reject(err);
                  return;
                }
                completed++;
                executeNext();
              });
            } else {
              completed++;
              executeNext();
            }
          };

          executeNext();
        });
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      reject(error);
    }
  });
}

/**
 * Get the database connection
 */
export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): Promise<void> {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
        db = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// If this file is run directly, initialize the database
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    initializeDatabase()
      .then(() => {
        console.log('✓ Database initialization successful');
        closeDatabase();
      })
      .catch((error) => {
        console.error('✗ Database initialization failed:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  }
}
