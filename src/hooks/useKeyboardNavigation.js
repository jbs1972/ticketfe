import { useEffect } from "react";

/**
 * Keyboard navigation for modals/forms, in one place.
 * Add new keyboard behaviors here as the app needs them
 * (e.g. arrow-key list navigation) so every consumer stays
 * a single import instead of a hand-rolled listener per file.
 */

const FOCUSABLE_SELECTOR =
  "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable='true']";

// Closes a modal/panel when Escape is pressed while it's open.
export const useEscapeKey = (isActive, onClose) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onClose]);
};

// Focuses the first focusable field inside a container as soon as it opens.
export const useAutoFocus = (isActive, containerRef) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const focusable = containerRef.current.querySelector(FOCUSABLE_SELECTOR);
    focusable?.focus();
  }, [isActive, containerRef]);
};

// Attach to a <form> (or wrapping container) via onKeyDown.
// Moves focus to the next focusable field on Enter; submits on the last field.
// Pass onSubmit for containers that aren't real <form> elements.
export const handleEnterNavigation = (e, onSubmit) => {
  if (e.key !== "Enter") return;

  // Something inside the field (e.g. RichTextEditor's @mention dropdown)
  // already handled this Enter — don't also navigate.
  if (e.defaultPrevented) return;

  const tag = e.target.tagName;
  if (tag === "TEXTAREA" || tag === "BUTTON") return;

  const isContentEditable =
    e.target.getAttribute?.("contenteditable") === "true";

  // Inside the rich text editor: Ctrl/Cmd+Enter inserts a real newline
  // (default contentEditable behavior); plain Enter instead moves on,
  // same as every other field.
  if (isContentEditable && (e.ctrlKey || e.metaKey)) return;

  e.preventDefault();

  const container = e.currentTarget;
  const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  const index = focusable.indexOf(e.target);

  if (index > -1 && index < focusable.length - 1) {
    focusable[index + 1].focus();
    return;
  }

  if (typeof container.requestSubmit === "function") {
    container.requestSubmit();
  } else if (onSubmit) {
    onSubmit();
  }
};
