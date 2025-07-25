import { Router } from "express";
import { 
    handleGhlToTextvolt, 
    handleTextvoltToGhl, 
    handleWebhookViaTextvolt, 
    handleSearchGhlContact, 
    handleCreateGhlContact, 
    handleWebhookViaGhl 
} from "../controllers/messagesController.js";

const messagesRouter = Router();

messagesRouter.post("/ghl-to-textvolt", handleGhlToTextvolt);
messagesRouter.post("/textvolt-to-ghl", handleTextvoltToGhl);
messagesRouter.post("/webhook-via-textvolt",handleWebhookViaTextvolt )
messagesRouter.post("/webhook-via-ghl", handleWebhookViaGhl);
messagesRouter.post("/search-ghl-contact", handleSearchGhlContact)
messagesRouter.post("/create-ghl-contact", handleCreateGhlContact);
export default messagesRouter; 