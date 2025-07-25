import axios from "axios";
import { logger } from "../utils/logger.js";
import { tokenStore, setTokens, getValidAccessToken } from "../services/ghlTokenService.js";
import dotenv from "dotenv";
dotenv.config();

export const GHL_OAUTH_CONFIG = {
  client_id: process.env.GHL_CLIENT_ID,
  client_secret: process.env.GHL_CLIENT_SECRET,
  redirect_uri: process.env.GHL_REDIRECT_URI,
  authorize_url: process.env.GHL_AUTHORIZE_URL,
  token_url: process.env.GHL_TOKEN_URL,
  scope: process.env.GHL_SCOPE,
};

// Step 1: Redirect user to GHL authorization page
export const ghlAuthRedirect = (req, res) => {
  const { client_id, redirect_uri, scope, authorize_url } = GHL_OAUTH_CONFIG;
  const url = `${authorize_url}?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}`;
  logger.info(`Redirecting to GHL OAuth: ${url}`);
  res.redirect(url);
};

// Step 2: Handle GHL OAuth callback
export const ghlAuthCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    logger.error("No code in GHL callback");
    return res.status(400).json({ error: "Missing code parameter" });
  }
  try {
    const { client_id, client_secret, redirect_uri, token_url } = GHL_OAUTH_CONFIG;
    const response = await axios.post(token_url, {
      grant_type: "authorization_code",
      code,
      client_id,
      client_secret,
    }, {
      headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
      }
  });
    const { access_token, refresh_token, expires_in, locationId } = response.data;
    // TODO: Extract locationId from response or request if available
    await setTokens({ locationId, access_token, refresh_token, expires_in });
    logger.info("GHL tokens stored successfully");
    res.status(200).json({ message: "OAuth successful. Tokens stored." });
  } catch (err) {
    logger.error(`OAuth callback error: ${err.message}`);
    res.status(500).json({ error: "OAuth callback failed" });
  }
};

// Example: Make an authenticated API request to GHL
export async function exampleGhlApiRequest(req, res) {
  try {
    const accessToken = await getValidAccessToken("default");
    // Example endpoint: Get user info (replace with actual GHL endpoint)
    const response = await axios.get("https://services.leadconnectorhq.com/v1/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    res.status(200).json(response.data);
  } catch (err) {
    logger.error(`GHL API request failed: ${err.message}`);
    res.status(500).json({ error: "GHL API request failed" });
  }
} 