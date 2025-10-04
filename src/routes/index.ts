import { Router } from "express";
import { sessionRoute } from "./SessionsRoute";
import { clientRoutes } from "./ClientRoutes";
import { adminRoutes } from "./AdminRoutes";
import { techRoutes } from "./TechRoutes";

export const route = Router();

route.use("/sessions", sessionRoute);
route.use("/client", clientRoutes);
route.use("/admin", adminRoutes);
route.use("/tech", techRoutes);
