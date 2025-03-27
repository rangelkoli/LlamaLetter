import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16', // Use a version compatible with Deno
    });

    const { creditAmount, userId, isSubscription, planId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create different checkout options based on whether it's a subscription or one-time payment
    let session;
    
    if (isSubscription) {
      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing plan ID for subscription' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Subscription checkout
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: planId, // Price ID from Stripe dashboard
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
          isSubscription: 'true',
          planId: planId,
        },
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
        success_url: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173'}/credits?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173'}/credits`,
      });
    } else {
      // One-time payment for credits
      if (!creditAmount) {
        return new Response(
          JSON.stringify({ error: 'Missing credit amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: `${creditAmount} Credits` },
              unit_amount: 1000, // e.g. $10.00 (adjust as needed)
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId,
          creditAmount: creditAmount.toString(),
          isSubscription: 'false',
        },
        success_url: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173'}/credits?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:5173'}/credits`,
      });
    }

    return new Response(
      JSON.stringify({ id: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});