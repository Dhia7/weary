/**
 * Runs from a literal <script> in document head (before paint).
 * Mirrors localStorage language into a cookie so SSR can match the client.
 */
export const LANGUAGE_INLINE_SCRIPT = [
  "(function(){",
  "try{",
  "var lang=localStorage.getItem('language');",
  "if(lang!=='en'&&lang!=='fr')lang='fr';",
  "document.documentElement.lang=lang;",
  "document.cookie='language='+lang+';path=/;max-age=31536000;SameSite=Lax';",
  "}catch(e){",
  "document.documentElement.lang='fr';",
  "}",
  "})();",
].join("");
