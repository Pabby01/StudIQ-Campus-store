import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'StudIQ Campus Store <noreply@studiq.fun>';

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

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmation(details: OrderDetails) {
  try {
    console.log('[Email] Sending order confirmation to:', details.buyerEmail);

    const productsHtml = details.products.map(p => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 12px;">` : ''}
          <strong>${p.name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${p.qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">${p.price.toFixed(2)} ${details.currency}</td>
      </tr>
    `).join('');

    const deliveryInfo = details.deliveryMethod === 'shipping' && details.deliveryAddress
      ? `
        <p><strong>Delivery Address:</strong></p>
        <p>${details.deliveryAddress.address}<br>
        ${details.deliveryAddress.city}, ${details.deliveryAddress.zip}</p>
      `
      : '<p><strong>Delivery Method:</strong> Pickup</p>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                      <img src="https://i.postimg.cc/FRJMZQbz/logo.jpg" alt="StudIQ Campus Store" style="max-width: 180px; height: auto; margin-bottom: 15px; border-radius: 12px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Order Confirmed!</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for shopping with us 🎉</p>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hi <strong>${details.buyerName}</strong>,</p>
                      <p style="font-size: 15px; color: #666666; line-height: 1.6; margin: 0 0 25px 0;">
                        Your order has been successfully confirmed and is being processed. We'll notify you once your items are ready for ${details.deliveryMethod === 'shipping' ? 'shipment' : 'pickup'}.
                      </p>

                      <!-- Order ID Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; border-radius: 6px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0; font-size: 14px; color: #666666;">Order ID</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #667eea;">${details.orderId}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Order Details -->
                      <h2 style="font-size: 20px; color: #333333; margin: 35px 0 20px 0; font-weight: 600;">Order Summary</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden;">
                        <thead>
                          <tr style="background-color: #F9FAFB;">
                            <th style="padding: 14px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #4B5563;">Product</th>
                            <th style="padding: 14px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #4B5563;">Qty</th>
                            <th style="padding: 14px 16px; text-align: right; font-size: 14px; font-weight: 600; color: #4B5563;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productsHtml}
                        </tbody>
                        <tfoot>
                          <tr style="background-color: #F9FAFB;">
                            <td colspan="2" style="padding: 18px 16px; text-align: right; font-size: 16px; font-weight: 600; color: #333333; border-top: 2px solid #E5E7EB;">Total Amount:</td>
                            <td style="padding: 18px 16px; text-align: right; font-size: 18px; font-weight: 700; color: #667eea; border-top: 2px solid #E5E7EB;">${details.total.toFixed(2)} ${details.currency}</td>
                          </tr>
                        </tfoot>
                      </table>

                      <!-- Delivery Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                        <tr>
                          <td style="background: #F9FAFB; padding: 20px; border-radius: 6px;">
                            ${deliveryInfo}
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://store.studiq.fun'}/track" 
                               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                              Track Your Order →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-align: center;">
                        Need help? Contact us at <a href="mailto:support@studiq.fun" style="color: #667eea; text-decoration: none; font-weight: 600;">support@studiq.fun</a>
                      </p>
                      <p style="margin: 15px 0 0 0; font-size: 13px; color: #999999; text-align: center;">
                        © ${new Date().getFullYear()} StudIQ Campus Store. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0 0; font-size: 13px; color: #999999; text-align: center;">
                        Powering campus commerce, one order at a time 🎓
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: details.buyerEmail,
      subject: `Order Confirmed - #${details.orderId}`,
      html,
    });

    if (error) {
      console.error('[Email] Order confirmation failed:', error);
      throw error;
    }

    console.log('[Email] Order confirmation sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send order confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Send new order notification to seller
 */
export async function sendSellerNotification(details: SellerNotification) {
  try {
    console.log('[Email] Sending seller notification to:', details.sellerEmail);

    const productsHtml = details.products.map(p => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;"><strong>${p.name}</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center;">${p.qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right;">${p.price.toFixed(2)} ${details.currency}</td>
      </tr>
    `).join('');

    const deliveryInfo = details.deliveryAddress
      ? `
        <h3 style="color: #1F2937; font-size: 18px; margin-top: 24px;">Delivery Details</h3>
        <p><strong>Name:</strong> ${details.deliveryAddress.name}<br>
        <strong>Address:</strong> ${details.deliveryAddress.address}<br>
        ${details.deliveryAddress.city}, ${details.deliveryAddress.zip}</p>
      `
      : '<p><strong>Delivery:</strong> Customer will pick up</p>';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <img src="https://i.postimg.cc/FRJMZQbz/logo.jpg" alt="StudIQ Campus Store" style="max-width: 180px; height: auto; margin-bottom: 15px; border-radius: 12px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">New Order Received!</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have a new order to fulfill 🛍️</p>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hello <strong>${details.storeName}</strong>,</p>
                      <p style="font-size: 15px; color: #666666; line-height: 1.6; margin: 0 0 25px 0;">
                        A new order has been placed! Please review the details below and prepare the items for the customer.
                      </p>

                      <!-- Order ID Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0; font-size: 14px; color: #92400E;">Order ID</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #F59E0B;">${details.orderId}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Order Items -->
                      <h2 style="font-size: 20px; color: #333333; margin: 35px 0 20px 0; font-weight: 600;">Order Items</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden;">
                        <thead>
                          <tr style="background-color: #F9FAFB;">
                            <th style="padding: 14px 16px; text-align: left; font-size: 14px; font-weight: 600; color: #4B5563;">Product</th>
                            <th style="padding: 14px 16px; text-align: center; font-size: 14px; font-weight: 600; color: #4B5563;">Qty</th>
                            <th style="padding: 14px 16px; text-align: right; font-size: 14px; font-weight: 600; color: #4B5563;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productsHtml}
                        </tbody>
                        <tfoot>
                          <tr style="background-color: #F9FAFB;">
                            <td colspan="2" style="padding: 18px 16px; text-align: right; font-size: 16px; font-weight: 600; color: #333333; border-top: 2px solid #E5E7EB;">Total Amount:</td>
                            <td style="padding: 18px 16px; text-align: right; font-size: 18px; font-weight: 700; color: #10B981; border-top: 2px solid #E5E7EB;">${details.total.toFixed(2)} ${details.currency}</td>
                          </tr>
                        </tfoot>
                      </table>

                      <!-- Delivery Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                        <tr>
                          <td style="background: #F9FAFB; padding: 20px; border-radius: 6px;">
                            ${deliveryInfo}
                          </td>
                        </tr>
                      </table>

                      <!-- Action Required Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 6px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1E40AF;">⏰ Action Required</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #1E40AF;">Please prepare the items and update the order status in your dashboard.</p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://store.studiq.fun'}/dashboard/orders" 
                               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
                              View Order in Dashboard →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-align: center;">
                        Need help? Contact us at <a href="mailto:support@studiq.fun" style="color: #10B981; text-decoration: none; font-weight: 600;">support@studiq.fun</a>
                      </p>
                      <p style="margin: 15px 0 0 0; font-size: 13px; color: #999999; text-align: center;">
                        © ${new Date().getFullYear()} StudIQ Campus Store. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: details.sellerEmail,
      subject: `New Order #${details.orderId} - ${details.storeName}`,
      html,
    });

    if (error) {
      console.error('[Email] Seller notification failed:', error);
      throw error;
    }

    console.log('[Email] Seller notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send seller notification:', error);
    return { success: false, error };
  }
}

/**
 * Send shipping confirmation to buyer
 */
export async function sendShippingConfirmation(
  orderId: string,
  buyerName: string,
  buyerEmail: string
) {
  try {
    console.log('[Email] Sending shipping confirmation to:', buyerEmail);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; text-align: center;">
                      <img src="https://i.postimg.cc/FRJMZQbz/logo.jpg" alt="StudIQ Campus Store" style="max-width: 180px; height: auto; margin-bottom: 15px; border-radius: 12px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Your Order is On Its Way!</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">It's being shipped to you 📦</p>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hi <strong>${buyerName}</strong>,</p>
                      <p style="font-size: 15px; color: #666666; line-height: 1.6; margin: 0 0 25px 0;">
                        Great news! Your order has been shipped and is on its way to you. You can track your order status anytime.
                      </p>

                      <!-- Order ID Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 6px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0; font-size: 14px; color: #1E40AF;">Order ID</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #3B82F6;">${orderId}</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Shipping Status -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; padding: 25px; border-radius: 6px; margin: 25px 0;">
                        <tr>
                          <td align="center">
                            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333333; font-weight: 600;">📍 Shipping Status</p>
                            <p style="margin: 0; font-size: 14px; color: #666666;">Your package is on its way and will arrive soon!</p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://store.studiq.fun'}/track" 
                               style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                              Track Your Order →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-align: center;">
                        Need help? Contact us at <a href="mailto:support@studiq.fun" style="color: #3B82F6; text-decoration: none; font-weight: 600;">support@studiq.fun</a>
                      </p>
                      <p style="margin: 15px 0 0 0; font-size: 13px; color: #999999; text-align: center;">
                        © ${new Date().getFullYear()} StudIQ Campus Store. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: buyerEmail,
      subject: `Order Shipped - #${orderId}`,
      html,
    });

    if (error) {
      console.error('[Email] Shipping confirmation failed:', error);
      throw error;
    }

    console.log('[Email] Shipping confirmation sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send shipping confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Send order completion email to buyer
 */
export async function sendOrderCompleted(
  orderId: string,
  buyerName: string,
  buyerEmail: string
) {
  try {
    console.log('[Email] Sending order completion to:', buyerEmail);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header with Logo -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
                      <img src="https://i.postimg.cc/FRJMZQbz/logo.jpg" alt="StudIQ Campus Store" style="max-width: 180px; height: auto; margin-bottom: 15px; border-radius: 12px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Order Delivered!</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Enjoy your purchase! ✨</p>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 10px 0;">Hi <strong>${buyerName}</strong>,</p>
                      <p style="font-size: 15px; color: #666666; line-height: 1.6; margin: 0 0 25px 0;">
                        Your order has been successfully delivered! We hope you love your purchase and that it serves you well.
                      </p>

                      <!-- Order ID Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #D1FAE5; border-left: 4px solid #10B981; border-radius: 6px; margin: 25px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0; font-size: 14px; color: #065F46;">Order ID</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 600; color: #10B981;">${orderId}</p>
                            <p style="margin: 8px 0 0 0; font-size: 14px; color: #065F46; font-weight: 600;">✓ Completed</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Review Request -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 6px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 30px;">
                            <h3 style="margin: 0 0 12px 0; color: #333333; font-size: 18px; font-weight: 600;">Love Your Purchase?</h3>
                            <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">Share your experience and help other students make informed decisions!</p>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td>
                                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://store.studiq.fun'}/dashboard/orders" 
                                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                                    Write a Review ⭐
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Thank You Message -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                        <tr>
                          <td align="center" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 20px; border-radius: 6px;">
                            <p style="margin: 0; font-size: 15px; color: #667eea; font-weight: 600;">🎓 Thank you for shopping with StudIQ Campus Store!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666; text-align: center;">
                        Need help? Contact us at <a href="mailto:support@studiq.fun" style="color: #667eea; text-decoration: none; font-weight: 600;">support@studiq.fun</a>
                      </p>
                      <p style="margin: 15px 0 0 0; font-size: 13px; color: #999999; text-align: center;">
                        © ${new Date().getFullYear()} StudIQ Campus Store. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: buyerEmail,
      subject: `Order Delivered - #${orderId}`,
      html,
    });

    if (error) {
      console.error('[Email] Order completion failed:', error);
      throw error;
    }

    console.log('[Email] Order completion sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Email] Failed to send order completion:', error);
    return { success: false, error };
  }
}
