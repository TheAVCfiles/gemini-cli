import functions from 'firebase-functions';

const SHARED_TOKEN_ENV_KEY = 'MWRA_SHARED_TOKEN';

function getSharedToken() {
  const token = process.env[SHARED_TOKEN_ENV_KEY];
  if (!token) {
    functions.logger.warn('Shared token environment variable is not set.');
  }
  return token ?? '';
}

function isAuthorized(requestToken, configuredToken) {
  return configuredToken && requestToken && requestToken === configuredToken;
}

export const ask = functions.https.onRequest(async (req, res) => {
  const configuredToken = getSharedToken();
  const providedToken = req.get('x-shared-token') ?? req.query.token ?? req.body?.token;

  if (!isAuthorized(providedToken, configuredToken)) {
    res.status(401).json({ error: 'Unauthorized: invalid or missing shared token.' });
    return;
  }

  res.json({ message: 'Token verified. Replace this stub with the actual Gemini/OpenAI request.' });
});
