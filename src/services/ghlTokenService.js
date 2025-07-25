//TODO: Rename this file to TokenService.js as it can serve as a common util file for managing both GHL as well as Textvolt Tokens

import axios from "axios";
import { logger } from "../utils/logger.js";
import { docClient } from "../utils/dynamodbconfig.js";

// In-memory token store (for demo; replace with DB in production)
export const tokenStore = {};

// Helper function to get credential_id from locationId
async function getCredentialIdByLocation(locationId) {
  try {
    const params = {
      TableName: 'numbers',
      Key: {
        locationId: locationId
      }
    };
    
    const result = await docClient.get(params).promise();
    if (!result.Item) {
      throw new Error(`No credential found for locationId: ${locationId}`);
    }
    
    return result.Item.credential_id;
  } catch (error) {
    logger.error(`Error getting credential_id for locationId ${locationId}: ${error.message}`);
    throw new Error(`Unable to get credential_id for locationId: ${locationId}`);
  }
}

// TODO:  This function does not return a valid data, as it we need to make numbers as partition key
async function getCredentialIdByNumber(number) {
  try {
    const params = {
      TableName: 'numbers',
      Key: {
        numbers: number
      }
    };
    
    const result = await docClient.get(params).promise();
    if (!result.Item) {
      throw new Error(`No credential found for number: ${number}`);
    }
    
    return result.Item.credential_id;
  } catch (error) {
    logger.error(`Error getting credential_id for number ${number}: ${error.message}`);
    throw new Error(`Unable to get credential_id for number: ${number}`);
  }
}

// Helper function to get GHL tokens from credentials table
async function getGhlTokens(credentialId) {
  try {
    const params = {
      TableName: 'credentials',
      Key: {
        credential_id: credentialId
      }
    };
    
    const result = await docClient.get(params).promise();
    if (!result.Item || !result.Item.ghl) {
      throw new Error(`No GHL tokens found for credential_id: ${credentialId}`);
    }
    
    return result.Item.ghl;
  } catch (error) {
    logger.error(`Error getting GHL tokens for credential_id ${credentialId}: ${error.message}`);
    throw new Error(`Unable to get GHL tokens for credential_id: ${credentialId}`);
  }
}

// Helper function to update GHL tokens in credentials table
async function updateGhlTokens(credentialId, tokens) {
  try {
    const params = {
      TableName: 'credentials',
      Key: {
        credential_id: credentialId
      },
      UpdateExpression: 'SET ghl = :ghl',
      ExpressionAttributeValues: {
        ':ghl': tokens
      }
    };
    
    await docClient.update(params).promise();
    logger.info(`GHL tokens updated for credential_id: ${credentialId}`);
  } catch (error) {
    logger.error(`Error updating GHL tokens for credential_id ${credentialId}: ${error.message}`);
    throw new Error(`Unable to update GHL tokens for credential_id: ${credentialId}`);
  }
}

// TODO: Rename this to SetGhlToken
export async function setTokens({ locationId, access_token, refresh_token, expires_in }) {
  try {
    const credentialId = await getCredentialIdByLocation(locationId);
    
    const tokens = {
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000 - 60000, // 1 min early
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await updateGhlTokens(credentialId, tokens);
    logger.info(`Tokens set successfully for locationId: ${locationId}`);
  } catch (error) {
    logger.error(`Error setting tokens for locationId ${locationId}: ${error.message}`);
    throw error;
  }
}

// TODO: Rename this function to getValidGhlAccessToken
export async function getValidAccessToken(locationId) {
  try {
    const credentialId = await getCredentialIdByLocation(locationId);
    const tokens = await getGhlTokens(credentialId);
    
    if (
      tokens &&
      tokens.access_token &&
      tokens.expires_at &&
      Date.now() < tokens.expires_at
    ) {
      return tokens.access_token;
    }
    
    // Refresh token
    try {
      const { GHL_OAUTH_CONFIG } = await import("../controllers/ghlAuthController.js");
      const { client_id, client_secret, token_url } = GHL_OAUTH_CONFIG;
      
      if (!tokens || !tokens.refresh_token) {
        throw new Error(`No refresh token found for locationId: ${locationId}`);
      }
      
      const response = await axios.post(token_url, {
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
        client_id,
        client_secret,
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      await setTokens({ locationId, access_token, refresh_token, expires_in });
      logger.info(`Access token refreshed for locationId: ${locationId}`);
      return access_token;
    } catch (err) {
      logger.error(`Token refresh failed for locationId ${locationId}: ${err.message}`);
      throw new Error(`Unable to refresh access token for locationId: ${locationId}`);
    }
  } catch (error) {
    logger.error(`Error getting valid access token for locationId ${locationId}: ${error.message}`);
    throw error;
  }
} 

export const getValidTextvoltAccessToken = async (textvoltNumber) => {
  return "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3OTQxNTc5MTcsImlhdCI6MTc1MDk1NzkxNywicGVyIjoiO3JlYWQ6bWVzc2FnZXM7d3JpdGU6bWVzc2FnZXM7cmVhZDp3YXZlczt3cml0ZTp3YXZlcztyZWFkOmNvbnRhY3RzO3dyaXRlOmNvbnRhY3RzIiwib3JnIjoxOTg4N30.wp3c95BLhvalE7-Zzl5rCFwHG6Fl6QsUAjSJUIOM1cQ"
  const credentialId = await getCredentialIdByNumber(textvoltNumber);
  try {
    const params = {
      TableName: 'credentials',
      Key: {
        credential_id: credentialId
      }
    };
    const result = await docClient.get(params).promise();
    if (!result.Item || !result.Item.textVolt.access_token) {
      throw new Error(`No textvolt tokens found for credential_id: ${credentialId}`);
    }
    
    return result.Item.textVolt.access_token;
  } catch (error) {
    logger.error(`Error getting valid textvolt access token for number ${textvoltNumber}: ${error.message}`);
    throw error;
  }
} 