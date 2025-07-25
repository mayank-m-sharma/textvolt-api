import { Router } from "express";
import messagesRouter from "./messages.js";
import logsRouter from "./logsRouter.js";
import authRouter from "./auth.js";

const router = Router();

router.use("/messages", messagesRouter);
router.use("/logs", logsRouter);
router.use("/auth", authRouter);

export default router;