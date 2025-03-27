import { supabase } from './supabaseClient';


export async function confirmCheckoutSession(sessionId: string) {
  try {
    // Call the Supabase Edge Function to handle checkout session confirmation
    const { data, error } = await supabase.functions.invoke('confirm-checkout-session', {
      body: { sessionId }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (err: any) {
    console.error('Error confirming checkout:', err);
    return { error: err.message };
  }
}
