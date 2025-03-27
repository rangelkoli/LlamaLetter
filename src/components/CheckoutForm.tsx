import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  creditAmount: number;
  userId: string;
  onPaymentSuccess: () => void;
}

const CheckoutForm = ({
  creditAmount,
  userId,
  onPaymentSuccess,
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const res = await fetch(
      `${import.meta.env.VITE_BASE_URL}/api/create-payment-intent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditAmount, userId }),
      }
    );
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setProcessing(false);
      return;
    }
    const clientSecret = data.clientSecret;

    const cardElement = elements.getElement(CardElement);
    const { error: confirmError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement!,
        },
      });
    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setProcessing(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === "succeeded") {
      onPaymentSuccess();
    }
    setProcessing(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='max-w-md mx-auto p-4 border rounded'
    >
      <CardElement options={{ hidePostalCode: true }} />
      {error && <div className='text-red-500 mt-2'>{error}</div>}
      <button
        type='submit'
        disabled={!stripe || processing}
        className='mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
      >
        {processing ? "Processing..." : `Pay $${creditAmount}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
