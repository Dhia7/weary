/**
 * Runs from a literal <script> in document head (before paint).
 * Keeps <html class="dark"> in sync with localStorage so production
 * does not briefly follow OS dark mode or flash the wrong palette.
 */
export const THEME_INLINE_SCRIPT = [
  "(function(){",
  "try{",
  "var t=localStorage.getItem('theme');",
  "document.documentElement.classList.toggle('dark',t==='dark');",
  "}catch(e){}",
  "})();",
].join("");
