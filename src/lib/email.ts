import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'StudIQ Campus Store <onboarding@resend.dev>';

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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${details.buyerName},</p>
            <p style="margin-bottom: 20px;">Thank you for your order! Your order has been confirmed and is being processed.</p>
            
            <div style="background: #F9FAFB; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Order ID:</strong> ${details.orderId}</p>
            </div>

            <h2 style="color: #1F2937; font-size: 20px; margin-top: 30px;">Order Details</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <thead>
                <tr style="background: #F3F4F6;">
                  <th style="padding: 12px; text-align: left;">Product</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #F9FAFB; font-weight: bold;">
                  <td colspan="2" style="padding: 16px; text-align: right;">Total:</td>
                  <td style="padding: 16px; text-align: right; color: #667eea;">${details.total.toFixed(2)} ${details.currency}</td>
                </tr>
              </tfoot>
            </table>

            ${deliveryInfo}

            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app'}/track" 
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Track Your Order
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
              <p>Questions? Contact us at <a href="mailto:support@studiqstore.com" style="color: #667eea;">support@studiqstore.com</a></p>
              <p style="margin-top: 20px;">Thank you for shopping with StudIQ Campus Store!</p>
            </div>
          </div>
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">New Order Received! 🛍️</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${details.storeName},</p>
            <p style="margin-bottom: 20px;">You have a new order to fulfill!</p>
            
            <div style="background: #FEF3C7; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <p style="margin: 0;"><strong>Order ID:</strong> ${details.orderId}</p>
            </div>

            <h3 style="color: #1F2937; font-size: 18px; margin-top: 24px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <thead>
                <tr style="background: #F3F4F6;">
                  <th style="padding: 12px; text-align: left;">Product</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #F9FAFB; font-weight: bold;">
                  <td colspan="2" style="padding: 16px; text-align: right;">Total:</td>
                  <td style="padding: 16px; text-align: right; color: #10B981;">${details.total.toFixed(2)} ${details.currency}</td>
                </tr>
              </tfoot>
            </table>

            ${deliveryInfo}

            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app'}/dashboard/orders" 
                 style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Order in Dashboard
              </a>
            </div>

            <div style="margin-top: 40px; padding: 16px; background: #EFF6FF; border-radius: 6px; border-left: 4px solid #3B82F6;">
              <p style="margin: 0; color: #1E40AF; font-weight: 600;">⏰ Action Required</p>
              <p style="margin: 8px 0 0 0; color: #1E40AF;">Please prepare the items and update the order status in your dashboard.</p>
            </div>
          </div>
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Your Order is On Its Way! 📦</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${buyerName},</p>
            <p style="margin-bottom: 20px;">Great news! Your order has been shipped and is on its way to you.</p>
            
            <div style="background: #DBEAFE; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3B82F6;">
              <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
            </div>

            <p style="margin: 20px 0;">Your order will be delivered soon. You can track your order status anytime.</p>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app'}/track" 
                 style="display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Track Your Order
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
              <p>Questions? Contact us at <a href="mailto:support@studiqstore.com" style="color: #667eea;">support@studiqstore.com</a></p>
            </div>
          </div>
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #1F2937; margin: 0; font-size: 28px;">Order Delivered! ✨</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${buyerName},</p>
            <p style="margin-bottom: 20px;">Your order has been successfully delivered! We hope you love your purchase.</p>
            
            <div style="background: #D1FAE5; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10B981;">
              <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 8px 0 0 0; color: #065F46;">✓ Completed</p>
            </div>

            <div style="background: #F9FAFB; padding: 20px; border-radius: 6px; margin: 24px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1F2937;">Love Your Purchase?</h3>
              <p style="margin: 0 0 16px 0; color: #6B7280;">Share your experience and help other students make informed decisions!</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://stud-iq-campus-store.vercel.app'}/dashboard/orders" 
                 style="display: inline-block; background: #667eea; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Write a Review
              </a>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">
              <p>Thank you for shopping with StudIQ Campus Store! 🎓</p>
              <p>Questions? Contact us at <a href="mailto:support@studiqstore.com" style="color: #667eea;">support@studiqstore.com</a></p>
            </div>
          </div>
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
