const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');

/** Sole authorized database account (plain text matches server login check). */
const SOLE_USERNAME = 'Calloway7895621';
const SOLE_PASSWORD = 'L3V1SD135';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err);
  } else {
    console.log('SQLite database opened at', DB_PATH);
  }
});

// Initialize schema: users and events
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_type TEXT NOT NULL,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`,
    (err) => {
      if (err) {
        console.error('Error creating events table:', err);
      }
    }
  );

  // Ensure the original authorized row exists, while keeping registered users.
  db.get(
    'SELECT id FROM users WHERE username = ?',
    [SOLE_USERNAME],
    (selErr, row) => {
      if (selErr) {
        console.error('Error checking users table:', selErr);
        return;
      }
      if (row) {
        db.run(
          'UPDATE users SET password = ? WHERE username = ?',
          [SOLE_PASSWORD, SOLE_USERNAME],
          (updateErr) => {
            if (updateErr) console.error('Error updating seeded user:', updateErr);
            else console.log('Seeded database user verified.');
          }
        );
        return;
      }

      db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [SOLE_USERNAME, SOLE_PASSWORD],
        (insertErr) => {
          if (insertErr) console.error('Error seeding user:', insertErr);
          else console.log('Seeded database user created.');
        }
      );
    }
  );
});

module.exports = db;

