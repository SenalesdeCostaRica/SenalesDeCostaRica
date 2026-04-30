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

const Lead    = mongoose.models.Lead    || mongoose.model('Lead',    leadSchema,    'leads');
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema, 'messages');

module.exports = { connectDB, Lead, Message };
