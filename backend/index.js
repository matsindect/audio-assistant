import dotenv  from "dotenv";
dotenv.config({ path: "./.env" });
import express  from "express";
import morgan  from "morgan";
import ratelimit  from "express-rate-limit";
import helmet  from "helmet";
import bodyParser  from "body-parser";
import xss  from "xss-clean";
import hpp  from "hpp";
const { port } = process.env;

import './utils/appError.js';
const server = express();
import serverRouter  from './routes/index.js';
// http security
server.use(helmet());
if (process.env.NNODE_ENV === "development") {
  server.use(morgan("dev"));
}
// Middleware to parse JSON
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
//limit number of api request to 100
const limiter = ratelimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "You have exceeded the number of request, Try in an hour",
});
server.use("/api", limiter);

//Data sanitization
server.use(xss());

// Prevent parameter polution
server.use(hpp());

//ROUTES;
server.use("/api/v1/", serverRouter);

server.all('*', (req, res, next) => {
    next(new AppError(`Cannot Find ${req.originalUrl} on this server`, 404));
});

// Start server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
