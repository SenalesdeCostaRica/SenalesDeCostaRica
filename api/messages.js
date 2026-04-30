const { connectDB, Message } = require('./_db');
const { verifyToken }        = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET')  return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyToken(req))     return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  const { type, leadId } = req.query;
  const filter = {};
  if (type)   filter.type   = type;
  if (leadId) filter.leadId = leadId;

  const messages = await Message.find(filter).sort({ createdAt: -1 });
  return res.status(200).json({ messages });
};
