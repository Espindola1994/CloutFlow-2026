import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CrmModule } from "../CrmModule";
import { SmartInboxTab } from "../SmartInboxTab";
import { SentEmailHistoryTab } from "../SentEmailHistoryTab";
import { AutomationsTab } from "../AutomationsTab";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";

// Mock useAdminAutoRefresh hook
vi.mock("@/hooks/useAdminAutoRefresh", () => ({
  useAdminAutoRefresh: vi.fn(),
}));

const mockContactsPayload = {
  success: true,
  data: {
    contacts: [
      {
        email: "sarah@example.com",
        name: "Sarah Miller",
        target: "@sarahstyle",
        platform: "instagram",
        customerType: "CUSTOMER",
        derivedStatus: "COMPLETED",
        ordersCount: 2,
        totalSpentCents: 9800,
        lastActivity: "2026-09-12T14:30:00Z",
        suppressed: false,
        activeOffersCount: 0,
        tags: ["fashion", "vip"],
      },
      {
        email: "lead_mike@example.com",
        name: null,
        target: "@mike_fitness",
        platform: "tiktok",
        customerType: "LEAD",
        derivedStatus: "ABANDONED",
        ordersCount: 0,
        totalSpentCents: 0,
        lastActivity: "2026-09-11T10:00:00Z",
        suppressed: false,
        activeOffersCount: 1,
        tags: [],
      },
    ],
  },
};

const mockInboxThreadsPayload = {
  success: true,
  data: {
    threads: [
      {
        id: "th_001",
        customerEmail: "sarah@example.com",
        customerId: "cust_1",
        customerName: "Sarah Miller",
        status: "NEEDS_REPLY",
        subject: "Where is my order delivery?",
        unreadCount: 1,
        latestMessageAt: "2026-09-13T10:00:00Z",
        snippet: "Hi, I placed an order 2 hours ago and wanted to check...",
        latestMessageDirection: "INBOUND",
        relatedOrder: {
          id: "ord_101",
          publicId: "ORD101ALPHA",
          paymentStatus: "paid",
          fulfillmentStatus: "IN_PROGRESS",
          targetHandle: "sarahstyle",
          platform: "instagram",
          service: "followers",
        },
      },
    ],
    counts: {
      total: 1,
      needsReply: 1,
      waitingCustomer: 0,
      resolved: 0,
      unread: 1,
    },
  },
};

const mockThreadDetailPayload = {
  success: true,
  data: {
    thread: {
      id: "th_001",
      customerEmail: "sarah@example.com",
      customerId: "cust_1",
      status: "NEEDS_REPLY",
      subject: "Where is my order delivery?",
      relatedOrderId: "ord_101",
      latestMessageAt: "2026-09-13T10:00:00Z",
      unreadCount: 1,
    },
    customer: {
      id: "cust_1",
      name: "Sarah Miller",
      email: "sarah@example.com",
    },
    orders: [
      {
        id: "ord_101",
        publicId: "ORD101ALPHA",
        platform: "instagram",
        service: "followers",
        quantity: 1000,
        amountCents: 4900,
        paymentStatus: "paid",
        fulfillmentStatus: "IN_PROGRESS",
        targetHandle: "sarahstyle",
        createdAt: "2026-09-13T08:00:00Z",
      },
    ],
    messages: [
      {
        id: "msg_001",
        direction: "INBOUND",
        provider: "gmail",
        fromEmail: "sarah@example.com",
        toEmail: "support@cloutflow.co",
        subject: "Where is my order delivery?",
        textBody: "Hi, I placed an order 2 hours ago and wanted to check status.",
        createdAt: "2026-09-13T10:00:00Z",
      },
    ],
  },
};

describe("UI 5.4 — Admin Mobile CRM Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/admin/crm/contacts")) {
        return {
          ok: true,
          json: async () => mockContactsPayload,
        };
      }
      if (url.includes("/api/admin/inbox/threads/th_001")) {
        return {
          ok: true,
          json: async () => mockThreadDetailPayload,
        };
      }
      if (url.includes("/api/admin/inbox/threads")) {
        return {
          ok: true,
          json: async () => mockInboxThreadsPayload,
        };
      }
      if (url.includes("/api/admin/inbox/status")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { lastSyncAt: "2026-09-13T09:00:00Z", isLocked: false, isError: false },
          }),
        };
      }
      if (url.includes("/api/admin/inbox/reply")) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { messageId: "msg_reply_1" } }),
        };
      }
      return {
        ok: false,
        json: async () => ({ success: false }),
      };
    }));
  });

  it("1. renders contacts list with real contacts, status, and touch-friendly mobile cards", async () => {
    render(
      <AdminThemeProvider>
        <CrmModule />
      </AdminThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("sarah@example.com").length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Sarah Miller").length).toBeGreaterThan(0);
    expect(screen.getAllByText("lead_mike@example.com").length).toBeGreaterThan(0);

    // Verify search works
    const searchInputs = screen.getAllByPlaceholderText(/Search contact by email/i);
    expect(searchInputs.length).toBeGreaterThan(0);
    fireEvent.change(searchInputs[0], { target: { value: "sarah" } });

    expect(screen.getAllByText("sarah@example.com").length).toBeGreaterThan(0);
    expect(screen.queryByText("lead_mike@example.com")).toBeNull();
  });

  it("2. Smart Inbox renders conversation list and navigates to conversation detail (2-stage mobile flow)", async () => {
    render(
      <AdminThemeProvider>
        <SmartInboxTab />
      </AdminThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Where is my order delivery?")).toBeDefined();
    });

    // Verify list is visible
    expect(screen.getByTestId("crm-inbox-conversation-list")).toBeDefined();

    // Click conversation
    const convoSnippet = screen.getByText("Where is my order delivery?");
    fireEvent.click(convoSnippet);

    // Wait for thread detail to load
    await waitFor(() => {
      expect(screen.getByTestId("crm-inbox-conversation-detail")).toBeDefined();
      expect(screen.getByText("Hi, I placed an order 2 hours ago and wanted to check status.")).toBeDefined();
    });

    // Back button exists on mobile
    const backBtn = screen.getByTestId("crm-inbox-back-btn");
    expect(backBtn).toBeDefined();

    // Composer is rendered with reply controls
    expect(screen.getByTestId("crm-inbox-composer")).toBeDefined();
    const replyTextarea = screen.getByTestId("inbox-reply-textarea");
    fireEvent.change(replyTextarea, { target: { value: "Your order is currently in progress!" } });

    // Click back button returns to list view
    fireEvent.click(backBtn);
    expect(screen.getByTestId("crm-inbox-conversation-list")).toBeDefined();
  });

  it("3. Smart Inbox search filters real threads without reloading", async () => {
    render(
      <AdminThemeProvider>
        <SmartInboxTab />
      </AdminThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Where is my order delivery?")).toBeDefined();
    });

    const searchInput = screen.getByTestId("inbox-search-input");
    expect(searchInput).toBeDefined();

    fireEvent.change(searchInput, { target: { value: "delivery" } });
    expect(screen.getByText("Where is my order delivery?")).toBeDefined();
  });
});
