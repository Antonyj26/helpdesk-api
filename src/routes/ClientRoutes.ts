import { Router } from "express";
import { ClientController } from "@/controllers/ClientController";

const clientRoutes = Router();
const clientController = new ClientController();

clientRoutes.post("/", clientController.createClient);

export { clientRoutes };
