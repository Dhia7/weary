/**
 * Runs from a literal <script> in document head (before paint).
 * Dark mode is disabled for now: always strip `dark` from <html> and
 * persist `theme=light` so the storefront stays on the light palette.
 */
export const THEME_INLINE_SCRIPT = [
  "(function(){",
  "try{",
  "document.documentElement.classList.remove('dark');",
  "localStorage.setItem('theme','light');",
  "}catch(e){}",
  "})();",
].join("");
