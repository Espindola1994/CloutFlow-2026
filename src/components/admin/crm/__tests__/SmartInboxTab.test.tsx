import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { SmartInboxTab } from '../SmartInboxTab';
import React from 'react';

vi.mock('lucide-react', () => ({
  Inbox: () => <div data-testid="icon-inbox" />,
  Send: () => <div data-testid="icon-send" />,
  Search: () => <div data-testid="icon-search" />,
  RefreshCw: () => <div data-testid="icon-refresh" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  MessageSquare: () => <div data-testid="icon-msg" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  ChevronDown: () => <div data-testid="icon-chevron" />,
  Trash2: () => <div data-testid="icon-trash2" />,
  MoreVertical: () => <div data-testid="icon-morevertical" />,
  Volume2: () => <div data-testid="icon-volume2" />,
  VolumeX: () => <div data-testid="icon-volumex" />,
  User: () => <div data-testid="icon-user" />,
  Copy: () => <div data-testid="icon-copy" />,
  RotateCcw: () => <div data-testid="icon-rotateccw" />,
  CheckSquare: () => <div data-testid="icon-checksquare" />,
  Square: () => <div data-testid="icon-square" />,
  FileText: () => <div data-testid="icon-filetext" />,
}));

const mockDataThread1 = {
  id: 'thread-1',
  customerEmail: 'test@example.com',
  status: 'NEEDS_REPLY',
  subject: 'Help',
  unreadCount: 1,
  latestMessageAt: new Date().toISOString(),
  snippet: 'Hello',
  latestMessageDirection: 'INBOUND',
  relatedOrder: null,
};

const mockDetailThread1 = {
  thread: { id: 'thread-1', subject: 'Help', status: 'NEEDS_REPLY', customerEmail: 'test@example.com', unreadCount: 0, latestMessageAt: new Date().toISOString() },
  customer: { email: 'test@example.com', name: 'Test User' },
  orders: [],
  messages: [{
    id: 'msg-1', direction: 'INBOUND', fromEmail: 'test@example.com', toEmail: 'support@cloutflow.com',
    subject: 'Help', textBody: 'Hello', createdAt: new Date().toISOString()
  }]
};

