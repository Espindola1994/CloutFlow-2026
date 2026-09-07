export const CHECKOUT_RETURN_FLAG = "cloutflow:return-home-after-checkout";

export function markCheckoutReturn(storage: Pick<Storage, "setItem"> = sessionStorage): void {
  storage.setItem(CHECKOUT_RETURN_FLAG, "1");
}

export function processCheckoutReturn(
  options: {
    storage?: Pick<Storage, "getItem" | "removeItem">;
    resetFunnel: () => void;
    replaceHome: () => void;
  },
): boolean {
  const storage = options.storage ?? sessionStorage;
  // A BFCache pageshow is not enough by itself: only a checkout we started
  // can invalidate the analysis currently shown on the Home page.
  if (storage.getItem(CHECKOUT_RETURN_FLAG) !== "1") return false;
  options.resetFunnel();
  options.replaceHome();
  storage.removeItem(CHECKOUT_RETURN_FLAG);
  return true;
}
