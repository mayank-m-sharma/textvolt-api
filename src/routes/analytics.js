import { Router } from "express";
import { segmentsSentHandler } from "../controllers/analyticsController.js";

const analyticsRouter = Router();

analyticsRouter.get("/get-segments-sent", segmentsSentHandler);

export default analyticsRouter; 