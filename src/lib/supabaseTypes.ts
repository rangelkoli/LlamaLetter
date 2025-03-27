export interface UserProfile {
  id: string;
  created_at: string;
  user_id: string;
  credits: number;
  has_subscription?: boolean;
  free_generations_left: number;
}

export interface CreditTransaction {
  id: string;
  created_at: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'initial';
  details?: string;
}

export interface Subscription {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  plan_id: string;
  current_period_end: string;
  cancel_at?: string;
  canceled_at?: string;
}
