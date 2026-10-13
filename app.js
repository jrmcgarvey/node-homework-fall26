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

global.tasks = []
global.users = []
global.user_id = null;

const userRouter = require('./routes/userRoutes')
const notFound = require('./middleware/not-found')
const errorHandler = require('./middleware/error-handler')

app.use('/api', userRouter)
app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };