import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabaseClient';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const createCheckoutSession = async (creditAmount: number, userId: string) => {
    try {
        // Check if Stripe key is configured
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
            throw new Error('Stripe publishable key is missing');
        }

        // Call Supabase function instead of direct API endpoint
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { creditAmount, userId, isSubscription: false }
        });
        
        if (error) {
            console.error('Supabase function error:', error);
            throw new Error(`Function error: ${error.message || 'Unknown error'}`);
        }
        
        if (!data || !data.id) {
            throw new Error('Invalid response from checkout session creation');
        }
        
        return data;
    } catch (err) {
        console.error('Error creating checkout session:', err);
        throw err;
    }
};

export const createSubscriptionCheckoutSession = async (userId: string, planId: string) => {
    try {
        // Check if Stripe key is configured
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!stripeKey) {
            throw new Error('Stripe publishable key is missing');
        }
        
        // Call Supabase function for subscription checkout
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
        
        return data;
    } catch (err) {
        console.error('Error creating subscription checkout session:', err);
        throw err;
    }
};

export const redirectToCheckout = async (creditAmount: number, userId: string) => {
    try {
        const session = await createCheckoutSession(creditAmount, userId);
        const stripe = await stripePromise;
        
        if (!stripe) {
            throw new Error('Stripe has not been properly initialized');
        }
        
        const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
        if (error) {
            console.error('Stripe redirect error:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error redirecting to checkout:', err);
        throw err;
    }
};

export const redirectToSubscriptionCheckout = async (userId: string, planId: string) => {
    try {
        const session = await createSubscriptionCheckoutSession(userId, planId);
        const stripe = await stripePromise;
        
        if (!stripe) {
            throw new Error('Stripe has not been properly initialized');
        }
        
        const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
        if (error) {
            console.error('Stripe redirect error:', error);
            throw error;
        }
    } catch (err) {
        console.error('Error redirecting to subscription checkout:', err);
        throw err;
    }
};
