const express = require("express");
const anaController = require("../controllers/analyticsController");
const router = express.Router();

router.get("/users", anaController.getUsersWithStats);
router.get("/users/:id", anaController.getUserAnalytics);
router.get("/tasks/search", anaController.searchTasks);
module.exports = router;
