const { connectDB, Lead } = require('./_db');
const { verifyToken }     = require('./_auth');

module.exports = async function handler(req, res) {
  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  if (req.method === 'GET') {
    const leads = await Lead.find().sort({ createdAt: -1 });
    return res.status(200).json({ leads });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    const { status } = req.body;
    const valid = ['new', 'contacted', 'quoted', 'closed'];
    if (!id || !valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid id or status' });
    }
    await Lead.findByIdAndUpdate(id, { status });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
