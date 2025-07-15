import express from "express";
import adminAuthentication from "./admin/authentication";
import userAuthentication from "./users/authentication";
import channels from "./users/channels";
import contact from "./users/contact";
import group from "./users/group";

const router = express.Router();

router.use("/group", group);
router.use("/contact", contact);
router.use("/channel", channels);
router.use("/adminAuthentication", adminAuthentication);
router.use("/userAuthentication", userAuthentication);

export default router;
