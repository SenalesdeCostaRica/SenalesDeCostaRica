import mongoose from 'mongoose';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const leadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  telefono: { type: String, required: true },
  tipoServicio: String,
  status: { type: String, default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema, 'leads');

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

async function sendWelcomeEmail(nombre, email) {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: '✓ Tu cotización está en camino - Señales CR',
      html: `
        <h2>¡Hola ${nombre}! 👋</h2>
        <p>Recibimos tu solicitud.</p>
        <p><strong>Te contactamos en máximo 2 horas</strong> con una cotización personalizada.</p>
        <p>Si tienes prisa, escríbenos por WhatsApp.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">Señales de Costa Rica © 2024</p>
      `
    };
    await sgMail.send(msg);
    console.log(`✓ Email enviado a ${email}`);
  } catch (error) {
    console.error('Email error:', error);
  }
}

async function sendWhatsApp(telefono, mensaje) {
  try {
    const numeroLimpio = telefono.replace(/\D/g, '');
    const numeroInternacional = numeroLimpio.length === 8 ? `506${numeroLimpio}` : numeroLimpio;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+${numeroInternacional}`,
      body: mensaje
    });
    console.log(`✓ WhatsApp enviado a +${numeroInternacional}`);
  } catch (error) {
    console.error('WhatsApp error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { nombre, email, telefono, tipoServicio } = req.body;

    if (!nombre || !email || !telefono) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const newLead = new Lead({
      nombre,
      email,
      telefono,
      tipoServicio,
      status: 'new'
    });

    await newLead.save();
    console.log(`✓ Lead creado: ${nombre}`);

    sendWelcomeEmail(nombre, email).catch(err => console.error(err));
    sendWhatsApp(telefono, `Hola ${nombre} 👋\n\nRecibimos tu solicitud.\nTe contactamos en máximo 2 horas. ✓`).catch(err => console.error(err));

    return res.status(200).json({
      success: true,
      id: newLead._id,
      mensaje: 'Lead creado correctamente'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
