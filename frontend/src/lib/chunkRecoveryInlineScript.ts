/**
 * Runs from a literal <script> in the document head (no Next chunk).
 * Recovers from stale or slow chunk loads without a manual hard refresh.
 */
export const CHUNK_RECOVERY_INLINE_SCRIPT = [
  "(function(){",
  'var k="__swisse_chunk_fail_reload",r=!1;',
  "function go(){",
  "if(r)return;",
  "try{var c=parseInt(sessionStorage.getItem(k)||'0',10)||0;",
  "if(c>=3)return;",
  "sessionStorage.setItem(k,String(c+1));}catch(e){return;}",
  "r=!0;",
  "window.location.reload();",
  "}",
  "window.addEventListener('load',function(){",
  "try{sessionStorage.removeItem(k);}catch(e){}",
  "},{once:!0});",
  "window.addEventListener('error',function(e){",
  "var t=e&&e.target;",
  "if(!t||t.tagName!=='SCRIPT')return;",
  "var s=t.src||'';",
  "if(s.indexOf('/_next/static/')===-1)return;",
  "go();",
  "},!0);",
  "window.addEventListener('unhandledrejection',function(e){",
  "var x=e.reason,m=x&&(x.message||String(x));",
  "if(!m||!/ChunkLoadError|Loading chunk\\s+\\S+\\s+failed/i.test(String(m)))return;",
  "e.preventDefault();",
  "go();",
  "});",
  "})();",
].join("");
