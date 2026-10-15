const express = require("express");
const dogsRouter = require("./routes/dogs");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.


app.use(express.json())

const { randomUUID } = require("crypto");

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, _res, next) => {
  const logString = `[${new Date().toString()}]: ${req.method} ${req.path} (${req.requestId})` 
  console.log(logString)
  next()
})
app.use(express.static('./week-3-middleware/public'))

app.use("/", dogsRouter);// Do not remove this line

app.use((req, res, next) => {
    res.status(404).json({
  "error": "Route not found",
  "requestId": req.requestId,
})
})

app.use((err, req, res, next) => {
    res.status(500).json({
  "error": "Internal Server Error",
  "requestId": req.requestId,
})
    console.error("A server error occurred: ", err)
})


if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

