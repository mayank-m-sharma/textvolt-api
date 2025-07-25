import { Router } from "express";
import { ghlAuthRedirect, ghlAuthCallback, exampleGhlApiRequest } from "../controllers/ghlAuthController.js";

const authRouter = Router();

authRouter.get("/ghl", ghlAuthRedirect);
authRouter.get("/callback", ghlAuthCallback);
authRouter.get("/ghl/example-api", exampleGhlApiRequest);

export default authRouter; 