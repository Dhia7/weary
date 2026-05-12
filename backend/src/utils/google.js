const { OAuth2Client } = require('google-auth-library');

let client;

function getClient() {
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
}

/**
 * Verifies a Google ID token (credential) from the GIS popup.
 * @param {string} credential - JWT from Google
 * @returns {Promise<import('google-auth-library').TokenPayload>}
 */
async function verifyGoogleIdToken(credential) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }
  const ticket = await getClient().verifyIdToken({
    idToken: credential,
    audience,
  });
  return ticket.getPayload();
}

module.exports = { verifyGoogleIdToken };
