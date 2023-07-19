const express = require("express");
const router = express.Router();

const adminController = require("../controllers/Admin/admin");

router.get("/", adminController.getUsers);
router.get("/admin", adminController.getAdmin);
router.delete("/delete", adminController.deleteUser);
router.put("/block", adminController.blockUsers);
router.put("/unblock", adminController.unblockUsers);

module.exports = router;
