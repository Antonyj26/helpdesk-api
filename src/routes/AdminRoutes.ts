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
adminRoutes.patch("/tech/:tech_id", adminController.updateTech);
adminRoutes.post("/service", adminController.createService);
adminRoutes.get("/service", adminController.indexServices);
adminRoutes.patch("/service/:service_id", adminController.updateService);
adminRoutes.get("/client", adminController.clientIndex);
adminRoutes.patch("/client/:client_id", adminController.updateClient);
adminRoutes.post("/tech/availability", adminController.createTechAvailability);
export { adminRoutes };
