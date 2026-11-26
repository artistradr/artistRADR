// State for a "Pay now" action: busy while heading to Paystack, plus any error.
import { useCallback, useEffect, useRef, useState } from "react";
import { goToCheckout } from "./payments";

export function usePay() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false); // stops a double click starting two payments

  // The browser Back button can restore this page as it was, still "busy".
  useEffect(() => {
    function reset(event) {
      if (!event.persisted) return;
      running.current = false;
      setBusy(false);
    }
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  const pay = useCallback(async (campaignId) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await goToCheckout(campaignId);
    } catch (err) {
      running.current = false;
      setBusy(false);
      setError(err.message);
    }
  }, []);

  return { pay, busy, error };
}
