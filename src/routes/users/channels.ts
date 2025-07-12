import express from "express";
import { authenticateUser } from "../../middleware/tokenValidationMiddleware";
import {
  createChannel,
  updateBiography,
  deleteChannel,
  getChannel,
  addFollowChannel,
  deleteFollow,
  getFollowChannel,
} from "../../controller/users/channels";

export default (router: express.Router) => {
  router.post("/create-channel", authenticateUser, createChannel);
  router.put("/update-channel/:id", authenticateUser, updateBiography);
  router.delete("delete-channel/:id", authenticateUser, deleteChannel);
  router.get("/get-channel/:id", authenticateUser, getChannel);
  router.post("/follow-channel/:channelId", authenticateUser, addFollowChannel);
  router.get("/follow-channel/:id", authenticateUser, getFollowChannel);
  router.delete("/follow-channel/:id", authenticateUser, deleteFollow);
};
