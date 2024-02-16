import { json, urlencoded } from "body-parser";
import express from "express";
import morgan from "morgan";
import cors from "cors";

const app = express();
app
  .disable("x-powered-by")
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(json())
  .use(cors());

export default app;
