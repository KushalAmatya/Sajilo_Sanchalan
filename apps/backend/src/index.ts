import express from "express";
import helmet from "helmet";
import cors from "cors";
import { userRouter } from "./routes/user.routes";
import cookieParser from "cookie-parser";
import { runJobs } from "./cron/run-jobs";
import { AppRouter } from "./routes/app.routes";
import { rateLimiter } from "./middlewares/rate-limitter-middleware";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(rateLimiter);
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use("/", userRouter);
app.use("/", AppRouter);
runJobs();
app.listen(process.env.PORT, () => {
  console.log(`Server is running on the port ${process.env.PORT}`);
});
