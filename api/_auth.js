const crypto = require('crypto');

function generateToken(password) {
  const secret = process.env.DASHBOARD_SECRET || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const expected = generateToken(process.env.DASHBOARD_PASSWORD || '');
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

module.exports = { generateToken, verifyToken };
