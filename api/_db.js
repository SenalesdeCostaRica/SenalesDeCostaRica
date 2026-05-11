const mongoose = require('mongoose');

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

const leadSchema = new mongoose.Schema({
  nombre:       { type: String, required: true },
  email:        { type: String, required: true },
  telefono:     { type: String, required: true },
  tipoServicio: String,
  status:       { type: String, default: 'new' },
  createdAt:    { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  leadId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  leadName:  String,
  leadEmail: String,
  type:      { type: String, enum: ['whatsapp', 'email'] },
  direction: { type: String, default: 'outbound' },
  content:   String,
  subject:   String,
  createdAt: { type: Date, default: Date.now }
});

const prospectSchema = new mongoose.Schema({
  name:          String,
  business_type: String,
  zone:          String,
  city:          String,
  address:       String,
  phone:         String,
  email:         String,
  website:       String,
  rating:        Number,
  source:        String,
  data_score:    { type: Number, default: 0 },
  notes:         String,
  stage:         { type: String, default: 'por_llamar' },
  pain_points: [{
    title: String, description: String, severity: Number, category: String
  }],
  website_analysis: mongoose.Schema.Types.Mixed,
  calls: [{
    outcome: String, notes: String, next_action: String,
    called_at: { type: Date, default: Date.now }
  }],
  scraped_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Lead     = mongoose.models.Lead     || mongoose.model('Lead',     leadSchema,     'leads');
const Message  = mongoose.models.Message  || mongoose.model('Message',  messageSchema,  'messages');
const Prospect = mongoose.models.Prospect || mongoose.model('Prospect', prospectSchema, 'prospects');

module.exports = { connectDB, Lead, Message, Prospect };
