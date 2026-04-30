const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const { connectDB, Lead, Message } = require('./_db');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWelcomeEmail(lead) {
  const subject = '✓ Tu cotización está en camino - Señales CR';
  const html = `
    <h2>¡Hola ${lead.nombre}! 👋</h2>
    <p>Recibimos tu solicitud.</p>
    <p><strong>Te contactamos en máximo 2 horas</strong> con una cotización personalizada.</p>
    <p>Si tienes prisa, escríbenos por WhatsApp.</p>
    <hr style="margin: 30px 0;">
    <p style="color: #999; font-size: 12px;">Señales de Costa Rica © 2024</p>
  `;
  await sgMail.send({ to: lead.email, from: process.env.SENDGRID_FROM_EMAIL, subject, html });
  await Message.create({
    leadId: lead._id, leadName: lead.nombre, leadEmail: lead.email,
    type: 'email', direction: 'outbound', subject, content: html
  });
  console.log(`✓ Email enviado a ${lead.email}`);
}

async function sendWhatsApp(lead) {
  const numeroLimpio = lead.telefono.replace(/\D/g, '');
  const numeroInternacional = numeroLimpio.length === 8 ? `506${numeroLimpio}` : numeroLimpio;
  const body = `Hola ${lead.nombre} 👋\n\nRecibimos tu solicitud.\nTe contactamos en máximo 2 horas. ✓`;
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to:   `whatsapp:+${numeroInternacional}`,
    body
  });
  await Message.create({
    leadId: lead._id, leadName: lead.nombre, leadEmail: lead.email,
    type: 'whatsapp', direction: 'outbound', content: body
  });
  console.log(`✓ WhatsApp enviado a +${numeroInternacional}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();

    const { nombre, email, telefono, tipoServicio } = req.body;
    if (!nombre || !email || !telefono) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const newLead = await Lead.create({ nombre, email, telefono, tipoServicio, status: 'new' });
    console.log(`✓ Lead creado: ${nombre}`);

    await Promise.all([
      sendWelcomeEmail(newLead).catch(err => console.error('Email error:', err)),
      sendWhatsApp(newLead).catch(err => console.error('WhatsApp error:', err))
    ]);

    return res.status(200).json({ success: true, id: newLead._id, mensaje: 'Lead creado correctamente' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