describe('SmartInboxTab Live Refresh', () => {
  beforeEach(() => {
    const customFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/admin/inbox/sync')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { syncedCount: 1, duplicateCount: 0, ignoredCount: 0, lastSyncAt: new Date().toISOString(), isLocked: false, isError: false }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads') && !url.includes('/api/admin/inbox/threads/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              threads: [mockDataThread1],
              counts: { total: 1, needsReply: 1, waitingCustomer: 0, resolved: 0, unread: 1 }
            }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads/thread-1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: mockDetailThread1
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    });

    global.fetch = customFetch;
    window.fetch = customFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scenarios A & C: open conversation updates automatically without duplicates', async () => {
    render(<SmartInboxTab />);
    
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('test@example.com'));

    await waitFor(() => {
      expect(screen.getAllByText('Hello').length).toBeGreaterThan(0);
    });

    const updatedFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/admin/inbox/sync')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { syncedCount: 1, duplicateCount: 0, ignoredCount: 0 }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads') && !url.includes('/api/admin/inbox/threads/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              threads: [{ ...mockDataThread1, snippet: 'New incoming reply' }],
              counts: { total: 1, needsReply: 1, waitingCustomer: 0, resolved: 0, unread: 0 }
            }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads/thread-1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...mockDetailThread1,
              messages: [
                ...mockDetailThread1.messages,
                { id: 'msg-2', direction: 'INBOUND', fromEmail: 'test@example.com', toEmail: 'support@cloutflow.com', subject: 'Help', textBody: 'New incoming reply', createdAt: new Date().toISOString() }
              ]
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    });

    global.fetch = updatedFetch;
    window.fetch = updatedFetch;

    fireEvent.click(screen.getByTitle('Sync Now'));

    await waitFor(() => {
      // Find the element rendered by the markdown/text block
      const newMessages = screen.getAllByText('New incoming reply');
      expect(newMessages.length).toBeGreaterThan(0);
    });

    const helloElements = screen.getAllByText('Hello');
    expect(helloElements.length).toBeLessThanOrEqual(2);
  });

  it('scenario B: thread A open + inbound message for thread B keeps thread A unchanged', async () => {
    render(<SmartInboxTab />);
    
    await waitFor(() => expect(screen.getByText('test@example.com')).toBeInTheDocument());

    fireEvent.click(screen.getByText('test@example.com'));

    await waitFor(() => expect(screen.getAllByText('Hello').length).toBeGreaterThan(0));

    const threadBFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/admin/inbox/sync')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { syncedCount: 1, duplicateCount: 0, ignoredCount: 0 }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads') && !url.includes('/api/admin/inbox/threads/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              threads: [
                mockDataThread1,
                { id: 'thread-2', customerEmail: 'other@example.com', status: 'NEEDS_REPLY', subject: 'Order Inquiry', unreadCount: 1, latestMessageAt: new Date().toISOString(), snippet: 'Where is my order?' }
              ],
              counts: { total: 2, needsReply: 2, waitingCustomer: 0, resolved: 0, unread: 1 }
            }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads/thread-1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: mockDetailThread1
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    });

    global.fetch = threadBFetch;
    window.fetch = threadBFetch;

    fireEvent.click(screen.getByTitle('Sync Now'));

    await waitFor(() => {
      expect(screen.getByText('other@example.com')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Hello').length).toBeGreaterThan(0);
    // Thread B's new message should only show up in the left sidebar snippet, not in the active thread detail messages
    const whereElements = screen.queryAllByText('Where is my order?');
    // Ensure the message is only found once (in the sidebar snippet)
    expect(whereElements.length).toBeLessThanOrEqual(1);
  });

  it('scenario F: draft text exists during refresh and is preserved', async () => {
    render(<SmartInboxTab />);
    
    await waitFor(() => expect(screen.getByText('test@example.com')).toBeInTheDocument());

    fireEvent.click(screen.getByText('test@example.com'));

    await waitFor(() => expect(screen.getByPlaceholderText(/Reply to test@example.com/i)).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/Reply to test@example.com/i);
    fireEvent.change(textarea, { target: { value: 'This is my draft' } });

    expect(textarea).toHaveValue('This is my draft');

    fireEvent.click(screen.getByTitle('Sync Now'));

    await waitFor(() => {
      expect(textarea).toHaveValue('This is my draft');
    });
  });

  it('scenario G: thread refetch failure does not blank the active conversation and shows non-blocking notice', async () => {
    render(<SmartInboxTab />);
    
    await waitFor(() => expect(screen.getByText('test@example.com')).toBeInTheDocument());

    fireEvent.click(screen.getByText('test@example.com'));

    await waitFor(() => expect(screen.getAllByText('Hello').length).toBeGreaterThan(0));

    const failFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/admin/inbox/threads/thread-1')) {
        return Promise.reject(new Error('Network error'));
      }
      if (url.includes('/api/admin/inbox/sync')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: { syncedCount: 1, duplicateCount: 0, ignoredCount: 0 }
          })
        });
      }
      if (url.includes('/api/admin/inbox/threads')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              threads: [mockDataThread1],
              counts: { total: 1, needsReply: 1, waitingCustomer: 0, resolved: 0, unread: 1 }
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    });

    global.fetch = failFetch;
    window.fetch = failFetch;

    // Trigger sync without explicitly failing the whole component state
    await act(async () => {
      fireEvent.click(screen.getByTitle('Sync Now'));
    });

    await waitFor(() => {
      expect(screen.getAllByText('Hello').length).toBeGreaterThan(0);
      expect(screen.getByText(/Erro de conexão ao atualizar conversa/i)).toBeInTheDocument();
    });
  });
});