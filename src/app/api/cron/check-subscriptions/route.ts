import { getSupabaseServerClient } from "@/lib/supabase";
import { sendSubscriptionExpiredEmail, sendSubscriptionReminderEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 60; // Allow up to 60 seconds execution

export async function GET(req: Request) {
  // 1. Verify Authorization (Vercel Cron)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    // Only enforce in production, or if CRON_SECRET is set locally
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const results = {
    expired: 0,
    reminders: 0,
    errors: [] as string[]
  };

  try {
    // --- 1. Handle Expired Subscriptions ---
    
    // Fetch active subscriptions that have expired
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (name),
        profiles (name, email)
      `)
      .eq('status', 'active')
      .lt('expires_at', now);

    if (fetchError) throw fetchError;

    if (expiredSubs && expiredSubs.length > 0) {
      console.log(`[Cron] Found ${expiredSubs.length} expired subscriptions.`);

      for (const sub of expiredSubs) {
        try {
          // Update subscription status
          const { error: updateSubError } = await supabase
            .from('user_subscriptions')
            .update({ status: 'expired', updated_at: now })
            .eq('id', sub.id);

          if (updateSubError) throw updateSubError;

          // Update user profile tier to free
          const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ subscription_tier: 'free', updated_at: now })
            .eq('address', sub.user_address); // Assuming user_address links to profile address

          if (updateProfileError) throw updateProfileError;

          // Send email notification
          // Access joined data safely (it might be an array or object depending on relationship)
          const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
          const plan = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;
          
          if (profile?.email) {
            await sendSubscriptionExpiredEmail(
              profile.email,
              profile.name || 'User',
              plan?.name || 'Premium'
            );
          }

          results.expired++;
        } catch (err: any) {
          console.error(`[Cron] Error processing expired sub ${sub.id}:`, err);
          results.errors.push(`Expired Sub ${sub.id}: ${err.message}`);
        }
      }
    }

    // --- 2. Handle Subscription Reminders (3 Days Left) ---
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysISO = threeDaysFromNow.toISOString();
    
    // We want subs expiring between 2.5 and 3.5 days from now roughly, 
    // or just check if expires_at is < 3 days from now AND > now AND notification not sent (if we tracked that)
    // For simplicity: check if expires_at is between now and 3 days from now, but to avoid spamming, 
    // a real system needs a "reminder_sent_at" column. 
    // As a workaround for this audit, we'll just check for exact day match (e.g. 3 days out)
    
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() + 3);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setDate(endOfDay.getDate() + 3);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: reminderSubs, error: reminderError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (name),
        profiles (name, email)
      `)
      .eq('status', 'active')
      .gte('expires_at', startOfDay.toISOString())
      .lte('expires_at', endOfDay.toISOString());

    if (reminderError) throw reminderError;

    if (reminderSubs && reminderSubs.length > 0) {
      console.log(`[Cron] Found ${reminderSubs.length} subscriptions for reminder.`);

      for (const sub of reminderSubs) {
        try {
          const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
          const plan = Array.isArray(sub.subscription_plans) ? sub.subscription_plans[0] : sub.subscription_plans;

          if (profile?.email) {
             await sendSubscriptionReminderEmail(
              profile.email,
              profile.name || 'User',
              plan?.name || 'Premium',
              3
            );
            results.reminders++;
          }
        } catch (err: any) {
           console.error(`[Cron] Error sending reminder for sub ${sub.id}:`, err);
           results.errors.push(`Reminder Sub ${sub.id}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('[Cron] Job failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
