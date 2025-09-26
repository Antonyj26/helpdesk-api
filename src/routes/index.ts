import { Router } from "express";
import { sessionRoute } from "./SessionsRoute";
import { usersRoutes } from "./UsersRoutes";

export const route = Router();

route.use("/sessions", sessionRoute);
route.use("/users", usersRoutes);
