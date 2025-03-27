import { supabase } from './supabaseClient';
import { UserProfile, CreditTransaction, Subscription } from './supabaseTypes';

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  console.log("User",user);
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

    console.log("Profile", profile);
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  if (!profile) {
    console.error('No profile found for user:', user.id);
    return null;
  }
  return profile;
}

export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getUserSubscription();
  return !!subscription;

}


export async function getUserCredits(): Promise<number> {
  const profile = await getUserProfile();
  if (!profile) return 0;

  if (profile.has_subscription) {
    // Unlimited credits for subscribed users
    return Infinity;
  }

  // Return remaining free cover letter generations for unsubscribed users
  return profile.free_generations_left || 0;
}

export async function useCredit(details: string = 'Cover letter generation'): Promise<boolean> {
  const profile = await getUserProfile();
  if (!profile) return false;

  if (profile.has_subscription) {
    // Allow usage for subscribed users
    const { data, error } = await supabase.rpc('use_credit', {
      details_param: details
    });

    if (error) {
      console.error('Error using credit:', error);
      return false;
    }

    return data;
  } else {
    // Handle free generations for unsubscribed users
    if (profile.free_generations_left > 0) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ free_generations_left: profile.free_generations_left - 1 })
        .eq('id', profile.id);

      if (error) {
        console.error('Error decrementing free generations:', error);
        return false;
      }

      return true;
    } else {
      console.error('No free generations left for unsubscribed user.');
      return false;
    }
  }
}

export async function getTransactionHistory(): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

export async function purchaseCredits(amount: number, paymentIntentId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('add_credits', {
    amount_param: amount,
    details_param: `Payment: ${paymentIntentId}`
  });
  console.log(data);

  if (error) {
    console.error('Error purchasing credits:', error);
    return false;
  }

  return true;
}

export async function getUserSubscription(): Promise<Subscription | null> {

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;


  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .single();

    console.log("Subscription", data);

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data;
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    // Call Supabase Edge Function to cancel the subscription in Stripe
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { subscriptionId }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Function error: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to cancel subscription');
    }

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}
