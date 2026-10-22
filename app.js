const express = require("express");

const app = express();

app.use(express.json());

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
const pool = require("./db/pg-pool");

global.tasks = [];
global.users = [];
global.user_id = null;

const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");

app.use("/api/tasks", authMiddleware, taskRouter);
const userRouter = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

app.use("/api/users", userRouter);
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
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
    await pool.end();
    // If you have DB connections, close them here
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
