import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'StudIQ Campus Store <noreply@studiq.fun>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://store.studiq.fun';

// --- Types ---

interface OrderDetails {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  products: Array<{
    name: string;
    price: number;
    qty: number;
    imageUrl?: string;
  }>;
  total: number;
  currency: string;
  deliveryMethod: string;
  deliveryAddress?: {
    address: string;
    city: string;
    zip: string;
  };
  escrowPin?: string;
}

interface SellerNotification {
  orderId: string;
  sellerEmail: string;
  storeName: string;
  buyerName: string;
  deliveryAddress?: {
    name: string;
    address: string;
    city: string;
    zip: string;
  };
  products: Array<{
    name: string;
    price: number;
    qty: number;
  }>;
  total: number;
  currency: string;
}

// --- Helper: Base Email Template ---

function getEmailTemplate(
  title: string,
  content: string,
  themeColor: 'primary' | 'success' | 'warning' | 'danger' = 'primary'
) {
  // Theme configuration
  const themes = {
    primary: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      mainColor: '#667eea',
      lightBg: '#EEF2FF',
      borderColor: '#C7D2FE',
      textColor: '#4338CA'
    },
    success: {
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      mainColor: '#10B981',
      lightBg: '#ECFDF5',
      borderColor: '#A7F3D0',
      textColor: '#047857'
    },
    warning: {
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      mainColor: '#F59E0B',
      lightBg: '#FFFBEB',
      borderColor: '#FDE68A',
      textColor: '#B45309'
    },
    danger: {
      gradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
      mainColor: '#EF4444',
      lightBg: '#FEF2F2',
      borderColor: '#FECACA',
      textColor: '#B91C1C'
    }
  };

  const theme = themes[themeColor];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background: ${theme.gradient}; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
          .footer { background-color: #f1f5f9; padding: 30px; text-align: center; color: #64748b; font-size: 13px; }
          .btn { display: inline-block; background: ${theme.gradient}; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
          .info-box { background-color: ${theme.lightBg}; border-left: 4px solid ${theme.mainColor}; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .info-label { font-size: 13px; font-weight: 600; text-transform: uppercase; color: ${theme.textColor}; letter-spacing: 0.05em; margin-bottom: 4px; }
          .info-value { font-size: 18px; font-weight: 700; color: ${theme.textColor}; }
          .product-table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
          .product-table th { background-color: #f8fafc; padding: 12px; text-align: left; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
          .product-table td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
          .product-table tr:last-child td { border-bottom: none; }
          .total-row td { background-color: #f8fafc; font-weight: 700; color: #0f172a; font-size: 16px; }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
          <tr>
            <td align="center">
              <div class="container">
                <!-- Header -->
                <div class="header">
                  <img src="https://i.postimg.cc/FRJMZQbz/logo.jpg" alt="StudIQ" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${title}</h1>
                </div>

                <!-- Content -->
                <div class="content">
                  ${content}
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p style="margin: 0 0 10px 0;">
                    Need help? Contact us at <a href="mailto:support@studiq.fun" style="color: ${theme.mainColor}; text-decoration: none; font-weight: 600;">support@studiq.fun</a>
                  </p>
                  <p style="margin: 0;">© ${new Date().getFullYear()} StudIQ Campus Store. All rights reserved.</p>
                  <p style="margin: 8px 0 0 0; opacity: 0.7;">Powering campus commerce 🎓</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// --- Order Emails ---

export async function sendOrderConfirmation(details: OrderDetails) {
  try {
    const productsHtml = details.products.map(p => `
      <tr>
        <td>
          <div style="display: flex; align-items: center;">
            ${p.imageUrl ? `<img src="${p.imageUrl}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; margin-right: 12px;">` : ''}
            <span>${p.name}</span>
          </div>
        </td>
        <td style="text-align: center;">${p.qty}</td>
        <td style="text-align: right;">${p.price.toFixed(2)} ${details.currency}</td>
      </tr>
    `).join('');

    const content = `
      <p style="font-size: 16px;">Hi <strong>${details.buyerName}</strong>,</p>
      <p>Your order has been confirmed! We're getting it ready for you.</p>

      <div class="info-box">
        <div class="info-label">Order ID</div>
        <div class="info-value">#${details.orderId}</div>
      </div>
      
      ${details.escrowPin ? `
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <div style="font-size: 13px; font-weight: 600; text-transform: uppercase; color: #B45309; letter-spacing: 0.05em; margin-bottom: 4px;">Your Secure Verification PIN</div>
        <div style="font-size: 24px; font-weight: 800; color: #B45309; letter-spacing: 0.1em;">${details.escrowPin}</div>
        <p style="margin-top: 8px; font-size: 14px; color: #92400E; font-weight: 500;">
          ⚠️ <strong>Keep this PIN safe!</strong> To release the escrow funds and finalize your order, verbally provide this 4-digit PIN to the seller when you receive your items.
        </p>
      </div>
      ` : ''}

      <h3 style="margin-top: 30px; font-size: 18px; color: #1e293b;">Order Summary</h3>
      <table class="product-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">Total</td>
            <td style="text-align: right;">${details.total.toFixed(2)} ${details.currency}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/track" class="btn">Track Order Status</a>
      </div>
    `;

    const html = getEmailTemplate('Order Confirmed! 🎉', content, 'primary');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: details.buyerEmail,
      subject: `Order Confirmed - #${details.orderId}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send order confirmation:', error);
    return { success: false, error };
  }
}

export async function sendSellerNotification(details: SellerNotification) {
  try {
    const productsHtml = details.products.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td style="text-align: center;">${p.qty}</td>
        <td style="text-align: right;">${p.price.toFixed(2)} ${details.currency}</td>
      </tr>
    `).join('');

    const content = `
      <p style="font-size: 16px;">Hello <strong>${details.storeName}</strong>,</p>
      <p>Cha-ching! 💰 You have a new order to fulfill.</p>

      <div class="info-box">
        <div class="info-label">Order ID</div>
        <div class="info-value">#${details.orderId}</div>
      </div>

      <h3 style="margin-top: 30px; font-size: 18px; color: #1e293b;">Items to Pack</h3>
      <table class="product-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${productsHtml}
          <tr class="total-row">
            <td colspan="2" style="text-align: right;">Total Revenue</td>
            <td style="text-align: right;">${details.total.toFixed(2)} ${details.currency}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/dashboard/orders" class="btn">Manage Order</a>
      </div>
    `;

    const html = getEmailTemplate('New Order! 🛍️', content, 'success');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: details.sellerEmail,
      subject: `New Order #${details.orderId}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send seller notification:', error);
    return { success: false, error };
  }
}

// --- Subscription Emails ---

export async function sendSubscriptionExpiredEmail(
  userEmail: string,
  userName: string,
  planName: string
) {
  try {
    const content = `
      <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
      <p>Your <strong>${planName}</strong> subscription has expired.</p>
      <p>To keep enjoying premium features like lower fees, analytics, and priority support, please renew your subscription.</p>

      <div class="info-box" style="background-color: #FEF2F2; border-left-color: #EF4444;">
        <div class="info-label" style="color: #B91C1C;">Status</div>
        <div class="info-value" style="color: #EF4444;">Expired</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/pricing" class="btn" style="background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%);">Renew Subscription</a>
      </div>
    `;

    const html = getEmailTemplate('Subscription Expired ⚠️', content, 'danger');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Your ${planName} subscription has expired`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send subscription expired email:', error);
    return { success: false, error };
  }
}

export async function sendSubscriptionReminderEmail(
  userEmail: string,
  userName: string,
  planName: string,
  daysLeft: number
) {
  try {
    const content = `
      <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
      <p>Your <strong>${planName}</strong> subscription will expire in <strong>${daysLeft} days</strong>.</p>
      <p>Don't lose access to your premium benefits! Renew now to ensure uninterrupted service.</p>

      <div class="info-box" style="background-color: #FFFBEB; border-left-color: #F59E0B;">
        <div class="info-label" style="color: #B45309;">Expires In</div>
        <div class="info-value" style="color: #F59E0B;">${daysLeft} Days</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/pricing" class="btn" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">Renew Now</a>
      </div>
    `;

    const html = getEmailTemplate('Subscription Expiring Soon ⏳', content, 'warning');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Reminder: Your subscription expires in ${daysLeft} days`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send subscription reminder email:', error);
    return { success: false, error };
  }
}

// --- Withdrawal Emails ---

export async function sendWithdrawalAdminNotification(
  requestId: string,
  sellerName: string,
  sellerEmail: string,
  amount: number,
  currency: string
) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@studiq.fun';

    const content = `
      <p><strong>Seller:</strong> ${sellerName} (${sellerEmail})</p>
      <p><strong>Amount:</strong> ${amount.toFixed(4)} ${currency}</p>
      
      <div class="info-box" style="background-color: #F1F5F9; border-left-color: #64748B;">
        <div class="info-label" style="color: #475569;">Request ID</div>
        <div class="info-value" style="color: #334155;">${requestId}</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/admin" class="btn" style="background: #334155;">Process Request</a>
      </div>
    `;

    const html = getEmailTemplate('Withdrawal Request 💸', content, 'primary');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `Withdrawal Request - ${sellerName}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send admin withdrawal notification:', error);
    return { success: false, error };
  }
}

export async function sendWithdrawalConfirmation(
  sellerEmail: string,
  amount: number,
  currency: string,
  estimatedDate: string
) {
  try {
    const content = `
      <p>Your request to withdraw <strong>${amount.toFixed(4)} ${currency}</strong> has been received.</p>
      <p>Funds will be sent to your connected wallet within <strong>24-48 hours</strong>.</p>
      
      <div class="info-box" style="background-color: #ECFDF5; border-left-color: #10B981;">
        <div class="info-label" style="color: #047857;">Status</div>
        <div class="info-value" style="color: #10B981;">Processing</div>
      </div>
    `;

    const html = getEmailTemplate('Withdrawal Received ✅', content, 'success');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: sellerEmail,
      subject: `Withdrawal Requested - ${amount.toFixed(2)} ${currency}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send withdrawal confirmation:', error);
    return { success: false, error };
  }
}

export async function sendShippingConfirmation(
  orderId: string,
  buyerName: string,
  buyerEmail: string
) {
  try {
    const content = `
      <p style="font-size: 16px;">Hi <strong>${buyerName}</strong>,</p>
      <p>Great news! Your order has been shipped and is on its way to you.</p>

      <div class="info-box">
        <div class="info-label">Order ID</div>
        <div class="info-value">#${orderId}</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/track" class="btn">Track Package</a>
      </div>
    `;

    const html = getEmailTemplate('Order Shipped! 🚚', content, 'primary');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: buyerEmail,
      subject: `Order Shipped - #${orderId}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send shipping confirmation:', error);
    return { success: false, error };
  }
}

export async function sendOrderCompleted(
  orderId: string,
  buyerName: string,
  buyerEmail: string
) {
  try {
    const content = `
      <p style="font-size: 16px;">Hi <strong>${buyerName}</strong>,</p>
      <p>Your order has been delivered! We hope you love your purchase.</p>

      <div class="info-box" style="background-color: #ECFDF5; border-left-color: #10B981;">
        <div class="info-label" style="color: #047857;">Status</div>
        <div class="info-value" style="color: #10B981;">Delivered</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <p>How was your experience?</p>
        <a href="${APP_URL}/dashboard/orders" class="btn">Write a Review</a>
      </div>
    `;

    const html = getEmailTemplate('Order Delivered! 🎁', content, 'success');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: buyerEmail,
      subject: `Order Delivered - #${orderId}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send order completion:', error);
    return { success: false, error };
  }
}

// --- Welcome Emails ---

export async function sendWelcomeBuyerEmail(userName: string, userEmail: string) {
  try {
    const content = `
      <p style="font-size: 16px;">Welcome to StudIQ Campus Store, <strong>${userName}</strong>! 👋</p>
      <p>We're thrilled to have you here. Since you're looking to buy, we recommend checking out the amazing products your fellow students are selling.</p>

      <div class="info-box" style="background-color: #EEF2FF; border-left-color: #667EEA;">
        <div class="info-label" style="color: #4338CA;">Get Started</div>
        <div class="info-value" style="color: #4338CA;">Make Your First Purchase</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/explore" class="btn" style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);">Explore the Marketplace</a>
      </div>
    `;

    const html = getEmailTemplate('Welcome to StudIQ! 🎉', content, 'primary');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Welcome to StudIQ! Make your first purchase 🛍️',
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send buyer welcome email:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeSellerEmail(userName: string, userEmail: string) {
  try {
    const content = `
      <p style="font-size: 16px;">Welcome to StudIQ Campus Store, <strong>${userName}</strong>! 🚀</p>
      <p>We're excited to see what you have to offer. As a seller, your next step is to set up your store and list your first product.</p>

      <div class="info-box" style="background-color: #ECFDF5; border-left-color: #10B981;">
        <div class="info-label" style="color: #047857;">Get Started</div>
        <div class="info-value" style="color: #047857;">Make Your First Sale</div>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${APP_URL}/dashboard/store/new" class="btn" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">Set Up Your Store</a>
      </div>
    `;

    const html = getEmailTemplate('Welcome to StudIQ! 🚀', content, 'success');

    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Welcome to StudIQ! Start selling today 📈',
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send seller welcome email:', error);
    return { success: false, error };
  }
}

// --- Webinar Emails ---

export async function sendWebinarRegistrationEmail(
  name: string,
  email: string,
  orderId: string,
  orderDate: string
) {
  try {
    const meetingLink = "https://calendar.app.google/tRXJw6rLBf5xzfAi9"; // Replace with actual meeting link

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Zero-Loss Dapps: Securing Capital on Solana')}&dates=20260717T170000Z/20260717T183000Z&details=${encodeURIComponent('Join us for an exclusive webinar on securing capital on Solana.\\n\\nMeeting link: ' + meetingLink)}&location=${encodeURIComponent(meetingLink)}`;

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//StudIQ//Webinar//EN
BEGIN:VEVENT
UID:webinar-20260717@studiq.fun
DTSTAMP:20260714T000000Z
DTSTART:20260717T170000Z
DTEND:20260717T183000Z
SUMMARY:Zero-Loss Dapps: Securing Capital on Solana
DESCRIPTION:Join us for an exclusive webinar on securing capital on Solana. Meeting link: ${meetingLink}
LOCATION:${meetingLink}
END:VEVENT
END:VCALENDAR`;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #121212; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e5e5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #121212; }
            .banner { width: 100%; height: auto; display: block; }
            .content { padding: 20px; }
            .header-links { font-size: 14px; color: #a3a3a3; margin-bottom: 30px; line-height: 1.5; }
            .header-links a { color: #60a5fa; text-decoration: none; }
            h2 { color: #ffffff; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-weight: 600; }
            .order-summary, .ticket-info { background-color: #1a1a1a; padding: 24px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333; }
            .meta-text { color: #a3a3a3; font-size: 14px; margin: 4px 0; }
            .meta-link { color: #60a5fa; text-decoration: none; }
            .row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 15px; color: #d4d4d4; }
            .row-item { flex: 1; }
            .divider { height: 1px; background-color: #333; margin: 20px 0; }
            .footer-text { color: #a3a3a3; font-size: 12px; line-height: 1.6; margin-top: 20px; }
            .footer-text a { color: #60a5fa; text-decoration: none; }
            .ticket-title { color: #ffffff; font-size: 16px; font-weight: 600; margin-bottom: 12px; }
            .ticket-detail { color: #a3a3a3; font-size: 15px; margin: 4px 0; }
            .ticket-detail.email { color: #60a5fa; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://www.studiq.fun/webinar.jpg" alt="Webinar Flyer" class="banner" />
            
            <div class="content">
              <div class="header-links">
                Questions about Zero-Loss Dapps: Securing Capital on Solana? <a href="https://www.studiq.fun/Webinar">View event details</a> or <a href="mailto:support@studiq.fun">Contact the organizer</a>
              </div>

              <div class="order-summary">
                <h2>Event Details</h2>
                <div style="margin-bottom: 20px;">
                  <p class="meta-text" style="color: #ffffff; font-weight: 600; font-size: 16px;">Date and Time</p>
                  <p class="meta-text">Friday, July 17, 2026</p>
                  <p class="meta-text">6:00 PM WAT</p>
                </div>
                
                <div class="divider"></div>

                <h2>Order Summary</h2>
                <p class="meta-text">Order <a href="#" class="meta-link">#${orderId}</a></p>
                <p class="meta-text">Order date: ${orderDate}</p>
                
                <div style="margin-top: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color: #d4d4d4; font-size: 15px;">${name}</td>
                      <td style="color: #a3a3a3; font-size: 15px; text-align: center;">1 x Admission</td>
                      <td style="color: #d4d4d4; font-size: 15px; text-align: right;">Free</td>
                    </tr>
                  </table>
                </div>
                
                <p class="meta-text" style="margin-top: 20px;">Free Registration</p>
                
                <div class="divider"></div>
                
                <p class="meta-text" style="font-size: 13px;">
                  <a href="mailto:support@studiq.fun" class="meta-link">Contact the organizer</a> for any questions related to this purchase.
                </p>
                
                <p class="footer-text">
                  This order is subject to StudIQ <a href="https://www.studiq.fun/terms">Terms of Service</a> and <a href="https://www.studiq.fun/privacy">Privacy Policy</a>.
                </p>
              </div>

              <div class="ticket-info">
                <h2>Ticket Information</h2>
                <div class="ticket-title">Ticket #1: Admission</div>
                <p class="ticket-detail">${name}</p>
                <p class="ticket-detail email">${email}</p>
                
                <div class="divider"></div>
                
                <h2>Meeting Details</h2>
                <p class="ticket-detail"><strong>Join Link:</strong> <a href="${meetingLink}" style="color: #60a5fa;">${meetingLink}</a></p>
                
                <div style="margin-top: 20px;">
                  <a href="${googleCalendarUrl}" style="background-color: #60a5fa; color: #121212; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Add to Google Calendar</a>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your ticket for Zero-Loss Dapps: Securing Capital on Solana`,
      html,
      attachments: [
        {
          filename: 'invite.ics',
          content: Buffer.from(icsContent).toString('base64'),
          contentType: 'text/calendar'
        }
      ]
    });

    return { success: true };
  } catch (error) {
    console.error('[Email] Failed to send webinar registration email:', error);
    return { success: false, error };
  }
}
