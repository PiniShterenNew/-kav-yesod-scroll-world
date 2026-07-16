"use client";

import { useEffect, useRef } from "react";

type ContactPanelProps = {
  open: boolean;
  onClose: () => void;
};

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ContactPanel({ open, onClose }: ContactPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(focusableSelector);
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute("disabled")
      );

      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("panel-open");

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("panel-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="contact-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={panelRef}
        className="contact-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="contact-panel__close" type="button" onClick={onClose} aria-label="סגירת חלון יצירת קשר">
          ×
        </button>
        <p className="concept-label">גרסת הדגמה</p>
        <h2 id="contact-title">מתחילים לתכנן</h2>
        <p className="contact-panel__note">
          זהו פרויקט קונספט. אזור יצירת הקשר מוצג להדגמת חוויית האתר בלבד.
        </p>
        <form onSubmit={(event) => event.preventDefault()}>
          <label>
            שם
            <input name="name" type="text" autoComplete="name" />
          </label>
          <label>
            טלפון
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <label>
            סוג פרויקט
            <select name="projectType" defaultValue="">
              <option value="" disabled>
                בחירה להדגמה
              </option>
              <option>בית פרטי חדש</option>
              <option>הרחבה או שינוי מבנה</option>
              <option>התייעצות ראשונית</option>
            </select>
          </label>
          <label>
            הודעה
            <textarea name="message" rows={4} />
          </label>
          <button className="contact-panel__submit" type="submit" disabled>
            שליחת פרטים אינה פעילה בהדגמה
          </button>
        </form>
      </div>
    </div>
  );
}
