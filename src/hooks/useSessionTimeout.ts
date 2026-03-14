import { useEffect, useRef, useCallback } from "react";

// HIPAA Technical Safeguards (45 CFR §164.312(a)(2)(iii)) require automatic
// logoff after a period of inactivity to prevent unauthorized access to ePHI.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000;       // warn 5 minutes before timeout

const ACTIVITY_EVENTS = [
  "mousedown", "mousemove", "keydown",
  "scroll", "touchstart", "click", "pointermove",
] as const;

interface UseSessionTimeoutOptions {
  isActive: boolean;        // only run when user is logged in
  onTimeout: () => void;    // called when session expires
  onWarning?: () => void;   // called 5 minutes before expiry
}

export function useSessionTimeout({
  isActive,
  onTimeout,
  onWarning,
}: UseSessionTimeoutOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);

  // Keep refs up to date without re-triggering the effect
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (warningRef.current) { clearTimeout(warningRef.current); warningRef.current = null; }
  }, []);

  const resetTimers = useCallback(() => {
    if (!isActive) return;
    clearTimers();
    warningRef.current = setTimeout(
      () => onWarningRef.current?.(),
      INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS
    );
    timeoutRef.current = setTimeout(
      () => onTimeoutRef.current(),
      INACTIVITY_TIMEOUT_MS
    );
  }, [isActive, clearTimers]);

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      return;
    }

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resetTimers, { passive: true })
    );
    resetTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, resetTimers)
      );
      clearTimers();
    };
  }, [isActive, resetTimers, clearTimers]);
}
