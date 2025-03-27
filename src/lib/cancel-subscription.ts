import Stripe from 'stripe';
import { supabase } from './supabaseClient';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

export default async function cancelSubscription(req: any, res: any) {
  if (req.method === 'POST') {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    try {
      // Cancel the subscription in Stripe
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      
      // Update the subscription in the database
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
          canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);
      
      if (error) {
        throw new Error(`Failed to update subscription in database: ${error.message}`);
      }
      
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}