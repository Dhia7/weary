/** Max length for public/admin search `q` params (abuse / DoS guard). */
const MAX_SEARCH_Q_LENGTH = 200;

/**
 * Normalize and cap a search query string.
 * @param {unknown} q
 * @param {number} [maxLen]
 * @returns {{ ok: true, term: string } | { ok: false, message: string }}
 */
function normalizeSearchQuery(q, maxLen = MAX_SEARCH_Q_LENGTH) {
  if (q == null || q === '') {
    return { ok: true, term: '' };
  }
  const term = String(q).trim();
  if (term.length > maxLen) {
    return {
      ok: false,
      message: `Search query must be at most ${maxLen} characters`,
    };
  }
  return { ok: true, term };
}

module.exports = {
  MAX_SEARCH_Q_LENGTH,
  normalizeSearchQuery,
};
