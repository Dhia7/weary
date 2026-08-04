const axios = require('axios');
const nodemailer = require('nodemailer');

const BRAND = 'Swisia';

function hasMailTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return true;
  if (process.env.RESEND_API_KEY) return true;
  return false;
}

function getFromAddress() {
  return (
    process.env.MAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_USER ||
    `${BRAND} <admin@swisia.store>`
  );
}

function getAdminNotifyEmail() {
  return (
    process.env.ADMIN_NOTIFY_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER ||
    process.env.MAIL_FROM
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoney(cents, currency = 'TND') {
  const amount = (Number(cents) || 0) / 100;
  return `${amount.toFixed(2)} ${currency}`;
}

function shortOrderId(id) {
  return String(id || '').slice(0, 8).toUpperCase();
}

async function sendViaResend({ to, subject, html, text, replyTo }) {
  const payload = {
    from: getFromAddress(),
    to: [to],
    subject,
    html: html || undefined,
    text: text || undefined,
  };
  if (replyTo) payload.reply_to = replyTo;

  await axios.post('https://api.resend.com/emails', payload, {
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

let smtpTransporter;

function getSmtpTransporter() {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return smtpTransporter;
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    replyTo: replyTo || undefined,
    subject,
    text,
    html,
  });
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  // Prefer OVH/SMTP when configured; fall back to Resend.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await sendViaSmtp({ to, subject, html, text, replyTo });
    return;
  }
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, subject, html, text, replyTo });
    return;
  }
  throw new Error('No email transport configured (set SMTP_* or RESEND_API_KEY)');
}

async function sendVerificationEmail(to, verifyUrl, firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = `Verify your ${BRAND} account`;
  const text = `${greeting}\n\nVerify your email by opening this link:\n${verifyUrl}\n\nIf you did not create an account, you can ignore this email.\n\n— ${BRAND}`;
  const html = `<p>${escapeHtml(greeting)}</p><p>Verify your email by clicking below:</p><p><a href="${escapeHtml(verifyUrl)}">Verify email</a></p><p style="word-break:break-all">${escapeHtml(verifyUrl)}</p><p>If you did not create an account, you can ignore this email.</p><p>— ${BRAND}</p>`;
  await sendEmail({ to, subject, text, html });
}

async function sendPasswordResetEmail(to, resetUrl, firstName) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const subject = `Reset your ${BRAND} password`;
  const text = `${greeting}\n\nReset your password by opening this link (valid for 10 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\n— ${BRAND}`;
  const html = `<p>${escapeHtml(greeting)}</p><p>Reset your password by clicking below (link valid for 10 minutes):</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p style="word-break:break-all">${escapeHtml(resetUrl)}</p><p>If you did not request this, you can ignore this email.</p><p>— ${BRAND}</p>`;
  await sendEmail({ to, subject, text, html });
}

async function sendContactNotificationEmail({ name, email, subject, message }) {
  const adminEmail = getAdminNotifyEmail();
  if (!adminEmail) {
    console.warn('Contact notification skipped: no ADMIN_NOTIFY_EMAIL configured');
    return;
  }

  const emailSubject = `[${BRAND} Contact] ${subject}`;
  const text = `New contact message from ${name} (${email})\n\nSubject: ${subject}\n\n${message}`;
  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <hr />
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  await sendEmail({ to: adminEmail, subject: emailSubject, text, html, replyTo: email });
}

async function sendContactConfirmationEmail({ name, email, subject }) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const emailSubject = `We received your message — ${BRAND}`;
  const text = `${greeting}\n\nThank you for contacting ${BRAND}. We have received your message regarding "${subject}".\n\nOur team will get back to you at ${email} as soon as possible.\n\nIf you did not send this message, you can ignore this email.\n\n— ${BRAND}`;
  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Thank you for contacting <strong>${BRAND}</strong>. We have received your message regarding <strong>${escapeHtml(subject)}</strong>.</p>
    <p>Our team will get back to you at <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> as soon as possible.</p>
    <p>If you did not send this message, you can ignore this email.</p>
    <p>— ${BRAND}</p>
  `;

  await sendEmail({ to: email, subject: emailSubject, text, html });
}

function resolveOrderRecipient(order) {
  const email =
    order?.customerInfo?.email ||
    order?.billingInfo?.email ||
    order?.User?.email ||
    null;
  const firstName =
    order?.customerInfo?.firstName ||
    order?.billingInfo?.firstName ||
    order?.User?.firstName ||
    '';
  return { email, firstName };
}

function buildOrderItemsText(order) {
  const items = order?.items || [];
  if (!items.length) return 'No line items';
  return items
    .map((item) => {
      const name = item.Product?.name || 'Item';
      const parts = [];
      if (item.color) parts.push(item.color);
      if (item.size) parts.push(item.size);
      const variant = parts.length ? ` (${parts.join(' / ')})` : '';
      return `- ${name}${variant} × ${item.quantity} — ${formatMoney(item.unitPriceCents * item.quantity, order.currency)}`;
    })
    .join('\n');
}

function buildOrderItemsHtml(order) {
  const items = order?.items || [];
  if (!items.length) return '<p>No line items</p>';
  const rows = items
    .map((item) => {
      const name = escapeHtml(item.Product?.name || 'Item');
      const parts = [];
      if (item.color) parts.push(escapeHtml(item.color));
      if (item.size) parts.push(escapeHtml(item.size));
      const variant = parts.length ? ` <span style="color:#666">(${parts.join(' / ')})</span>` : '';
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${name}${variant}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${escapeHtml(formatMoney(item.unitPriceCents * item.quantity, order.currency))}</td>
      </tr>`;
    })
    .join('');
  return `<table style="width:100%;border-collapse:collapse">${rows}</table>`;
}

