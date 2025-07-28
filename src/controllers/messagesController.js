import { logger } from "../utils/logger.js";
import { 
  sendMessageToGhl,
  searchGhlContact, 
  createGhlContact, 
  getSubAccountByNumber, 
  syncMessageToGhl, 
  syncMessageToTextvolt,
  updateSegmentsSent
} from "../services/messageService.js";

export const handleGhlToTextvolt = (req, res) => {
  logger.info("Ghl-to-textvolt endpoint hit")
  logger.info("/messages/ghl-to-textvolt body:", req.body);
  res.status(200).json({ message: "Received at /messages/ghl-to-textvolt" });
};

export const handleTextvoltToGhl = async (req, res) => {
  logger.info("Textvolt-to-ghl endpoint hit")
  const { message, contactId, type } = req.body;
  const response = await sendMessageToGhl({ message, contactId, type });
  res.status(200).json({ message: "Received at /messages/textvolt-to-ghl", response });
}; 

export const handleWebhookViaTextvolt = async (req, res) => {
  logger.info(`Textvolt webhook hit ${req.body}`)
  const {text, type, event_type, to_number, from_number, direction, testDate} = req.body.payload;
  console.log(JSON.stringify(req.body));
  let numberToMapSubAccount = null;
  let numberToSyncMessage = null;

  const totalMessageSegments = Math.ceil(text.length / 160);
  console.log("TOTAL SEGMENTS ---->", totalMessageSegments)

  if (event_type === 'message.sent' && direction === 'outbound') {
    if (text.length > 1600) {
      return res.status(200).json({message: "Message too long"})
    }
    numberToMapSubAccount = from_number;
    numberToSyncMessage = to_number;
  } else if (event_type === 'message.received' && direction === 'inbound') {
    numberToMapSubAccount = to_number;
    numberToSyncMessage = from_number;
  } 
  const subAccountId = await getSubAccountByNumber({number: numberToMapSubAccount});
  if (event_type === 'message.sent') {
    await updateSegmentsSent({
      "locationId": subAccountId,
      "number": numberToMapSubAccount,
      "segmentSentForCurrentMessage": totalMessageSegments,
      testDate
    });
  }
  await syncMessageToGhl({
    message: text,
    type,
    contactNumber: numberToSyncMessage,
    subAccountId,
    direction
  })

  res.status(200).json({ message: "Received at /messages/webhook-via-textvolt" });
}

export const handleSearchGhlContact = async (req, res) => {
  logger.info(`Search GHL contact hit ${req.body}`)
  const { phone, locationId } = req.body;
  const response = await searchGhlContact({ phone, locationId });
  res.status(200).json({ message: "Received at /messages/search-ghl-contact", response });
}

export const handleCreateGhlContact = async (req, res) => {
  logger.info(`Create GHL contact api hit ${req.body}`)
  const {phone, locationId} = req.body;
  const response = await createGhlContact({ phone, locationId});
  res.status(200).json({ message: "Received at /messages/create-ghl-contact", response });
}

export const handleWebhookViaGhl = async (req, res) => {
  logger.info(`Webhook via GHL Hit ${JSON.stringify(req.body)}`)
  const { message, phone, contactId, locationId } = req.body;
  const totalMessageSegments = Math.ceil(message.length / 160);
  if (message.length > 1600) {
    return res.status(200).json({message: "Message too long"})
  }
  let response = {};
  if (message) {
    response = await syncMessageToTextvolt({ 
      message,
      toNumber: phone,
      fromNumber: "+12109647879", // TODO: replace this hardcoded fromNumber,
      contactId,
      locationId
     });
  }
  res.status(200).json({ message: "Received at /messages/webhook-via-ghl", response });
}