'use client';

import React, { useEffect, useState } from 'react';
import { useAuthorizedFetch } from '@/lib/admin';
import { getImageUrl } from '@/lib/utils';
import { ShoppingBag, Package, Calendar, MapPin, CreditCard, X } from 'lucide-react';
import Link from 'next/link';

interface OrderItem { 
  Product: { 
    id: number; 
    name: string; 
    slug: string;
    SKU: string; 
    description?: string; 
    price?: number | string; 
    compareAtPrice?: number | string;
    imageUrl?: string; 
    images?: string[];
    mainThumbnailIndex?: number;
    quantity?: number; 
    weightGrams?: number;
    barcode?: string;
    isActive?: boolean; 
  }; 
  quantity: number; 
  unitPriceCents: number;
  size?: string | null;
}

interface Order {
  id: string;
  status: string;
  customerType: 'registered' | 'guest';
  totalAmountCents: number;
  shippingCostCents: number;
  currency: string;
  paymentMethod?: string;
  items: OrderItem[];
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    phoneAlt?: string;
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to extract personalized t-shirt design image URL from notes
function extractDesignImageUrl(notes: string | undefined): string | null {
  if (!notes) return null;
  const designImageMatch = notes.match(/Design Image:\s*(\/uploads\/[^\n]+)/);
  if (designImageMatch && designImageMatch[1]) {
    return designImageMatch[1];
  }
  return null;
}

// Helper function to check if order is a personalized t-shirt order
function isPersonalizedTShirtOrder(notes: string | undefined): boolean {
  if (!notes) return false;
  return notes.includes('Personalized T-Shirt Order');
}

// Helper function to extract t-shirt color from notes
function extractTShirtColor(notes: string | undefined): string | null {
  if (!notes) return null;
  const colorMatch = notes.match(/T-Shirt Color:\s*([^\n]+)/);
  if (colorMatch && colorMatch[1]) {
    return colorMatch[1].trim();
  }
  return null;
}

export default function OrdersTab() {
  const fetcher = useAuthorizedFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const perPage = 10;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const url = `/orders?page=${currentPage}&limit=${perPage}`;
        const res = await fetcher(url);
        const json = await res.json();
        if (res.ok) {
          setOrders(json.data.orders);
          setTotalPages(json.data.pagination.totalPages);
          setTotalOrders(json.data.pagination.totalOrders);
        } else {
          console.error('API Error:', json);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher, currentPage]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateItemsTotal = (items: OrderItem[]): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0);
  };

  const formatPrice = (cents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getProductNamesDisplay = (items: OrderItem[]): string => {
    if (!items || items.length === 0) return 'No items';
    if (items.length === 1) return items[0].Product.name;
    if (items.length === 2) {
      return `${items[0].Product.name} & ${items[1].Product.name}`;
    }
    return `${items[0].Product.name} + ${items.length - 1} more`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No orders yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Start shopping to see your order history here.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Order History
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You have {totalOrders} {totalOrders === 1 ? 'order' : 'orders'}
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getProductNamesDisplay(order.items || [])}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  {isPersonalizedTShirtOrder(order.notes) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Custom Design
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(order.totalAmountCents, order.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOrderClick(order)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {getProductNamesDisplay(selectedOrder.items || [])}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order #{selectedOrder.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close order details"
                title="Close order details"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Status */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Order Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(selectedOrder.totalAmountCents, selectedOrder.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => {
                    const productImage = item.Product.imageUrl || 
                      (item.Product.images && item.Product.images.length > 0 
                        ? item.Product.images[item.Product.mainThumbnailIndex || 0] 
                        : null);
                    const imageUrl = productImage ? getImageUrl(productImage) : null;
                    
                    return (
                      <div
                        key={index}
                        className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        {imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={imageUrl.startsWith('http') ? imageUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${imageUrl}`}
                              alt={item.Product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {item.Product.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            SKU: {item.Product.SKU}
                          </p>
                          {item.size && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Size: <span className="font-semibold">{item.size}</span>
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Quantity: {item.quantity}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(item.unitPriceCents * item.quantity, selectedOrder.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Items Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatPrice(calculateItemsTotal(selectedOrder.items || []), selectedOrder.currency)}
                    </span>
                  </div>
                  {selectedOrder.shippingCostCents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                      <span className="text-gray-900 dark:text-white">
                        {formatPrice(selectedOrder.shippingCostCents, selectedOrder.currency)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {formatPrice(selectedOrder.totalAmountCents, selectedOrder.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Shipping Address
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder.shippingAddress.street}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedOrder.paymentMethod && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-900 dark:text-white capitalize">
                      {selectedOrder.paymentMethod.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Personalized T-Shirt Design */}
              {isPersonalizedTShirtOrder(selectedOrder.notes) && (
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                  <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
                    Personalized T-Shirt Design
                  </h3>
                  
                  {extractDesignImageUrl(selectedOrder.notes) && (() => {
                    const imageUrl = getImageUrl(extractDesignImageUrl(selectedOrder.notes) || '');
                    const fullImageUrl = imageUrl 
                      ? (imageUrl.startsWith('http') ? imageUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${imageUrl}`)
                      : null;
                    
                    return fullImageUrl ? (
                      <div className="space-y-2">
                        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                          <img
                            src={fullImageUrl}
                            alt="Personalized T-Shirt Design"
                            className="w-full h-auto rounded-lg shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.png';
                              target.alt = 'Image not found';
                            }}
                          />
                        </div>
                      </div>
                    ) : null;
                  })()}
                  
                  {extractTShirtColor(selectedOrder.notes) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">T-Shirt Color:</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {extractTShirtColor(selectedOrder.notes)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Dates */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Order placed: {formatDate(selectedOrder.createdAt)}</p>
                {selectedOrder.updatedAt && selectedOrder.updatedAt !== selectedOrder.createdAt && (
                  <p>Last updated: {formatDate(selectedOrder.updatedAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
