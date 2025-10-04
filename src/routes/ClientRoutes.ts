import { Router } from "express";
import { ClientController } from "@/controllers/ClientController";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const clientRoutes = Router();
const clientController = new ClientController();

clientRoutes.post("/", clientController.createClient);

clientRoutes.use(ensureAuthenticated);
clientRoutes.use(verifyUserAuthorization(["client"]));

clientRoutes.patch("/profile", clientController.updateClient);

export { clientRoutes };
