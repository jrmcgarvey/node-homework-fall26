const express = require("express");
const taskController = require("../controllers/taskController");
const router = express.Router();
//create, index, show, update, deleteTask
router.post("/", taskController.create);
router.get("/%id", taskController.show);
router.get("/", taskController.index);
router.patch("/%id", taskController.update);
router.delete("/%id", taskController.deleteTask);
module.exports = router;
