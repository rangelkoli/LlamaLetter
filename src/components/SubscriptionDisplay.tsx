import { useState, useEffect } from "react";
import { Subscription } from "@/lib/supabaseTypes";
import { getUserSubscription, cancelSubscription } from "@/lib/userService";
// Import the simplified checkout function for testing
import { redirectToSimpleCheckout } from "@/lib/stripe-simple";

interface SubscriptionDisplayProps {
  userId: string;
  onSubscriptionChange?: () => void;
}

const SubscriptionDisplay = ({
  userId,
  onSubscriptionChange,
}: SubscriptionDisplayProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const sub = await getUserSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to load subscription information");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period."
      )
    ) {
      return;
    }

    setCanceling(true);
    setError(null);

    try {
      const success = await cancelSubscription(
        subscription.stripe_subscription_id
      );
      if (success) {
        await fetchSubscription();
        if (onSubscriptionChange) onSubscriptionChange();
      } else {
        setError("Failed to cancel subscription");
      }
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setError("Failed to cancel subscription");
    } finally {
      setCanceling(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setCheckoutLoading(true);
      setError(null);

      // Use the simplified checkout function instead of the Edge Function
      await redirectToSimpleCheckout(userId, planId);
    } catch (err) {
      console.error("Error redirecting to checkout:", err);
      setError(
        "Failed to start checkout process. Please make sure your Stripe API key is valid and the price ID exists in your Stripe account."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='text-center p-6 text-gray-700 dark:text-gray-300 font-medium'>
        Loading subscription information...
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='text-red-500 dark:text-red-400 p-4 mb-4 border border-red-300 dark:border-red-500 rounded-lg bg-red-50 dark:bg-red-900'>
          {error}
        </div>
        <button
          onClick={() => fetchSubscription()}
          className='bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition'
        >
          Try Again
        </button>
      </div>
    );
  }

  // Update the subscription plans to reflect the single basic plan priced at $8.97
  if (!subscription) {
    return (
      <div className='p-6 border rounded-lg shadow-md bg-white dark:bg-gray-800'>
        <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200'>
          Subscription Plan
        </h2>

        <div className='border rounded-lg p-6 flex flex-col bg-gray-50 dark:bg-gray-700 hover:shadow-lg transition'>
          <h3 className='font-medium text-lg text-gray-800 dark:text-gray-200'>
            Basic Plan
          </h3>
          <p className='text-gray-600 dark:text-gray-400 mb-2'>
            Unlimited cover letters
          </p>
          <p className='text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100'>
            $8.97/month
          </p>
          <button
            onClick={() => handleSubscribe("price_1R6rbxSCmLDcSSiO3KZ0Bk84")}
            disabled={checkoutLoading}
            className='mt-auto bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition'
          >
            {checkoutLoading ? "Loading..." : "Subscribe"}
          </button>
        </div>

        <div className='mt-6 text-sm text-gray-500 dark:text-gray-400'>
          <p>
            Note: The subscription plan uses test mode. For testing, use a
            Stripe test card like 4242 4242 4242 4242.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 border rounded-lg shadow-md bg-white dark:bg-gray-800'>
      <h2 className='text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200'>
        Your Subscription
      </h2>

      <div className='mb-6'>
        <p className='mb-2'>
          <span className='font-medium'>Status:</span>
          <span
            className={
              subscription.status === "active"
                ? "text-green-600 dark:text-green-400 ml-2"
                : "text-yellow-600 dark:text-yellow-400 ml-2"
            }
          >
            {subscription.status === "active" ? "Active" : "Canceling"}
          </span>
        </p>
        <p className='mb-2'>
          <span className='font-medium'>Plan:</span> {subscription.plan_id}
        </p>
        <p className='mb-2'>
          <span className='font-medium'>Current period ends:</span>{" "}
          {new Date(subscription.current_period_end).toLocaleDateString()}
        </p>

        {subscription.cancel_at && (
          <p className='text-yellow-600 dark:text-yellow-400 mt-4'>
            Your subscription will end on{" "}
            {new Date(subscription.cancel_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {!subscription.cancel_at && (
        <button
          onClick={handleCancelSubscription}
          disabled={canceling}
          className='bg-red-600 dark:bg-red-700 text-white px-6 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition'
        >
          {canceling ? "Processing..." : "Cancel Subscription"}
        </button>
      )}
    </div>
  );
};

export default SubscriptionDisplay;
