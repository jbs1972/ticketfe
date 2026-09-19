// File-related helpers
export const VIEWABLE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const isViewable = (mimeType) => VIEWABLE_MIME_TYPES.includes(mimeType);

export const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

// Ticket diffing (used by silent polling)
export const getChangedTicketIds = (oldList, newList) => {
  const oldMap = new Map(oldList.map((t) => [t._id, t]));
  const changed = [];

  for (const newTicket of newList) {
    const oldTicket = oldMap.get(newTicket._id);

    const oldSig = oldTicket
      ? JSON.stringify({
          subject: oldTicket.subject,
          description: oldTicket.description,
          attachments: (oldTicket.attachments || [])
            .map((f) => f.fileName)
            .sort(),
        })
      : null;

    const newSig = JSON.stringify({
      subject: newTicket.subject,
      description: newTicket.description,
      attachments: (newTicket.attachments || []).map((f) => f.fileName).sort(),
    });

    if (oldSig !== newSig) changed.push(newTicket._id);
  }

  return changed;
};

// Error message extraction
export const getErrorMessage = (error, fallback) =>
  error?.response?.data?.data?.errors?.[0] ||
  error?.response?.data?.message ||
  fallback;

// Rich text helpers
export const isEmptyRichText = (html) => {
  if (!html) return true;
  const stripped = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return stripped.length === 0;
};

export const isRichTextHtml = (value) => /<[a-z][\s\S]*>/i.test(value || "");

// Date formatting (dd/mm/yyyy across the app)
export const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}/${month}/${year}, ${time}`;
};

export const extractMentionedUserIds = (html) => {
  if (!html) return [];
  const matches = [...html.matchAll(/data-user-id="([^"]+)"/g)];
  return [...new Set(matches.map((m) => m[1]))];
};

// Attach to a <form> (or wrapping container) via onKeyDown.
// Moves focus to next focusable field on Enter; submits on the last field.
// Pass onSubmit for containers that aren't real <form> elements (e.g. TicketFormModal).
export const handleEnterNavigation = (e, onSubmit) => {
  if (e.key !== "Enter") return;

  const tag = e.target.tagName;
  if (tag === "TEXTAREA" || tag === "BUTTON") return;

  e.preventDefault();

  const container = e.currentTarget;
  const focusable = Array.from(
    container.querySelectorAll(
      "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])",
    ),
  );
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
