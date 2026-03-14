import { useState, useCallback } from "react";
import { Clinic } from "@/data/types";

export interface HistoryEntry {
  id: string;
  date: string;
  symptoms: string;
  careType: string;
  navigatedClinic?: {
    id: string;
    name: string;
    address: string;
    url: string;
  };
}

// sessionStorage is used instead of localStorage because:
// 1. It is automatically cleared when the browser tab or window closes,
//    preventing PHI from persisting on shared or unattended devices.
// 2. It is scoped to a single browser tab, limiting cross-session exposure.
// HIPAA Technical Safeguards (45 CFR §164.312(a)(2)(iii)) require automatic
// logoff and minimum necessary data retention.
const STORAGE_KEY = "urgentNow_history";

// Entries older than 8 hours are considered stale and discarded on load.
const MAX_ENTRY_AGE_MS = 8 * 60 * 60 * 1000;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    const cutoff = Date.now() - MAX_ENTRY_AGE_MS;
    // Discard entries older than 8 hours (data minimization)
    return parsed.filter((e) => new Date(e.date).getTime() > cutoff);
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {
    // sessionStorage may be full or disabled — fail silently
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback((symptoms: string, careType: string): string => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      symptoms,
      careType,
    };
    setHistory((prev) => {
      const next = [entry, ...prev];
      saveHistory(next);
      return next;
    });
    return entry.id;
  }, []);

  const recordNavigate = useCallback((entryId: string, clinic: Clinic) => {
    setHistory((prev) => {
      const next = prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              navigatedClinic: {
                id: clinic.id,
                name: clinic.name,
                address: clinic.address,
                url: clinic.url,
              },
            }
          : e
      );
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, recordNavigate, clearHistory };
}