function buildShippingText(order) {
  const addr = order?.shippingAddress;
  if (!addr) return 'Not provided';
  return [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ');
}

async function sendOrderConfirmationEmail(order) {
  const { email, firstName } = resolveOrderRecipient(order);
  if (!email) {
    console.warn('Order confirmation skipped: no customer email on order', order?.id);
    return;
  }

  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const orderRef = shortOrderId(order.id);
  const subject = `Order confirmation #${orderRef} — ${BRAND}`;
  const shipping = buildShippingText(order);
  const payment = order.paymentMethod || 'cash_on_delivery';

  const text = `${greeting}

Thank you for your order at ${BRAND}.

Order: #${orderRef}
Payment: ${payment}
Shipping: ${shipping}

Items:
${buildOrderItemsText(order)}

Shipping: ${formatMoney(order.shippingCostCents, order.currency)}
Total: ${formatMoney(order.totalAmountCents, order.currency)}

We received your order and will call you on the phone to verify your details before reserving the item.
Unique pieces are only reserved after phone confirmation (cash on delivery at the door).

— ${BRAND}`;

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Thank you for your order at <strong>${BRAND}</strong>.</p>
    <p><strong>Order:</strong> #${escapeHtml(orderRef)}<br/>
    <strong>Payment:</strong> ${escapeHtml(payment)}<br/>
    <strong>Shipping address:</strong> ${escapeHtml(shipping)}</p>
    ${buildOrderItemsHtml(order)}
    <p style="margin-top:16px">
      <strong>Shipping:</strong> ${escapeHtml(formatMoney(order.shippingCostCents, order.currency))}<br/>
      <strong>Total:</strong> ${escapeHtml(formatMoney(order.totalAmountCents, order.currency))}
    </p>
    <p>We will <strong>call you</strong> to verify your details before reserving the item.
    Unique pieces are only reserved after phone confirmation (cash on delivery at the door).</p>
    <p>— ${BRAND}</p>
  `;

  await sendEmail({ to: email, subject, text, html });
}

async function sendOrderAdminNotificationEmail(order) {
  const adminEmail = getAdminNotifyEmail();
  if (!adminEmail) {
    console.warn('Order admin notification skipped: no ADMIN_NOTIFY_EMAIL configured');
    return;
  }

  const { email, firstName } = resolveOrderRecipient(order);
  const orderRef = shortOrderId(order.id);
  const customerName = [firstName, order?.customerInfo?.lastName || order?.billingInfo?.lastName]
    .filter(Boolean)
    .join(' ');
  const subject = `[${BRAND} Order] #${orderRef} — ${formatMoney(order.totalAmountCents, order.currency)}`;
  const text = `New order #${orderRef}

Customer: ${customerName || 'N/A'} <${email || 'no-email'}>
Payment: ${order.paymentMethod || 'n/a'}
Shipping: ${buildShippingText(order)}

Items:
${buildOrderItemsText(order)}

Total: ${formatMoney(order.totalAmountCents, order.currency)}
Notes: ${order.notes || '—'}
`;
  const html = `
    <p><strong>New order #${escapeHtml(orderRef)}</strong></p>
    <p><strong>Customer:</strong> ${escapeHtml(customerName || 'N/A')} &lt;${escapeHtml(email || 'no-email')}&gt;<br/>
    <strong>Payment:</strong> ${escapeHtml(order.paymentMethod || 'n/a')}<br/>
    <strong>Shipping:</strong> ${escapeHtml(buildShippingText(order))}</p>
    ${buildOrderItemsHtml(order)}
    <p><strong>Total:</strong> ${escapeHtml(formatMoney(order.totalAmountCents, order.currency))}</p>
    <p><strong>Notes:</strong> ${escapeHtml(order.notes || '—')}</p>
  `;

  await sendEmail({
    to: adminEmail,
    subject,
    text,
    html,
    replyTo: email || undefined,
  });
}

async function sendPersonalizedOrderEmails(order, { designImageUrl, tshirtColor } = {}) {
  const { email, firstName } = resolveOrderRecipient(order);
  const orderRef = shortOrderId(order.id);
  const adminEmail = getAdminNotifyEmail();

  if (email) {
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
    const subject = `Personalized order received #${orderRef} — ${BRAND}`;
    const text = `${greeting}

We received your personalized t-shirt order (#${orderRef}).
Color: ${tshirtColor || 'Not specified'}

Our team will review your design and confirm next steps.

— ${BRAND}`;
    const html = `
      <p>${escapeHtml(greeting)}</p>
      <p>We received your personalized t-shirt order <strong>#${escapeHtml(orderRef)}</strong>.</p>
      <p><strong>Color:</strong> ${escapeHtml(tshirtColor || 'Not specified')}</p>
      <p>Our team will review your design and confirm next steps.</p>
      <p>— ${BRAND}</p>
    `;
    await sendEmail({ to: email, subject, text, html });
  }

  if (adminEmail) {
    const backendUrl = (process.env.BACKEND_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const absoluteDesign =
      designImageUrl && designImageUrl.startsWith('http')
        ? designImageUrl
        : designImageUrl
          ? `${backendUrl}${designImageUrl}`
          : null;
    const subject = `[${BRAND} Personalized] #${orderRef}`;
    const text = `New personalized t-shirt order #${orderRef}
Customer: ${email || 'n/a'}
Color: ${tshirtColor || 'Not specified'}
Design: ${absoluteDesign || designImageUrl || 'n/a'}
Notes: ${order.notes || '—'}
`;
    const html = `
      <p><strong>New personalized t-shirt order #${escapeHtml(orderRef)}</strong></p>
      <p><strong>Customer:</strong> ${escapeHtml(email || 'n/a')}<br/>
      <strong>Color:</strong> ${escapeHtml(tshirtColor || 'Not specified')}</p>
      ${
        absoluteDesign
          ? `<p><strong>Design:</strong> <a href="${escapeHtml(absoluteDesign)}">${escapeHtml(absoluteDesign)}</a></p>`
          : ''
      }
      <p style="white-space:pre-wrap">${escapeHtml(order.notes || '')}</p>
    `;
    await sendEmail({
      to: adminEmail,
      subject,
      text,
      html,
      replyTo: email || undefined,
    });
  }
}

/** Fire-and-forget helper so checkout never fails because of mail. */
function sendTransactional(promise, label) {
  Promise.resolve(promise).catch((err) => {
    console.error(`Email failed (${label}):`, err.message || err);
  });
}

async function sendOrderCancelledEmail(order, reasonLabel) {
  const { email, firstName } = resolveOrderRecipient(order);
  if (!email) return;

  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const orderRef = shortOrderId(order.id);
  const reason = reasonLabel || order.cancelReason || 'cancelled';
  const subject = `Order update #${orderRef} — ${BRAND}`;

  const text = `${greeting}

Your order #${orderRef} at ${BRAND} was cancelled (${reason}).

If you were waiting for a unique piece, you can join the waitlist on the product page to be notified if it becomes available again.

— ${BRAND}`;

  const html = `
    <p>${escapeHtml(greeting)}</p>
    <p>Your order <strong>#${escapeHtml(orderRef)}</strong> at <strong>${BRAND}</strong> was cancelled (${escapeHtml(reason)}).</p>
    <p>If you were waiting for a unique piece, you can join the waitlist on the product page to be notified if it becomes available again.</p>
    <p>— ${BRAND}</p>
  `;

  await sendEmail({ to: email, subject, text, html });
}

async function sendStockAvailableEmail({ email, product, variantId }) {
  if (!email || !product) return;

  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const slug = product.slug || product.id;
  const productUrl = `${frontendBase}/product/${slug}`;
  const name = product.name || 'Item';
  const subject = `Back available — ${name} — ${BRAND}`;

  const text = `Hi,

Good news: "${name}" is available again at ${BRAND}.

First order that we phone-confirm wins. Cash on delivery at the door.

View: ${productUrl}
${variantId ? `(Variant ref: ${variantId})` : ''}

— ${BRAND}`;

  const html = `
    <p>Hi,</p>
    <p>Good news: <strong>${escapeHtml(name)}</strong> is available again at <strong>${BRAND}</strong>.</p>
    <p>First order that we phone-confirm wins. Cash on delivery at the door.</p>
    <p><a href="${escapeHtml(productUrl)}">View the product</a></p>
    <p>— ${BRAND}</p>
  `;

  await sendEmail({ to: email, subject, text, html });
}

module.exports = {
  hasMailTransport,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactNotificationEmail,
  sendContactConfirmationEmail,
  sendOrderConfirmationEmail,
  sendOrderAdminNotificationEmail,
  sendPersonalizedOrderEmails,
  sendOrderCancelledEmail,
  sendStockAvailableEmail,
  sendTransactional,
};
