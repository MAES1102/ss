'use strict';
require('dotenv').config();

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('\n[auth] FATAL: JWT_SECRET is not set in the environment.');
  console.error('  1. Copy .env.example to .env');
  console.error('  2. Set JWT_SECRET to a long random string');
  console.error('  Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n');
  process.exit(1);
}
const JWT_EXPIRES = '1h';

const DEMO_USER = {
  username:     'demo',
  passwordHash: bcrypt.hashSync('password123', 10),
};
console.log('[auth] Demo password hashed with bcrypt (cost factor 10).');

async function verifyPassword(candidate) {
  return bcrypt.compare(candidate, DEMO_USER.passwordHash);
}

function generateToken(username) {
  return jwt.sign(
    { username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES },
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[auth] ERROR: No token provided.');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('[auth] ERROR: Token expired.');
        return res.status(401).json({ error: 'Token expired.' });
      }
      console.log('[auth] ERROR: Invalid token signature.');
      return res.status(403).json({ error: 'Invalid token. Access forbidden.' });
    }

    console.log(`[auth] SUCCESS: Token valid for user: ${decoded.username}`);
    req.user = decoded;
    next();
  });
}

module.exports = { DEMO_USER, generateToken, authenticateToken, verifyPassword };
