const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  telefono: { type: String, required: true },
  tipoServicio: String,
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema, 'leads');

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const totalLeads = await Lead.countDocuments();
    const leadsToday = await Lead.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const byStatus = {
      new: await Lead.countDocuments({ status: 'new' }),
      contacted: await Lead.countDocuments({ status: 'contacted' }),
      quoted: await Lead.countDocuments({ status: 'quoted' }),
      closed: await Lead.countDocuments({ status: 'closed' })
    };

    return res.status(200).json({
      totalLeads,
      leadsToday,
      byStatus,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
