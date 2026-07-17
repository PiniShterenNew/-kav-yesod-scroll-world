import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found" aria-labelledby="nf-title">
      <p className="not-found__code">404</p>
      <h1 id="nf-title">הדף הזה עוד לא נבנה.</h1>
      <p>כמו בבנייה טובה — כשמגיעים לשטח לא מסומן, חוזרים למסלול.</p>
      <Link className="not-found__link" href="/">
        חזרה לתחילת המסע
      </Link>
    </main>
  );
}
