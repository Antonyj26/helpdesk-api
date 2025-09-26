import { SessionsController } from "@/controllers/SessionsController";
import { Router } from "express";

export const sessionRoute = Router();
const sessionsController = new SessionsController();

sessionRoute.post("/", sessionsController.create);
