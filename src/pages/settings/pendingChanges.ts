import { createContext, useContext, useEffect, useRef } from "react";

/** Highlights for values that differ from the saved ones. */
export const CHANGED_INPUT = "border-yellow-400 bg-yellow-100";
export const CHANGED_BLOCK = "border-yellow-400 bg-yellow-50";

/** One part of a settings page that has unsaved changes and knows how to save them. */
export interface PendingSection {
  label: string;
  dirty: boolean;
  /** Set when the pending changes are invalid and must not be saved. */
  error?: string | null;
  /** Lower numbers are saved first. */
  order?: number;
  save: () => Promise<unknown>;
}

export const PendingRegisterContext = createContext<((id: string, section: PendingSection | null) => void) | null>(null);
export const PendingSectionsContext = createContext<Record<string, PendingSection>>({});

/** Reports the unsaved changes of a section to the page's shared "Save" button. */
export function usePendingChanges(id: string, section: PendingSection) {
  const register = useContext(PendingRegisterContext);
  const saveRef = useRef(section.save);
  const { label, dirty, error, order } = section;

  useEffect(() => {
    saveRef.current = section.save;
  });

  useEffect(() => {
    register?.(id, { label, dirty, error, order, save: () => saveRef.current() });
  }, [register, id, label, dirty, error, order]);

  useEffect(() => () => register?.(id, null), [register, id]);
}
