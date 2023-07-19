const express = require("express");
const usersController = require("../controllers/users");
const router = express.Router();

router.get("/getUsers/:userId", usersController.getSingleUser);
router.post("/getUsersNames", usersController.getUsersNames);

module.exports = router;
