const serverError = async (err, _req, res, next) => {
  //   if (err.code === "ECONNREFUSED" && err.port === 5432) { // the postgresql port
  //   console.log("The database connection was refused.  Is your database service running?");
  // }
  if (err.name === "PrismaClientInitializationError") {
    console.error("Couldn't connect to the database. Is it running?");
  }
  res.status(500).json({ message: "A server error occurred" });
  console.error("A server error occurred: ", err);
};

module.exports = serverError;
