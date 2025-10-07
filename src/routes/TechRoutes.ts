import { Router } from "express";
import { techController } from "@/controllers/TechController";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const techRoutes = Router();
const techContoller = new techController();

techRoutes.use(ensureAuthenticated);
techRoutes.use(verifyUserAuthorization(["tech"]));

techRoutes.patch("/profile", techContoller.update);
techRoutes.get("/", techContoller.show);
techRoutes.get("/ticket", techContoller.indexTickets);
techRoutes.patch("/ticket/services", techContoller.updateServiceInTicket);
techRoutes.patch("/ticket/:ticket_id/status", techContoller.updateTicket);

export { techRoutes };
