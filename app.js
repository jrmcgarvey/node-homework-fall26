const express = require("express");

const app = express();
const rateLimiter = require("express-rate-limit");
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
const helmet = require("helmet");
app.use(helmet());

app.use(express.json());
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.set("trust proxy", 1);

const { xss } = require("express-xss-sanitizer");
app.use(xss());

// const timeRouter = require("./routes/timeRoutes");

// app.use("/api", timeRouter);

// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });

// app.post("/testpost", (req, res) => {
//   res.status(200).json({
//     message: "POST route works",
//   });
// });
// const pool = require("./db/pg-pool");
const prisma = require("./db/prisma");

// global.tasks = [];
// global.users = [];
// global.user_id = null;

// const authMiddleware = require("./middleware/auth");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const taskRouter = require("./routes/taskRoutes");
const anaRouter = require("./routes/analyticsRoutes");

// app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/tasks", jwtMiddleware, taskRouter);
app.use("/api/analytics", anaRouter);
const userRouter = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

app.use("/api/users", userRouter);
app.get("/health", async (_req, res) => {
  try {
    // await pool.query("SELECT 1");
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ message: `db not connected, error: ${err.message}` });
  }
});
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
    // await pool.end();
    // If you have DB connections, close them here
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
