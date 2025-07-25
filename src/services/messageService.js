import axios from "axios";
import { logger } from "../utils/logger.js";
import { getValidAccessToken, getValidTextvoltAccessToken } from "./ghlTokenService.js";
import { docClient } from "../utils/dynamodbconfig.js";

export const sendMessageToGhl = async ({ message, contactId, type, locationId, fromNumber, toNumber }) => {
    const accessToken = await getValidAccessToken(locationId);
    try {
        const API_URL = "https://services.leadconnectorhq.com/conversations/messages";
        const response = await axios.post(API_URL, {
            message: message,
            contactId: contactId,
            type: type

        }, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Version": "2021-04-15"
            }
        });
        return response.data;
    } catch (error) {
        logger.error(`Error sending message to GHL: ${error}`);
        throw error;
    }
}

export const handleWebhookViaTextvolt = async (req, res) => {
    logger.info(`Textvolt webhook hit ${req.body}`)
    const { text, type } = req.body.payload;
    const contactId = "PSg6ClYOs4VoJutZfnwF";
    console.log(JSON.stringify(req.body));
    await sendMessageToGhl({ message: text, contactId, type });
    res.status(200).json({ message: "Received at /messages/webhook-via-textvolt" });
}

function formatPhoneNumber(phone) {
    // If already in +1XXXXXXXXXX format, return as is
    if (/^\+1\d{10}$/.test(phone)) {
        return phone;
    }
    const digits = phone?.replace(/\D/g, '');
    return `+1${digits}`;
}

export const searchGhlContact = async ({ phone, locationId }) => {
    const formattedPhone = formatPhoneNumber(phone);
    const token = await getValidAccessToken(locationId);
    try {
        const response = await axios.post(
            'https://services.leadconnectorhq.com/contacts/search',
            {
                page: 1,
                pageLimit: 1,
                locationId,
                filters: [
                    {
                        field: 'phone',
                        operator: 'eq',
                        value: formattedPhone,
                    },
                ],
            },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Version: '2021-07-28',
                },
            }
        );
        const contactDetails = response.data.contacts[0];
        return contactDetails;
    } catch (error) {
        console.error('Error searching GHL contact:', error.response?.data || error.message);
        throw error;
    }
}

export const createGhlContact = async ({ phone, locationId }) => {
    const formattedPhone = formatPhoneNumber(phone);
    const token = await getValidAccessToken(locationId);
    try {
        const response = await axios.post(
            'https://services.leadconnectorhq.com/contacts/',
            {
                locationId,
                phone: formattedPhone,
            },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Version: '2021-07-28',
                },
            }
        );

        return response.data.contact;
    } catch (error) {
        console.error('Error creating GHL contact:', error.response?.data || error.message);
        throw error;
    }
}



export const getSubAccountByNumber = async ({ number }) => {
    return "ysJeaNivwASZjyKd59tf"; // TODO: complete the implementatoin of this function 
}

export const updateSegmentsSent = async ({
    locationId, 
    number, 
    segmentSentForCurrentMessage
}) => {
    try {
        const getParams = {
            TableName: "analytics",
            Key: {
                number: number
            }
        };

        const record = await docClient.get(getParams).promise();

        if (record.Item) {
            const updateParams = {
                TableName: "analytics",
                Key: {
                    number: number
                },
                UpdateExpression: "SET segments_sent = if_not_exists(segments_sent, :zero) + :inc, location_id = :locId",
                ExpressionAttributeValues: {
                    ":inc": segmentSentForCurrentMessage,
                    ":zero": 0,
                    ":locId": locationId
                }
            };
            await docClient.update(updateParams).promise();
        } else {
            const putParams = {
                TableName: "analytics",
                Item: {
                    number: number,
                    location_id: locationId,
                    segments_sent: segmentSentForCurrentMessage,
                }
            };
            await docClient.put(putParams).promise();
        }
    } catch (error) {
        console.error(`Error updating segments sent for: number - ${number}`, error.response?.data || error.message);
        throw error;
    }
}

export const getConversation = async ({ contactId, locationId }) => {
    const token = await getValidAccessToken(locationId);
    const API_BASE_URL = `https://services.leadconnectorhq.com/conversations/search?contactId=${contactId}&locationId=${locationId}`;
    try {
        const response = await axios.get(API_BASE_URL,
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Version: '2021-07-28',
                },
            }
        );
        return response.data.conversations;
    } catch (error) {
        console.error('Error searching for conversation:', error.response?.data || error.message);
        throw error;
    }
}

export const createConversation = async ({ contactId, locationId }) => {
    const API_BASE_URL = "https://services.leadconnectorhq.com/conversations/";
    const token = await getValidAccessToken(locationId);
    try {
        const response = await axios.post(API_BASE_URL,
            {
                locationId,
                contactId,
            },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Version: '2021-07-28',
                },
            }
        );

        return response.data.conversation;
    } catch (error) {
        console.error('Error creating GHL Conversation:', error.response?.data || error.message);
        throw error;
    }
}

