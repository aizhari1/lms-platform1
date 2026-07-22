'use client';

import { useEffect, useRef } from 'react';

type ShortcutMap = Record<string, (event: KeyboardEvent) => void>;

/**
 * Keyboard Shortcuts — register a map of key -> handler once per
 * component. Keys can combine modifiers, e.g. "mod+k" (mod = Cmd on
 * Mac, Ctrl elsewhere), "ArrowRight", "Escape".
 *
 * Ignores keystrokes while the user is typing in an input/textarea,
 * unless the shortcut explicitly opts in via `allowInInputs`. Handlers
 * are read from a ref on every keydown, so callers can pass a fresh
 * inline object each render without worrying about stale closures.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, allowInInputs = false) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (isTyping && !allowInInputs) return;

      const isMod = event.metaKey || event.ctrlKey;
      const key = isMod ? `mod+${event.key.toLowerCase()}` : event.key;

      const handler = shortcutsRef.current[key] ?? shortcutsRef.current[event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allowInInputs]);
}
