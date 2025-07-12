import express from "express";
import adminAuthentication from "./admin/authentication";
import userAuthentication from "./users/authentication";
import channels from "./users/channels";
import contact from "./users/contact";
import group from "./users/group";

const router = express.Router();

export default (): express.Router => {
  adminAuthentication(router);
  userAuthentication(router);
  channels(router);
  contact(router);
  group(router);
  return router;
};
