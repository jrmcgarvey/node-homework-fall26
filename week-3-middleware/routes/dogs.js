const express = require("express");
const dogs = require("../dogData");

const router = express.Router();

router.get("/dogs", (_req, res) => {
  res.status(200).json(dogs);
});

router.post("/adopt", (req, res) => {
  const { name, address, email, dogName } = req.body;

  res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
    application: {
      name,
      address,
      email,
      dogName,
      applicationId: Date.now(),
    },
  });
});

router.get("/error", (_req, _res, next) => {
  next(new Error("Test error"));
});

module.exports = router;

