"use client";
import { usePathname } from "next/navigation";

// Public-site chrome (floating WhatsApp button + mobile bottom quick-action bar).
// Never rendered inside /admin.
export default function PublicChrome({ wa, waMsg, tel }) {
  const pathname = usePathname();
  if (pathname && pathname.startsWith("/admin")) return null;
  return (
    <>
      <a
        className="wa-float"
        href={`https://wa.me/${wa}?text=${waMsg}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.14 15.06l-.31-.19-3 .87.88-2.9-.2-.32A8.1 8.1 0 0 1 12.04 3.8Zm-3.1 4.02c-.18 0-.46.06-.7.31-.24.25-.95.93-.95 2.27s.97 2.63 1.1 2.82c.14.18 1.9 3 4.7 4.04.56.2 1 .33 1.34.42.57.18 1.08.16 1.49.1.45-.07 1.4-.57 1.59-1.12.2-.55.2-1.02.14-1.12-.06-.1-.24-.16-.5-.28l-2.1-1.04c-.26-.13-.45-.19-.64.06l-.9 1.08c-.17.19-.33.22-.6.11a7.6 7.6 0 0 1-2.24-1.38 8.42 8.42 0 0 1-1.56-1.94c-.16-.28-.02-.43.13-.57l.42-.5c.13-.16.19-.27.28-.45.1-.18.05-.34-.02-.47l-.94-2.27c-.24-.6-.5-.52-.69-.53h-.59Z" />
        </svg>
      </a>
      <nav className="mobile-bottombar" aria-label="Quick actions">
        <a href={tel}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.7 2Z" />
          </svg>
          Call
        </a>
        <a href={`https://wa.me/${wa}?text=${waMsg}`} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.18-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 1 1-4.14 15.06l-.31-.19-3 .87.88-2.9-.2-.32A8.1 8.1 0 0 1 12.04 3.8Zm-3.1 4.02c-.18 0-.46.06-.7.31-.24.25-.95.93-.95 2.27s.97 2.63 1.1 2.82c.14.18 1.9 3 4.7 4.04.56.2 1 .33 1.34.42.57.18 1.08.16 1.49.1.45-.07 1.4-.57 1.59-1.12.2-.55.2-1.02.14-1.12-.06-.1-.24-.16-.5-.28l-2.1-1.04c-.26-.13-.45-.19-.64.06l-.9 1.08c-.17.19-.33.22-.6.11a7.6 7.6 0 0 1-2.24-1.38 8.42 8.42 0 0 1-1.56-1.94c-.16-.28-.02-.43.13-.57l.42-.5c.13-.16.19-.27.28-.45.1-.18.05-.34-.02-.47l-.94-2.27c-.24-.6-.5-.52-.69-.53h-.59Z" />
          </svg>
          WhatsApp
        </a>
        <a href="/contact">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
            <path d="M14 2v6h6M9 13h6M9 17h4" />
          </svg>
          Get a Quote
        </a>
      </nav>
    </>
  );
}
