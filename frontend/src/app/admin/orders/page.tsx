'use client';

import React, { useEffect, useState } from 'react';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import { getImageUrl } from '@/lib/utils';

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
}
interface Order {
  id: string; // Changed from number to string for UUID
  status: string;
  customerType: 'registered' | 'guest';
  totalAmountCents: number;
  currency: string;
  paymentMethod?: string;
  user: { id: number; email: string; firstName?: string; lastName?: string };
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
  
  // Look for "Design Image: /uploads/..." pattern
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

export default function AdminOrdersPage() {
  const fetcher = useAuthorizedFetch();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [perPage, setPerPage] = useState(20);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const searchParam = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
        const url = `/admin/orders?page=${currentPage}&limit=${perPage}${searchParam}`;
        console.log('Fetching orders with URL:', url);
        console.log('Search query:', searchQuery);
        const res = await fetcher(url);
        const json = await res.json();
        if (res.ok) {
          console.log('Orders API Response:', json);
          console.log('Number of orders returned:', json.data.orders.length);
          setOrders(json.data.orders);
          setTotalPages(json.data.pagination.totalPages);
          setTotalOrders(json.data.pagination.totalOrders);
        } else {
          console.error('API Error:', json);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher, currentPage, perPage, searchQuery]); // Include search query in dependency array

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetcher(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Update selected order if it's the same one
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        const error = await res.json();
        alert(`Failed to update status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Order #${orderId}? This action cannot be undone and will permanently remove the order and all its items.`
    );
    
    if (!confirmed) return;

    setDeletingOrder(orderId);
    try {
      const res = await fetcher(`/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // Remove the order from the local state
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        
        // Close the modal if the deleted order was selected
        if (selectedOrder && selectedOrder.id === orderId) {
          setShowDetails(false);
          setSelectedOrder(null);
        }
        
        // Update total orders count
        setTotalOrders(prev => prev - 1);
        
        alert('Order deleted successfully');
      } else {
        const error = await res.json();
        alert(`Failed to delete order: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    } finally {
      setDeletingOrder(null);
    }
  };

  // Pagination helper functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Search functionality
  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Helper function to format date
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

  // Helper function to calculate total from items
  const calculateItemsTotal = (items: OrderItem[]): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.unitPriceCents * item.quantity), 0);
  };

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage" className="text-sm text-gray-600 dark:text-gray-400">
                Orders per page:
              </label>
              <select
                id="perPage"
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalOrders)} of {totalOrders} orders
            </div>
          </div>
        </div>
        
        {/* Search Section */}
        <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="searchInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Customers
              </label>
              <div className="flex gap-2">
                <input
                  id="searchInput"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search customers..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Search results for:</span> &quot;{searchQuery}&quot;
            </div>
          )}
          
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading orders...</div>
          </div>
        ) : (
          <>
            <div className="overflow-auto rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left p-2">Order ID</th>
                    <th className="text-left p-2">Customer Place</th>
                    <th className="text-left p-2">Items</th>
                    <th className="text-left p-2">Total Value</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Order Created</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                      {/* Order ID */}
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{o.id}</span>
                          {isPersonalizedTShirtOrder(o.notes) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" title="Personalized T-Shirt Order">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Custom Design
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Customer Place */}
                      <td className="p-2">
                        {o.customerType === 'registered' ? (
                          <div>
                            <div className="font-medium text-green-600 dark:text-green-400">Registered Account</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {o.user?.firstName && o.user?.lastName 
                                ? `${o.user.firstName} ${o.user.lastName}` 
                                : o.user?.email || 'User Name Not Available'
                              }
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-orange-600 dark:text-orange-400">Guest Customer</div>
                            <div className="text-xs text-gray-500">
                              {o.billingInfo?.firstName && o.billingInfo?.lastName 
                                ? `${o.billingInfo.firstName} ${o.billingInfo.lastName}` 
                                : o.billingInfo?.email || 'No info'
                              }
                            </div>
                          </div>
                        )}
                      </td>
                      
                      {/* Items */}
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{o.items?.length || 0}</span>
                          {o.items && o.items.length > 0 && (
                            <button
                              onClick={() => toggleOrderExpansion(o.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {expandedOrders.has(o.id) ? 'Hide Items' : 'Show Items'}
                            </button>
                          )}
                        </div>
                      </td>
                      
                      {/* Total Value */}
                      <td className="p-2 font-medium">
                        {'$' + (calculateItemsTotal(o.items || [])/100).toFixed(2) + ' ' + (o.currency || 'USD')}
                      </td>
                      
                      {/* Status */}
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          o.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          o.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          o.status === 'processing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          o.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          o.status === 'shipped' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                          o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </span>
                      </td>
                      
                      {/* Order Created */}
                      <td className="p-2">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      
                      {/* Payment Method */}
                      <td className="p-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {o.paymentMethod || 'N/A'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="p-2">
                        <button 
                          onClick={() => handleOrderClick(o)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Order Items Row */}
                    {expandedOrders.has(o.id) && o.items && o.items.length > 0 && (
                      <tr className="border-t bg-gray-50 dark:bg-gray-800">
                        <td colSpan={8} className="p-4">
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Order Items:</h4>
                            <div className="grid gap-3">
                              {o.items.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                  <div className="flex gap-4">
                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {item.Product?.name || 'Unknown Product'}
                                          </p>
                                          <div className="space-y-1 mt-1">
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Product ID:</span> #{item.Product?.id || 'N/A'}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Title:</span> {item.Product?.name || 'N/A'}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Slug:</span> {item.Product?.slug || 'N/A'}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">SKU:</span> {item.Product?.SKU || 'N/A'}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        <div className="text-right">
                                          <div className="space-y-1">
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Quantity:</span> {item.quantity}
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400">
                                              <span className="font-medium">Unit Price:</span> ${(item.unitPriceCents/100).toFixed(2)}
                                            </p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                              <span className="font-medium">Item Total:</span> ${((item.unitPriceCents * item.quantity)/100).toFixed(2)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Items Total Summary */}
                            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Items Total:</span>
                                <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                  ${(calculateItemsTotal(o.items || [])/100).toFixed(2)} {o.currency}
                                </span>
                              </div>
                              {o.totalAmountCents !== calculateItemsTotal(o.items || []) && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Order Total (includes shipping):</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      ${(o.totalAmountCents/100).toFixed(2)} {o.currency}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs mt-1 text-gray-500 dark:text-gray-400">
                                    <span>Shipping:</span>
                                    <span>${((o.totalAmountCents - calculateItemsTotal(o.items || []))/100).toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                </tbody>
              </table>
            </div>
            
            {/* Empty State */}
            {orders.length === 0 && !loading && (
              <div className="text-center py-12">
                {searchQuery ? (
                  <div>
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No customers found matching &quot;{searchQuery}&quot;
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Try searching with a different name, email, or phone number.
                    </p>
                    <button
                      onClick={handleClearSearch}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      There are no orders in the system yet.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}

        {/* Order Details Modal */}
        {showDetails && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order #{selectedOrder.id} Details</h2>
                <button 
                  onClick={closeDetails}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Close details"
                  aria-label="Close details"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {selectedOrder.user ? (
                      <>
                        <div className="flex items-center mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Registered Account
                          </span>
                        </div>
                        <p><strong>Account Name:</strong> {selectedOrder.user.firstName && selectedOrder.user.lastName 
                          ? `${selectedOrder.user.firstName} ${selectedOrder.user.lastName}` 
                          : 'Name not set in account'
                        }</p>
                        <p><strong>Account Email:</strong> {selectedOrder.user.email}</p>
                        <p><strong>Account ID:</strong> #{selectedOrder.user.id}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Guest Order
                          </span>
                        </div>
                        <p><strong>Customer Type:</strong> Guest (No Account)</p>
                      </>
                    )}
                    {selectedOrder.billingInfo && (
                      <>
                        <hr className="my-3 border-gray-300 dark:border-gray-600" />
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Billing Information:</p>
                        <p><strong>Name:</strong> {selectedOrder.billingInfo.firstName} {selectedOrder.billingInfo.lastName}</p>
                        <p><strong>Email:</strong> {selectedOrder.billingInfo.email}</p>
                        <p><strong>Phone:</strong> {selectedOrder.billingInfo.phone}</p>
                        {selectedOrder.billingInfo.phoneAlt && (
                          <p><strong>Alt Phone:</strong> {selectedOrder.billingInfo.phoneAlt}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Order Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <strong>Status:</strong>
                      </label>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          selectedOrder.status === 'processing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          selectedOrder.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          selectedOrder.status === 'shipped' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' :
                          selectedOrder.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                          selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                          disabled={updatingStatus === selectedOrder.id}
                          aria-label={`Change status for order ${selectedOrder.id}`}
                          className="px-3 py-2 rounded text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      {updatingStatus === selectedOrder.id && (
                        <span className="text-xs text-gray-500 mt-1 block">Updating status...</span>
                      )}
                    </div>
                    <p><strong>Items Total:</strong> ${(calculateItemsTotal(selectedOrder.items || [])/100).toFixed(2)} {selectedOrder.currency}</p>
                    {selectedOrder.totalAmountCents !== calculateItemsTotal(selectedOrder.items || []) && (
                      <>
                        <p><strong>Order Total (includes shipping):</strong> ${(selectedOrder.totalAmountCents/100).toFixed(2)} {selectedOrder.currency}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Shipping:</strong> ${((selectedOrder.totalAmountCents - calculateItemsTotal(selectedOrder.items || []))/100).toFixed(2)}</p>
                      </>
                    )}
                    <p><strong>Items:</strong> {selectedOrder.items?.length || 0}</p>
                    <hr className="my-3 border-gray-300 dark:border-gray-600" />
                    <div className="space-y-2">
                      <p><strong>Order Created:</strong> {formatDate(selectedOrder.createdAt)}</p>
                      <p><strong>Last Updated:</strong> {formatDate(selectedOrder.updatedAt)}</p>
                    </div>
                    
                    {/* Delete Order Button */}
                    <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                      <button
                        onClick={() => deleteOrder(selectedOrder.id)}
                        disabled={deletingOrder === selectedOrder.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        {deletingOrder === selectedOrder.id ? 'Deleting...' : 'Delete Order'}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This will permanently delete the order and all its items
                      </p>
                    </div>
                  </div>
                </div>


                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Shipping Address</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Personalized T-Shirt Design Section */}
              {isPersonalizedTShirtOrder(selectedOrder.notes) && (
                <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                      Personalized T-Shirt Design
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Design Image */}
                    {extractDesignImageUrl(selectedOrder.notes) && (() => {
                      const imageUrl = getImageUrl(extractDesignImageUrl(selectedOrder.notes) || '');
                      const fullImageUrl = imageUrl 
                        ? (imageUrl.startsWith('http') ? imageUrl : `${typeof window !== 'undefined' ? window.location.origin : ''}${imageUrl}`)
                        : null;
                      
                      return fullImageUrl ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Customer Design:
                          </label>
                          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                            <a
                              href={fullImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-6 right-6 bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors shadow-lg"
                            >
                              View Full Size
                            </a>
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {/* Design Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Design Specifications:
                        </label>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
                          {extractTShirtColor(selectedOrder.notes) && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">T-Shirt Color:</span>
                              <div 
                                className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
                                style={{ backgroundColor: extractTShirtColor(selectedOrder.notes) || '#FFFFFF' }}
                                title={extractTShirtColor(selectedOrder.notes) || ''}
                              />
                              <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                {extractTShirtColor(selectedOrder.notes)}
                              </span>
                            </div>
                          )}
                          
                          {selectedOrder.notes && selectedOrder.notes.includes('Additional Notes:') && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                Additional Notes:
                              </span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {selectedOrder.notes.split('Additional Notes:')[1]?.trim() || 'None'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Note:</strong> This is a personalized t-shirt order. Please review the design image above before processing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Impact Summary */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Stock Impact Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Items Ordered:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Stock Status:</span>
                    <span className={`ml-2 font-semibold ${
                      selectedOrder.status === 'delivered' ? 'text-red-600 dark:text-red-400' :
                      selectedOrder.status === 'paid' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {selectedOrder.status === 'delivered' ? 'Stock Reduced' :
                       selectedOrder.status === 'paid' ? 'Stock Reserved' :
                       'No Stock Impact'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Products Affected:</span>
                    <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                      {selectedOrder.items.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Low Stock Items:</span>
                    <span className="ml-2 font-semibold text-orange-600 dark:text-orange-400">
                      {selectedOrder.items.filter(item => (item.Product?.quantity ?? 0) <= 10).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Order Items ({selectedOrder.items.length})</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Items Total: ${(calculateItemsTotal(selectedOrder.items || [])/100).toFixed(2)} {selectedOrder.currency}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Left Column - Product Info */}
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                                    {item.Product?.name || 'Unknown Product'}
                                  </h4>
                                  
                                  {/* Key Product Details */}
                                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Product ID:</span>
                                        <div className="text-gray-900 dark:text-gray-100">#{item.Product?.id || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">SKU:</span>
                                        <div className="text-gray-900 dark:text-gray-100">{item.Product?.SKU || 'N/A'}</div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Title:</span>
                                      <div className="text-gray-900 dark:text-gray-100">{item.Product?.name || 'N/A'}</div>
                                    </div>
                                    
                                    <div>
                                      <span className="font-medium text-gray-600 dark:text-gray-400">Slug:</span>
                                      <div className="text-gray-900 dark:text-gray-100 font-mono text-xs">{item.Product?.slug || 'N/A'}</div>
                                    </div>
                                    
                                    {item.Product?.barcode && (
                                      <div>
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Barcode:</span>
                                        <div className="text-gray-900 dark:text-gray-100 font-mono text-xs">{item.Product.barcode}</div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Product Description */}
                                  {item.Product?.description && (
                                    <div className="mt-3">
                                      <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">Description:</span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                                        {item.Product.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Right Column - Order Details */}
                              <div className="space-y-3">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                  <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Order Details</h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-blue-700 dark:text-blue-300">Quantity Ordered:</span>
                                      <span className="font-semibold text-blue-900 dark:text-blue-100">{item.quantity}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-700 dark:text-blue-300">Current Stock:</span>
                                      <span className={`font-semibold ${
                                        (item.Product?.quantity ?? 0) > 10 
                                          ? 'text-green-600 dark:text-green-400'
                                          : (item.Product?.quantity ?? 0) > 0 
                                          ? 'text-yellow-600 dark:text-yellow-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}>
                                        {(item.Product?.quantity ?? 0)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-700 dark:text-blue-300">Unit Price:</span>
                                      <span className="font-semibold text-blue-900 dark:text-blue-100">${(item.unitPriceCents/100).toFixed(2)}</span>
                                    </div>
                                    <hr className="border-blue-200 dark:border-blue-700" />
                                    <div className="flex justify-between">
                                      <span className="font-semibold text-blue-900 dark:text-blue-100">Item Total:</span>
                                      <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                                        ${((item.unitPriceCents * item.quantity)/100).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Current Product Info */}
                                {(item.Product?.price || item.Product?.compareAtPrice) && (
                                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Product Info</h5>
                                    <div className="space-y-1 text-sm">
                                      {item.Product?.price && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                                          <span className="text-gray-900 dark:text-gray-100">${Number(item.Product.price).toFixed(2)}</span>
                                        </div>
                                      )}
                                      {item.Product?.compareAtPrice && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600 dark:text-gray-400">Compare At:</span>
                                          <span className="text-gray-900 dark:text-gray-100">${Number(item.Product.compareAtPrice).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Product Status Badges */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.Product?.isActive !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.Product.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {item.Product.isActive ? '✓ Active Product' : '✗ Inactive Product'}
                                </span>
                              )}
                              {item.Product?.quantity !== undefined && (
                                <div className="flex flex-col gap-1">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    item.Product.quantity > 10 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : item.Product.quantity > 0 
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    Current Stock: {item.Product.quantity}
                                  </span>
                                  {selectedOrder.status === 'delivered' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      Stock Impact: -{item.quantity}
                                    </span>
                                  )}
                                  {selectedOrder.status === 'paid' && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                      Reserved: {item.quantity}
                                    </span>
                                  )}
                                </div>
                              )}
                              {item.Product?.images && item.Product.images.length > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  {item.Product.images.length} Image{item.Product.images.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {item.Product?.weightGrams && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                  Weight: {item.Product.weightGrams}g
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Order Summary */}
                  <div className="mt-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Items Total:</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ${(calculateItemsTotal(selectedOrder.items || [])/100).toFixed(2)} {selectedOrder.currency}
                        </span>
                      </div>
                      {selectedOrder.totalAmountCents !== calculateItemsTotal(selectedOrder.items || []) && (
                        <>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Shipping:</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              ${((selectedOrder.totalAmountCents - calculateItemsTotal(selectedOrder.items || []))/100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600">
                            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Order Total:</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              ${(selectedOrder.totalAmountCents/100).toFixed(2)} {selectedOrder.currency}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Order Notes</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}


