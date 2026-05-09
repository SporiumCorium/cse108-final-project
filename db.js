const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');

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

  // Seed a default user for testing if none exist.
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) {
      console.error('Error counting users:', err);
      return;
    }
    if (row && row.count === 0) {
      const stmt = db.prepare(
        'INSERT INTO users (username, password) VALUES (?, ?)'
      );
      // NOTE: For a real app, store password hashes instead of plain text.
      stmt.run('admin', 'password123', (insertErr) => {
        if (insertErr) {
          console.error('Error seeding default user:', insertErr);
        } else {
          console.log('Seeded default user: admin / password123');
        }
      });
      stmt.finalize();
    }
  });
});

module.exports = db;

