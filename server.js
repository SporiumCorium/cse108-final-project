const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files (login.html, homepage.html, etc.)
app.use(express.static(__dirname));

// Open login.html when visiting "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  db.get(
    'SELECT id, username, password FROM users WHERE username = ?',
    [username],
    (err, row) => {
      if (err) {
        console.error('Error querying users table:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error.'
        });
      }

      if (!row || row.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'ACCESS DENIED — Invalid credentials'
        });
      }

      // For now we just return basic user info; no real session management.
      return res.json({
        success: true,
        userId: row.id,
        username: row.username
      });
    }
  );
});

// Registration endpoint for the Corona access page.
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUsername = typeof username === 'string' ? username.trim() : '';
  const cleanPassword = typeof password === 'string' ? password.trim() : '';

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  if (cleanUsername.length < 3 || cleanPassword.length < 4) {
    return res.status(400).json({
      success: false,
      message: 'Username must be 3+ characters and password must be 4+ characters.'
    });
  }

  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [cleanUsername, cleanPassword],
    function (err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({
            success: false,
            message: 'That username is already registered.'
          });
        }

        console.error('Error registering user:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error.'
        });
      }

      return res.status(201).json({
        success: true,
        userId: this.lastID,
        username: cleanUsername
      });
    }
  );
});

// Return usernames for every user except the logged-in user.
app.get('/api/users', (req, res) => {
  const currentUserId = Number.parseInt(req.query.userId, 10);

  if (!Number.isInteger(currentUserId)) {
    return res.status(400).json({
      success: false,
      message: 'A valid userId is required.'
    });
  }

  db.all(
    'SELECT id, username FROM users WHERE id != ? ORDER BY username COLLATE NOCASE',
    [currentUserId],
    (err, rows) => {
      if (err) {
        console.error('Error querying users table:', err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error.'
        });
      }

      return res.json({
        success: true,
        users: rows
      });
    }
  );
});

// Generic event tracking endpoint
app.post('/api/events', (req, res) => {
  const { userId, eventType, payload } = req.body || {};

  if (!eventType) {
    return res.status(400).json({
      success: false,
      message: 'eventType is required.'
    });
  }

  const payloadJson = payload ? JSON.stringify(payload) : null;

  db.run(
    'INSERT INTO events (user_id, event_type, payload) VALUES (?, ?, ?)',
    [userId || null, eventType, payloadJson],
    function (err) {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to record event.'
        });
      }

      return res.status(201).json({
        success: true,
        eventId: this.lastID
      });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/login.html in your browser.`);
});

