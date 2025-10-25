'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import ProtectedRoute from '@/components/ProtectedRoute';
import CheckoutForm from '@/components/CheckoutForm';
import { api } from '@/lib/api';
import { Cart } from '@/lib/types';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load Stripe configuration
    api.payments.getConfig().then((config) => {
      setStripePromise(loadStripe(config.publishableKey));
    });

    // Load cart and create payment intent
    initializeCheckout();
  }, []);

  const initializeCheckout = async () => {
    try {
      // Load cart
      const cartData = await api.cart.get();

      if (!cartData || cartData.items.length === 0) {
        toast.error('Your cart is empty');
        router.push('/cart');
        return;
      }

      setCart(cartData);

      // Create payment intent
      const paymentIntent = await api.payments.createPaymentIntent();
      setClientSecret(paymentIntent.client_secret);
      setPaymentIntentId(paymentIntent.payment_intent_id);

    } catch (error) {
      console.error('Checkout initialization failed:', error);
      toast.error('Failed to initialize checkout');
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart?.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  ) || 0;

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#10b981',
      colorBackground: '#1f2937',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading checkout...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700 h-fit">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="text-white font-semibold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Tax (0%)</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t border-gray-700 pt-4 mt-4">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => router.push('/cart')}
                className="w-full mt-6 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Back to Cart
              </button>
            </div>

            {/* Payment Form */}
            <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>

              {stripePromise && clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance,
                  }}
                >
                  <CheckoutForm
                    paymentIntentId={paymentIntentId}
                    amount={cartTotal}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
