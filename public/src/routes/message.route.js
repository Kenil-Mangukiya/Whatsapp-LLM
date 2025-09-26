import { Router } from "express";
import { webhook } from "../controllers/message.controller.js";

const router = Router();

router.post("/message", webhook);

export default router;