export const createGhlMessage = async ({ conversationId, message, direction, locationId }) => {
    const API_BASE_URL = "https://services.leadconnectorhq.com/conversations/messages/inbound";
    const token = await getValidAccessToken(locationId);
    try {
        const response = await axios.post(API_BASE_URL,
            {
                conversationId,
                message,
                direction,
                type: "SMS"
            },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Version: '2021-07-28',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating message in GHL', error.response?.data || error.message);
        throw error;
    }

}


export const syncMessageToGhl = async ({ message, type, contactNumber, subAccountId, direction }) => {
    let contactId = null;
    try {
        // 1. Find contactId as before
        const contactDetails = await searchGhlContact({ phone: contactNumber, locationId: subAccountId });
        if (contactDetails) {
            contactId = contactDetails.id;
        } else {
            const newlyCreatedContact = await createGhlContact({ phone: contactNumber, locationId: subAccountId });
            contactId = newlyCreatedContact.id;
        }

        // 2. Check for duplicate message in DynamoDB
        try {
            const getParams = {
                TableName: "conversations",
                Key: {
                    contact_id: contactId
                }
            };
            const record = await docClient.get(getParams).promise();
            if (record.Item && Array.isArray(record.Item.conversation)) {
                const now = new Date();
                const twoMinutesAgo = new Date(now.getTime() - 1000);
                const duplicate = record.Item.conversation.find(entry => {
                    if (entry.body !== message) return false;
                    if (entry.direction !== "outbound_from_ghl_to_textvolt") return false;
                    if (!entry.dateAdded) return false;
                    // Accept both ISO and non-ISO date strings
                    const entryDate = new Date(entry.dateAdded);
                    return entryDate >= twoMinutesAgo && entryDate <= now;
                });
                if (duplicate) {
                    // Duplicate found, skip processing
                    return;
                }
            }
        } catch (dbCheckError) {
            logger.error(`Error checking for duplicate in DynamoDB: ${dbCheckError}`);
            // Continue processing if check fails
        }

        // 3. Proceed with the rest of the function as before
        let conversationId = null;
        const conversationDetails = await getConversation({
            contactId,
            locationId: subAccountId
        });
        if (conversationDetails.length > 0) {
            conversationId = conversationDetails[0].id;
        } else {
            const newlyCreatedConversation = await createConversation({
                contactId,
                locationId: subAccountId
            });
            conversationId = newlyCreatedConversation.id;
        }
        await createGhlMessage({
            conversationId,
            message,
            direction,
            locationId: subAccountId
        });

        // 4. Save the new message to DynamoDB
        try {
            const newConversationEntry = {
                body: message,
                dateAdded: new Date().toISOString(),
                direction: direction
            };
            const getParams = {
                TableName: "conversations",
                Key: {
                    contact_id: contactId
                }
            };
            const record = await docClient.get(getParams).promise();
            if (record.Item) {
                // Update existing record
                const updateParams = {
                    TableName: "conversations",
                    Key: {
                        contact_id: contactId
                    },
                    UpdateExpression: "SET conversation = list_append(conversation, :newEntry)",
                    ExpressionAttributeValues: {
                        ":newEntry": [newConversationEntry]
                    }
                };
                await docClient.update(updateParams).promise();
            } else {
                // Create new record
                const putParams = {
                    TableName: "conversations",
                    Item: {
                        contact_id: contactId,
                        conversation: [newConversationEntry],
                        location_id: subAccountId
                    }
                };
                await docClient.put(putParams).promise();
            }
            logger.info(`Conversation saved to DynamoDB for contactId: ${contactId}`);
        } catch (dbSaveError) {
            logger.error(`Error saving conversation to DynamoDB: ${dbSaveError}`);
        }
    } catch (error) {
        console.error('Error syncing message to GHL:', error.response?.data || error.message);
        throw error;
    }
}

export const syncMessageToTextvolt = async ({ 
    message, 
    toNumber, 
    fromNumber, 
    contactId, 
    locationId 
}) => {
    
    const API_BASE_URL = "https://api.respondflow.com/graphql";
    const token = await getValidTextvoltAccessToken(fromNumber);
    
    // Save conversation to DynamoDB
    try {
        // First, try to get existing conversation record
        const getParams = {
            TableName: "conversations",
            Key: {
                contact_id: contactId
            }
        };
        
        const existingRecord = await docClient.get(getParams).promise();
        
        const newConversationEntry = {
            body: message,
            dateAdded: new Date().toISOString(),
            direction: "outbound_from_ghl_to_textvolt"
        };
        
        let updateParams;
        
        if (existingRecord.Item) {
            // Update existing record by appending to conversation array
            const updateParams = {
                TableName: "conversations",
                Key: {
                    contact_id: contactId
                },
                UpdateExpression: "SET conversation = list_append(conversation, :newEntry)",
                ExpressionAttributeValues: {
                    ":newEntry": [newConversationEntry]
                }
            };
            await docClient.update(updateParams).promise();
        } else {
            // Create new record
            const putParams = {
                TableName: "conversations",
                Item: {
                    contact_id: contactId,
                    conversation: [newConversationEntry],
                    location_id: locationId
                }
            };
            await docClient.put(putParams).promise();
        }
        logger.info(`Conversation saved to DynamoDB for contactId: ${contactId}`);
    } catch (dbError) {
        logger.error(`Error saving conversation to DynamoDB: ${dbError}`);
        // Continue with the main function even if DB save fails
    }
    
    try {
        const response = await axios.post(API_BASE_URL,
            {
                "query": "mutation CreateMessage($to: String!, $from: String!, $body: String!) { createMessage(to: $to, from: $from, body: $body) { id toNumber fromNumber status media body sentAt } }",
                "variables": {
                    "from": fromNumber,
                    "to":  toNumber,
                    "body": message
                }
            },
            {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating message in Textvolt', error.response?.data || error.message);
        throw error;
    }

}