const axios = require('axios');
const nodemailer = require('nodemailer');

function hasMailTransport() {
  if (process.env.RESEND_API_KEY) return true;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return true;
  return false;
}

function getFromAddress() {
  return (
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_USER ||
    'Wear <onboarding@resend.dev>'
  );
}

async function sendViaResend({ to, subject, html, text }) {
  await axios.post(
    'https://api.resend.com/emails',
    {
      from: getFromAddress(),
      to: [to],
      subject,
      html: html || undefined,
      text: text || undefined,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

let smtpTransporter;

function getSmtpTransporter() {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return smtpTransporter;
}

async function sendViaSmtp({ to, subject, html, text }) {
  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

async function sendEmail({ to, subject, html, text }) {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, subject, html, text });
    return;
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp({ to, subject, html, text });
    return;
  }
  throw new Error('No email transport configured (set RESEND_API_KEY or SMTP_*)');
}

async function sendVerificationEmail(to, verifyUrl, firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = 'Verify your Wear account';
  const text = `${greeting}\n\nVerify your email by opening this link:\n${verifyUrl}\n\nIf you did not create an account, you can ignore this email.`;
  const html = `<p>${greeting}</p><p>Verify your email by clicking below:</p><p><a href="${verifyUrl}">Verify email</a></p><p style="word-break:break-all">${verifyUrl}</p><p>If you did not create an account, you can ignore this email.</p>`;
  await sendEmail({ to, subject, text, html });
}

module.exports = {
  hasMailTransport,
  sendEmail,
  sendVerificationEmail,
};
