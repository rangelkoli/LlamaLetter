import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useLocation, useNavigate } from "react-router-dom";
import CheckoutForm from "@/components/CheckoutForm";
import { useEffect } from "react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { creditAmount: number; userId: string } | null;

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  const handlePaymentSuccess = () => {
    // On success, navigate to Credits page (or refresh credits)
    navigate("/credits");
  };

  if (!state) return null;

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <CheckoutForm 
          creditAmount={state.creditAmount} 
          userId={state.userId} 
          onPaymentSuccess={handlePaymentSuccess} 
        />
      </div>
    </Elements>
  );
};

export default Checkout;
