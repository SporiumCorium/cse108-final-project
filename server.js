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

