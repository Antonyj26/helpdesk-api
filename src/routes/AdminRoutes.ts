import { Router } from "express";
import { AdminController } from "@/controllers/AdminController";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const adminRoutes = Router();
const adminController = new AdminController();
adminRoutes.use(ensureAuthenticated);
adminRoutes.use(verifyUserAuthorization(["admin"]));

adminRoutes.post("/tech", adminController.createTech);
adminRoutes.get("/tech", adminController.indexTechs);
adminRoutes.delete("/tech/delete/:tech_id", adminController.deleteTech);
adminRoutes.patch("/tech/:tech_id", adminController.updateTech);
adminRoutes.post("/service", adminController.createService);
adminRoutes.get("/service", adminController.indexServices);
adminRoutes.patch("/service/:service_id", adminController.updateService);
adminRoutes.delete(
  "/service/delete/:service_id",
  adminController.deleteService
);
adminRoutes.get("/client", adminController.clientIndex);
adminRoutes.patch("/client/:client_id", adminController.updateClient);
adminRoutes.delete("/user/delete/:client_id", adminController.deleteClient);
adminRoutes.post("/tech/availability", adminController.createTechAvailability);
adminRoutes.get("/ticket", adminController.indexTickets);
adminRoutes.get("/ticket/:ticket_id", adminController.showTicket);
adminRoutes.patch("/ticket/:ticket_id/status", adminController.updateTicket);
adminRoutes.delete("/ticket/:ticket_id", adminController.deleteTicket);
export { adminRoutes };
