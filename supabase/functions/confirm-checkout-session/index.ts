import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

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
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client with service role key (to bypass RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session.metadata?.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID in metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = session.metadata.userId;
    const isSubscription = session.metadata.isSubscription === 'true';
    
    if (isSubscription) {
      // Handle subscription checkout
      // First make sure we have a subscription ID
      if (!session.subscription) {
        return new Response(
          JSON.stringify({ error: 'No subscription was created' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get the subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      
      // Add to the subscriptions table
      const { error } = await supabaseClient.from('subscriptions').insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        plan_id: session.metadata.planId || '',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      });
      
      if (error) {
        return new Response(
          JSON.stringify({ error: `Failed to save subscription: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, subscription: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Handle one-time payment for credits
      if (session.payment_status !== 'paid') {
        return new Response(
          JSON.stringify({ error: 'Payment not completed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const creditAmount = parseInt(session.metadata?.creditAmount || '0');
      
      if (!creditAmount) {
        return new Response(
          JSON.stringify({ error: 'Missing credit amount in metadata' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fetch the user's current credits from user_profiles
      let { data: userData, error: fetchError } = await supabaseClient
        .from('user_profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();
        
      if (fetchError) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch user data: ${fetchError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const currentCredits = userData?.credits || 0;
      const newCredits = currentCredits + creditAmount;
      
      // Update the credits in user_profiles
      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update({ credits: newCredits })
        .eq('user_id', userId);
        
      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to update credits: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Record the transaction
      const { error: transactionError } = await supabaseClient
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: creditAmount, 
          type: 'purchase',
          details: `Credit purchase from Stripe: ${session.id}`
        });
        
      if (transactionError) {
        return new Response(
          JSON.stringify({ error: `Failed to record transaction: ${transactionError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, credits: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});