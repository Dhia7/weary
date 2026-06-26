'use client';

import React, { useEffect, useState } from 'react';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import { markMessageAsSeen } from '@/lib/utils';
import { Trash2, Archive, MailOpen } from 'lucide-react';
import AdminPasswordConfirmModal from '@/components/admin/AdminPasswordConfirmModal';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  userId?: number | null;
  User?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  read: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

function syncMessageInList(
  messages: ContactMessage[],
  messageId: string,
  updates: Partial<ContactMessage>
): ContactMessage[] {
  return messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m));
}

function notifyMessageStatusChanged(messageId: string, status: ContactMessage['status']) {
  markMessageAsSeen(messageId);
  window.dispatchEvent(
    new CustomEvent('messageStatusChanged', { detail: { messageId, status } })
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function AdminMessagesPage() {
  const fetcher = useAuthorizedFetch();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<string | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{
    action: 'delete' | 'bulkDelete';
    messageId?: string;
    messageIds?: string[];
    title: string;
    description: string;
    confirmLabel: string;
  } | null>(null);
  const [passwordModalError, setPasswordModalError] = useState('');
  const [passwordActionLoading, setPasswordActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [perPage, setPerPage] = useState(20);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(perPage),
        });
        if (searchQuery) params.set('q', searchQuery);
        if (statusFilter) params.set('status', statusFilter);

        const res = await fetcher(`/admin/messages?${params.toString()}`);
        const json = await res.json();
        if (res.ok) {
          setMessages(json.data.messages);
          setTotalPages(json.data.pagination.totalPages);
          setTotalMessages(json.data.pagination.totalMessages);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetcher, currentPage, perPage, searchQuery, statusFilter]);

  useEffect(() => {
    setSelectedMessageIds([]);
  }, [currentPage, perPage, searchQuery, statusFilter]);

  const allMessagesSelected =
    messages.length > 0 && messages.every((message) => selectedMessageIds.includes(message.id));

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const toggleSelectAllOnPage = () => {
    if (allMessagesSelected) {
      const pageIds = new Set(messages.map((message) => message.id));
      setSelectedMessageIds((prev) => prev.filter((id) => !pageIds.has(id)));
      return;
    }
    const pageIds = messages.map((message) => message.id);
    setSelectedMessageIds((prev) => [...new Set([...prev, ...pageIds])]);
  };

  const refreshMessagesAfterDelete = (deletedIds: string[]) => {
    setMessages((prev) => prev.filter((m) => !deletedIds.includes(m.id)));
    setTotalMessages((prev) => Math.max(0, prev - deletedIds.length));
    setSelectedMessageIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
    if (selectedMessage && deletedIds.includes(selectedMessage.id)) {
      closeDetails();
    }
  };

  useEffect(() => {
    const handleMessageSeen = () => {
      setMessages((prev) => [...prev]);
    };
    const handleMessageStatusChanged = () => {
      setMessages((prev) => [...prev]);
    };
    window.addEventListener('messageSeen', handleMessageSeen);
    window.addEventListener('messageStatusChanged', handleMessageStatusChanged);
    return () => {
      window.removeEventListener('messageSeen', handleMessageSeen);
      window.removeEventListener('messageStatusChanged', handleMessageStatusChanged);
    };
  }, []);

  const handleMessageClick = async (message: ContactMessage) => {
    try {
      const res = await fetcher(`/admin/messages/${message.id}`);
      const json = await res.json();
      if (res.ok) {
        const fullMessage = json.data.message as ContactMessage;
        setSelectedMessage(fullMessage);
        setShowDetails(true);
        setMessages((prev) => syncMessageInList(prev, fullMessage.id, fullMessage));
        notifyMessageStatusChanged(fullMessage.id, fullMessage.status);
      }
    } catch (error) {
      console.error('Error loading message:', error);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedMessage(null);
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    setUpdatingStatus(messageId);
    try {
      const res = await fetcher(`/admin/messages/${messageId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const json = await res.json();
        const updatedMessage = json.data?.message as ContactMessage | undefined;
        const nextStatus = (updatedMessage?.status || status) as ContactMessage['status'];

        setMessages((prev) => syncMessageInList(prev, messageId, { status: nextStatus }));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, status: nextStatus });
        }
        notifyMessageStatusChanged(messageId, nextStatus);
      } else {
        const error = await res.json();
        alert(`Failed to update status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      alert('Failed to update message status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const promptDeleteMessage = (messageId: string) => {
    setPasswordModalError('');
    setPasswordModal({
      action: 'delete',
      messageId,
      title: 'Delete message',
      description: 'This will permanently delete this contact message. Enter your password to confirm.',
      confirmLabel: 'Delete message',
    });
  };

  const promptBulkDeleteMessages = () => {
    if (selectedMessageIds.length === 0) return;

    setPasswordModalError('');
    setPasswordModal({
      action: 'bulkDelete',
      messageIds: selectedMessageIds,
      title: 'Delete selected messages',
      description: `You are about to permanently delete ${selectedMessageIds.length} message(s). Enter your password to confirm.`,
      confirmLabel: `Delete ${selectedMessageIds.length} message(s)`,
    });
  };

  const executeBulkDeleteMessages = async (messageIds: string[], password: string) => {
    try {
      const res = await fetcher('/admin/messages/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ messageIds, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordModal(null);
        const deletedIds = (data.data?.deleted || []).map((item: { id: string }) => item.id);
        refreshMessagesAfterDelete(deletedIds);

        if (data.data?.skipped?.length) {
          alert(`${data.message}\n\nSkipped:\n${data.data.skipped.map((s: { id: string; reason: string }) => `- ${s.id}: ${s.reason}`).join('\n')}`);
        }
      } else {
        setPasswordModalError(data.message || 'Failed to delete selected messages');
      }
    } catch (error) {
      console.error('Error bulk deleting messages:', error);
      setPasswordModalError('Failed to delete selected messages');
    }
  };

  const executeBulkArchive = async () => {
    if (selectedMessageIds.length === 0) return;

    setBulkActionLoading(true);
    try {
      const res = await fetcher('/admin/messages/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({ messageIds: selectedMessageIds, status: 'archived' }),
      });
      const data = await res.json();

      if (res.ok) {
        const updatedIds = (data.data?.updated || []).map((item: { id: string }) => item.id);
        setMessages((prev) =>
          prev.map((m) =>
            updatedIds.includes(m.id) ? { ...m, status: 'archived' as const } : m
          )
        );
        updatedIds.forEach((id: string) => notifyMessageStatusChanged(id, 'archived'));
        setSelectedMessageIds([]);
      } else {
        alert(data.message || 'Failed to archive selected messages');
      }
    } catch (error) {
      console.error('Error bulk archiving messages:', error);
      alert('Failed to archive selected messages');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeBulkMarkRead = async () => {
    if (selectedMessageIds.length === 0) return;

    setBulkActionLoading(true);
    try {
      const res = await fetcher('/admin/messages/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({ messageIds: selectedMessageIds, status: 'read' }),
      });
      const data = await res.json();

      if (res.ok) {
        const updatedIds = (data.data?.updated || []).map((item: { id: string }) => item.id);
        setMessages((prev) =>
          prev.map((m) =>
            updatedIds.includes(m.id) ? { ...m, status: 'read' as const } : m
          )
        );
        updatedIds.forEach((id: string) => notifyMessageStatusChanged(id, 'read'));
        setSelectedMessageIds([]);
      } else {
        alert(data.message || 'Failed to mark selected messages as read');
      }
    } catch (error) {
      console.error('Error bulk marking messages as read:', error);
      alert('Failed to mark selected messages as read');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeDeleteMessage = async (messageId: string, password: string) => {
    setDeletingMessage(messageId);
    try {
      const res = await fetcher(`/admin/messages/${messageId}`, {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordModal(null);
        refreshMessagesAfterDelete([messageId]);
      } else {
        setPasswordModalError(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setPasswordModalError('Failed to delete message');
    } finally {
      setDeletingMessage(null);
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!passwordModal) return;

    setPasswordActionLoading(true);
    setPasswordModalError('');

    try {
      if (passwordModal.action === 'delete' && passwordModal.messageId) {
        await executeDeleteMessage(passwordModal.messageId, password);
      } else if (passwordModal.action === 'bulkDelete' && passwordModal.messageIds?.length) {
        await executeBulkDeleteMessages(passwordModal.messageIds, password);
      }
    } finally {
      setPasswordActionLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
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

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="perPage" className="text-sm text-gray-600 dark:text-gray-400">
                Per page:
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
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {totalMessages} message{totalMessages !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="searchInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <input
                  id="searchInput"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Name, email, or subject..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">All</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {selectedMessageIds.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-950">
            <p className="text-sm text-indigo-900 dark:text-indigo-200">
              {selectedMessageIds.length} message{selectedMessageIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMessageIds([])}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Clear selection
              </button>
              <button
                onClick={executeBulkMarkRead}
                disabled={bulkActionLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <MailOpen className="h-4 w-4 mr-1.5" />
                Mark as Read
              </button>
              <button
                onClick={executeBulkArchive}
                disabled={bulkActionLoading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Archive
              </button>
              <button
                onClick={promptBulkDeleteMessages}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete selected
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No messages found.
          </div>
        ) : (
          <>
            <div className="overflow-auto rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allMessagesSelected}
                        onChange={toggleSelectAllOnPage}
                        disabled={messages.length === 0}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        aria-label="Select all messages on this page"
                        title="Select all messages on this page"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">From</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Subject</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {messages.map((message) => {
                    const isNewUnseen = message.status === 'new';
                    return (
                      <tr
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isNewUnseen ? 'bg-blue-50 dark:bg-blue-950/30 font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedMessageIds.includes(message.id)}
                            onChange={() => toggleMessageSelection(message.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            aria-label={`Select message from ${message.name}`}
                            title={`Select message from ${message.name}`}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(message.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div>{message.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{message.email}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{message.subject}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[message.status] || ''}`}>
                            {message.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
                >
                  Previous
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded dark:border-gray-600 ${
                      page === currentPage ? 'bg-blue-600 text-white border-blue-600' : ''
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {showDetails && selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(selectedMessage.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={closeDetails}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">From</span>
                    <p className="text-gray-900 dark:text-white">
                      {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                    </p>
                  </div>
                  {selectedMessage.User && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Registered user</span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedMessage.User.firstName} {selectedMessage.User.lastName} ({selectedMessage.User.email})
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
                    <p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[selectedMessage.status] || ''}`}>
                        {selectedMessage.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</span>
                    <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {selectedMessage.status !== 'read' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'read')}
                      disabled={updatingStatus === selectedMessage.id}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <MailOpen className="h-4 w-4 mr-1.5" />
                      Mark as Read
                    </button>
                  )}
                  {selectedMessage.status !== 'archived' && (
                    <button
                      onClick={() => updateMessageStatus(selectedMessage.id, 'archived')}
                      disabled={updatingStatus === selectedMessage.id}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <Archive className="h-4 w-4 mr-1.5" />
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => promptDeleteMessage(selectedMessage.id)}
                    disabled={deletingMessage === selectedMessage.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {passwordModal && (
          <AdminPasswordConfirmModal
            isOpen={!!passwordModal}
            title={passwordModal.title}
            description={passwordModal.description}
            confirmLabel={passwordModal.confirmLabel}
            onConfirm={handlePasswordConfirm}
            onClose={() => {
              setPasswordModal(null);
              setPasswordModalError('');
            }}
            isLoading={passwordActionLoading}
            error={passwordModalError}
          />
        )}
      </div>
    </AdminGuard>
  );
}
