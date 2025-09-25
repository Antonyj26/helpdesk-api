import express, { json } from "express";
import { errorHandling } from "./middlewares/errorHandling";

const app = express();
app.use(express.json());
app.use(errorHandling);

export { app };
