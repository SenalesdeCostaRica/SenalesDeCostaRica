const { connectDB, Prospect } = require('./_db');
const { verifyToken } = require('./_auth');

module.exports = async function handler(req, res) {
  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  const { id } = req.query;

  /* GET /api/prospects          → list (with optional filters)
     GET /api/prospects?id=X    → single prospect */
  if (req.method === 'GET') {
    if (id) {
      const p = await Prospect.findById(id);
      if (!p) return res.status(404).json({ error: 'Not found' });
      return res.json({ prospect: p });
    }

    const { stage, zone, business_type, q } = req.query;
    const filter = {};
    if (stage)         filter.stage = stage;
    if (zone)          filter.zone = zone;
    if (business_type) filter.business_type = business_type;
    if (q) filter.$or = [
      { name:  { $regex: q, $options: 'i' } },
      { city:  { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } }
    ];

    const prospects = await Prospect.find(filter, {
      name:1, business_type:1, zone:1, city:1, phone:1, email:1,
      website:1, rating:1, data_score:1, stage:1, notes:1,
      pain_points: { $slice: 1 }
    }).sort({ data_score: -1 });

    return res.json({ prospects });
  }

  /* PATCH /api/prospects?id=X  → update stage or notes */
  if (req.method === 'PATCH' && id) {
    const { stage, notes } = req.body;
    const update = { updated_at: new Date() };
    if (stage !== undefined) update.stage = stage;
    if (notes !== undefined) update.notes = notes;
    await Prospect.findByIdAndUpdate(id, { $set: update });
    return res.json({ success: true });
  }

  /* POST /api/prospects?id=X   → add call log */
  if (req.method === 'POST' && id) {
    const { outcome, notes, next_action } = req.body;
    if (!outcome) return res.status(400).json({ error: 'outcome required' });
    await Prospect.findByIdAndUpdate(id, {
      $push: { calls: { outcome, notes: notes || '', next_action: next_action || '', called_at: new Date() } },
      $set:  { updated_at: new Date() }
    });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
