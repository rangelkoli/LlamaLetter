
import Stripe from 'stripe';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

export default async function checkout_session(req: any, res: any) {
  if (req.method === 'POST') {
    const { creditAmount, userId, isSubscription, planId } = req.body;
    
    try {
      // Different checkout configuration based on whether it's a subscription or one-time payment
      if (isSubscription) {
        // Subscription checkout
        const session = await stripe.checkout.sessions.create({
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
          success_url: `${process.env.VITE_BASE_URL}/credits?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.VITE_BASE_URL}/credits`,
        });
        res.status(200).json({ id: session.id });
      } else {
        // One-time payment for credits
        const session = await stripe.checkout.sessions.create({
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
          success_url: `${process.env.VITE_BASE_URL}/credits?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.VITE_BASE_URL}/credits`,
        });
        res.status(200).json({ id: session.id });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
