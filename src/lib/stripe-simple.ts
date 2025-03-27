import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Edge Function implementation for Stripe checkout
// This approach uses Supabase Edge Functions for secure Stripe integration

export const redirectToSimpleCheckout = async (userId: string, planId: string) => {
  try {
    // Check if Stripe key is configured
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey) {
      throw new Error('Stripe publishable key is missing');
    }
    
    // Call Supabase Edge Function for subscription checkout
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { userId, isSubscription: true, planId }
    });
    
    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Function error: ${error.message || 'Unknown error'}`);
    }
    
    if (!data || !data.id) {
      throw new Error('Invalid response from checkout session creation');
    }
    
    // Use the Stripe client to redirect to checkout using the session ID
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe has not been properly initialized');
    }
    
    const { error: redirectError } = await stripe.redirectToCheckout({ 
      sessionId: data.id 
    });
    
    if (redirectError) {
      console.error('Stripe redirect error:', redirectError);
      throw redirectError;
    }
  } catch (err) {
    console.error('Error redirecting to checkout:', err);
    throw err;
  }
};