'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import Navigation from '@/components/Navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const formatPrice = (price: number | string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { token } = useAuth();
  const { showOrderSuccess } = useOrderNotification();
  const router = useRouter();
  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phoneAlt: '',
    email: '',
  });
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryCost] = useState<number>(10); // Flat rate default
  const hasItems = items.length > 0;

  const payloadItems = useMemo(() =>
    items.map(i => ({ 
      productId: i.productId || i.id.split('-')[0], // Use productId if available, otherwise parse from unique ID
      quantity: i.quantity, 
      unitPriceCents: Math.round(i.price * 100),
      size: i.size || null
    })),
  [items]);


  const placeOrder = async () => {
    if (!hasItems) return;
    if (!billing.firstName || !billing.lastName || !billing.phone || !billing.email) {
      setError('Please fill in name, last name, phone and email.');
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      // Use guest checkout endpoint if not authenticated, otherwise use authenticated endpoint
      const endpoint = token ? '/products/checkout/cod' : '/products/checkout/guest';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Only add authorization header if user is authenticated
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: payloadItems,
          shippingAddress: address,
          shippingCostCents: Math.round(deliveryCost * 100),
          billingInfo: {
            firstName: billing.firstName,
            lastName: billing.lastName,
            phone: billing.phone,
            phoneAlt: billing.phoneAlt || undefined,
            email: billing.email,
          },
          notes
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to place order');
        return;
      }
      clearCart();
      
      // Show success notification with order ID if available
      showOrderSuccess(data.orderId || data.id);
      
      // Redirect to main page for all users
      router.push('/');
  } catch {
      setError('Network error. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        {!token && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Guest Checkout:</strong> You can place an order without creating an account. 
              Your order will be tracked by the admin using your email address.
            </p>
          </div>
        )}

        {!hasItems ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">Your cart is empty.</p>
            <Link href="/" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Billing Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="First Name" value={billing.firstName} onChange={e=>setBilling({...billing, firstName: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Last Name" value={billing.lastName} onChange={e=>setBilling({...billing, lastName: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Phone Number" value={billing.phone} onChange={e=>setBilling({...billing, phone: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Phone Number 2 (optional)" value={billing.phoneAlt} onChange={e=>setBilling({...billing, phoneAlt: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:col-span-2" placeholder="E-mail" value={billing.email} onChange={e=>setBilling({...billing, email: e.target.value})} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Street" value={address.street} onChange={e=>setAddress({...address, street: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="City" value={address.city} onChange={e=>setAddress({...address, city: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="State" value={address.state} onChange={e=>setAddress({...address, state: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Zip Code" value={address.zipCode} onChange={e=>setAddress({...address, zipCode: e.target.value})} />
                  <input className="border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:col-span-2" placeholder="Country" value={address.country} onChange={e=>setAddress({...address, country: e.target.value})} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Order Notes</h2>
                <textarea className="w-full min-h-24 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Notes for delivery (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>

            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Payment Method</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Cash on Delivery (Pay when your order arrives)</p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 h-fit">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {items.map((i, index) => {
                  // Create a truly unique key combining multiple fields
                  // This ensures uniqueness even if item.id is duplicated
                  const uniqueKey = i.cartItemId 
                    ? `cart-${i.cartItemId}-${i.size || 'no-size'}`
                    : `${i.productId || i.id}-${i.size || 'no-size'}-${index}`;
                  return (
                  <div key={uniqueKey} className="flex justify-between text-sm">
                    <div className="flex flex-col">
                      <span>{i.name} × {i.quantity}</span>
                      {i.size && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Size: {i.size}</span>
                      )}
                    </div>
                    <span>{formatPrice(i.price * i.quantity)}</span>
                  </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Delivery</span>
                <span>{formatPrice(deliveryCost)}</span>
              </div>
              <div className="flex justify-between text-base font-medium mb-6">
                <span>Total</span>
                <span>{formatPrice(subtotal + deliveryCost)}</span>
              </div>
              {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
              <button disabled={placing} onClick={placeOrder} className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60">
                {placing ? 'Placing Order...' : 'Place Order - Pay on Delivery'}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                {token ? 'Admin will manage and track this order in the dashboard.' : 'Guest checkout - Admin will manage and track this order in the dashboard.'}
              </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


