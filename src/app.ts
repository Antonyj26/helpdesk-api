import express from "express";
import { errorHandling } from "@/middlewares/errorHandling";
import { route } from "@/routes";

const app = express();
app.use(express.json());
app.use(route);
app.use(errorHandling);

export { app };
