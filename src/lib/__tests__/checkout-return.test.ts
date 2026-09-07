import { describe, expect, it, vi } from "vitest";
import { CHECKOUT_RETURN_FLAG, markCheckoutReturn, processCheckoutReturn } from "@/lib/checkout-return";

function storage() {
  const values = new Map<string, string>();
  return { setItem: (k: string, v: string) => values.set(k, v), getItem: (k: string) => values.get(k) ?? null, removeItem: (k: string) => values.delete(k) };
}

describe("checkout return protection", () => {
  it("marks only after a valid checkout URL and resets/removes on return", () => {
    const store = storage();
    markCheckoutReturn(store);
    const reset = vi.fn();
    const replaceHome = vi.fn();
    expect(processCheckoutReturn({ storage: store, resetFunnel: reset, replaceHome })).toBe(true);
    expect(reset).toHaveBeenCalledOnce();
    expect(replaceHome).toHaveBeenCalledOnce();
    expect(store.getItem(CHECKOUT_RETURN_FLAG)).toBeNull();
  });

  it("does not reset without a checkout flag, including an unrelated BFCache return", () => {
    const reset = vi.fn();
    expect(processCheckoutReturn({ storage: storage(), resetFunnel: reset, replaceHome: vi.fn() })).toBe(false);
    expect(reset).not.toHaveBeenCalled();
  });

  it("consumes the flag so a later popstate/pageshow cannot reset again", () => {
    const store = storage();
    markCheckoutReturn(store);
    const reset = vi.fn();
    const replaceHome = vi.fn();

    expect(processCheckoutReturn({ storage: store, resetFunnel: reset, replaceHome })).toBe(true);
    expect(processCheckoutReturn({ storage: store, resetFunnel: reset, replaceHome })).toBe(false);
    expect(reset).toHaveBeenCalledOnce();
    expect(replaceHome).toHaveBeenCalledOnce();
  });
});
