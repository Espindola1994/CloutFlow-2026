"use client";

import { useEffect, useRef, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type AdminEntity = 
  | "orders" 
  | "payments" 
  | "offers" 
  | "fulfillment" 
  | "chains" 
  | "dashboard" 
  | "margins" 
  | "attribution";

type RevalidateListener = (entity?: string) => void;

class AdminEventManager {
  private listeners: Map<string, Set<RevalidateListener>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel("cloutflow_admin_sync");
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === "revalidate" && event.data?.entity) {
            this.notifyListeners(event.data.entity, false);
          }
        };
      } catch (err) {
        console.warn("[AdminEvents] BroadcastChannel not supported or failed", err);
      }
    }
  }

  subscribe(entity: string, listener: RevalidateListener): () => void {
    if (!this.listeners.has(entity)) {
      this.listeners.set(entity, new Set());
    }
    this.listeners.get(entity)!.add(listener);

    return () => {
      const set = this.listeners.get(entity);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(entity);
        }
      }
    };
  }

  /**
   * Triggers a debounced revalidation for an entity.
   * Dispatches locally and across tabs via BroadcastChannel.
   */
  revalidate(entity: AdminEntity | string, options?: { immediate?: boolean; broadcast?: boolean }) {
    const { immediate = false, broadcast = true } = options || {};
    const delay = immediate ? 0 : 350;

    const existingTimer = this.debounceTimers.get(entity);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(entity);
      this.notifyListeners(entity, broadcast);
    }, delay);

    this.debounceTimers.set(entity, timer);
  }

  private notifyListeners(entity: string, broadcast: boolean) {
    // Notify exact match
    const set = this.listeners.get(entity);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(entity);
        } catch (e) {
          console.error(`[AdminEvents] Error in listener for ${entity}:`, e);
        }
      });
    }

    // Notify global wildcard listeners
    const globalSet = this.listeners.get("*");
    if (globalSet) {
      globalSet.forEach((listener) => {
        try {
          listener(entity);
        } catch (e) {
          console.error(`[AdminEvents] Error in global listener:`, e);
        }
      });
    }

    if (broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: "revalidate", entity });
      } catch (e) {
        console.warn("[AdminEvents] Failed to broadcast message", e);
      }
    }
  }
}

export const adminEventManager = new AdminEventManager();

/**
 * Hook to trigger revalidations programmatically from mutations or manual buttons.
 */
export function useAdminRevalidate() {
  return useCallback((entity: AdminEntity | string, immediate = false) => {
    adminEventManager.revalidate(entity, { immediate, broadcast: true });
  }, []);
}

interface UseAdminAutoRefreshOptions {
  /**
   * Entities to listen to for revalidations (e.g. ['orders', 'dashboard'])
   */
  entities?: (AdminEntity | string)[];
  /**
   * Tables in Supabase to subscribe to via Realtime Postgres Changes
   */
  supabaseTables?: string[];
  /**
   * Optional background polling interval in milliseconds (default: disabled)
   */
  pollInterval?: number;
  /**
   * Whether polling/refresh is currently enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Function to call when revalidation should occur
   */
  onRevalidate: () => void | Promise<void>;
}

/**
 * Universal hook for auto-refresh, realtime subscriptions, window focus, network reconnect, and polling.
 */
export function useAdminAutoRefresh({
  entities = [],
  supabaseTables = [],
  pollInterval,
  enabled = true,
  onRevalidate,
}: UseAdminAutoRefreshOptions) {
  const onRevalidateRef = useRef(onRevalidate);
  useEffect(() => {
    onRevalidateRef.current = onRevalidate;
  }, [onRevalidate]);

  const entitiesKey = entities.join(",");
  const supabaseTablesKey = supabaseTables.join(",");

  // 1. Listen for coordinated entity revalidations (cross-tab & internal mutations)
  useEffect(() => {
    if (!enabled || entities.length === 0) return;

    const unsubs = entities.map((entity) =>
      adminEventManager.subscribe(entity, () => {
        onRevalidateRef.current();
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, entitiesKey]);

  // 2. Supabase Realtime Subscriptions (Postgres Changes)
  useEffect(() => {
    if (!enabled || supabaseTables.length === 0) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const channelName = `admin_realtime_${supabaseTables.join("_")}_${Math.random().toString(36).slice(2, 7)}`;
    let channel: RealtimeChannel | null = null;

    try {
      channel = supabase.channel(channelName);

      supabaseTables.forEach((table) => {
        channel!.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            // Mapping table changes to entity revalidation
            if (table === "orders" || table === "order_items") {
              adminEventManager.revalidate("orders");
              adminEventManager.revalidate("dashboard");
              adminEventManager.revalidate("margins");
              adminEventManager.revalidate("attribution");
            } else if (table === "payment_leads") {
              adminEventManager.revalidate("orders");
              adminEventManager.revalidate("dashboard");
              adminEventManager.revalidate("margins");
            } else if (table === "fulfillment_orders") {
              adminEventManager.revalidate("fulfillment");
              adminEventManager.revalidate("orders");
              adminEventManager.revalidate("dashboard");
            } else if (table === "fulfillment_chains" || table === "fulfillment_chain_services") {
              adminEventManager.revalidate("chains");
              adminEventManager.revalidate("fulfillment");
            } else if (table === "offers" || table === "coupons") {
              adminEventManager.revalidate("offers");
            } else {
              onRevalidateRef.current();
            }
          }
        );
      });

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Connected cleanly
        }
      });
    } catch (err) {
      console.warn("[Realtime] Failed to subscribe channel:", err);
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, supabaseTablesKey]);

  // 3. Window Visibility & Focus Revalidation
  useEffect(() => {
    if (!enabled) return;

    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        onRevalidateRef.current();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [enabled]);

  // 4. Online / Reconnect Revalidation
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      onRevalidateRef.current();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled]);

  // 5. Background Polling (Pauses when document is hidden)
  useEffect(() => {
    if (!enabled || !pollInterval || pollInterval <= 0) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return; // Skip poll if tab is backgrounded
      }
      onRevalidateRef.current();
    }, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, pollInterval]);
}
