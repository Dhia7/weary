const NAV_OFFSET_FALLBACK_PX = 76;
const MAX_SCROLL_ATTEMPTS = 30;
const SCROLL_RETRY_MS = 100;

function getNavOffset() {
  const nav = document.querySelector('nav');
  if (!nav) return NAV_OFFSET_FALLBACK_PX;

  return nav.getBoundingClientRect().height + 12;
}

export function scrollToHomeSection(sectionId: string) {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

  const scroll = (section: HTMLElement) => {
    const top =
      section.getBoundingClientRect().top + window.scrollY - getNavOffset();

    window.scrollTo({ top: Math.max(top, 0), behavior });
  };

  const attempt = (remaining: number) => {
    const section = document.getElementById(sectionId);
    if (section) {
      scroll(section);
      return;
    }

    if (remaining <= 0) return;

    window.setTimeout(() => attempt(remaining - 1), SCROLL_RETRY_MS);
  };

  attempt(MAX_SCROLL_ATTEMPTS);
}
