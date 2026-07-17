"use client";

import { useEffect, useRef, useState } from "react";

type ContactPanelProps = {
  open: boolean;
  onClose: () => void;
};

type Status = "idle" | "sending" | "success" | "error";

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ContactPanel({ open, onClose }: ContactPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (open) setStatus("idle");
  }, [open]);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

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

        {status === "success" ? (
          <div className="contact-panel__success" role="status">
            <span className="contact-panel__success-mark" aria-hidden="true">
              ✓
            </span>
            <h3>הפרטים התקבלו. תודה!</h3>
            <p>
              בפרויקט אמיתי היינו חוזרים אליכם תוך יום עסקים. כאן זו הדגמה — שום פרט לא נשמר
              ולא נשלח לאף גורם.
            </p>
            <button className="contact-panel__submit" type="button" onClick={onClose}>
              חזרה למסע
            </button>
          </div>
        ) : (
          <>
            <p className="contact-panel__note">
              זהו פרויקט קונספט — הטופס עובד מקצה לקצה, אבל הפרטים אינם נשמרים ואינם נשלחים
              לאף גורם.
            </p>
            <form onSubmit={handleSubmit}>
              <label>
                שם
                <input name="name" type="text" autoComplete="name" required minLength={2} />
              </label>
              <label>
                טלפון
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  pattern="0\d[\d\- ]{7,9}"
                  title="מספר טלפון ישראלי, לדוגמה 050-1234567"
                />
              </label>
              <label>
                סוג פרויקט
                <select name="projectType" defaultValue="">
                  <option value="" disabled>
                    בחירת סוג פרויקט
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
              {/* Honeypot: hidden from people (CSS + aria), attractive to bots. */}
              <label className="contact-panel__hp" aria-hidden="true">
                חברה
                <input name="company" type="text" tabIndex={-1} autoComplete="off" />
              </label>
              {status === "error" && (
                <p className="contact-panel__error" role="alert">
                  משהו השתבש בשליחה. נסו שוב, או חזרו מאוחר יותר.
                </p>
              )}
              <button className="contact-panel__submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "שולח…" : "שליחת פרטים"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
