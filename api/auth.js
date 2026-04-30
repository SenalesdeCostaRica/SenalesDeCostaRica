const { generateToken } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = generateToken(password);
  return res.status(200).json({ token });
};
