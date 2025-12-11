'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
  paymentIntentId: string;
  amount: number;
}

export default function CheckoutForm({ paymentIntentId, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        toast.error(error.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend and create transaction
        try {
          // Small delay to ensure Stripe has fully processed the payment
          await new Promise(resolve => setTimeout(resolve, 1000));

          const result = await api.payments.confirmPayment(paymentIntentId);

          toast.success('Payment successful!');

          // Redirect to success page
          router.push(`/payment-success?transaction_id=${result.transaction_id}`);
        } catch (backendError) {
          console.error('Backend confirmation failed:', backendError);
          toast.error('Payment processed but order creation failed. Please contact support.');
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred');
      toast.error('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Amount to pay:</span>
          <span className="text-2xl font-bold text-green-400">
            ${amount.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Your payment information is secure and encrypted.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-4 bg-[#4169E1] text-white text-lg font-semibold rounded-lg hover:bg-[#3557C1] focus:outline-none focus:ring-2 focus:ring-[#4169E1] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Secure payment</span>
        </div>
        <span>•</span>
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
}
