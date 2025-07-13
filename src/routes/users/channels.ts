import express from "express";
import { authenticateUser } from "../../middleware/tokenValidationMiddleware";
import {
  createChannel,
  addAdminToChannel,
  biographyEdited,
  deleteChannel,
  getChannel,
  addFollowChannel,
  deleteFollow,
  addContent,
  deleteContent,
  editContent,
  searchInChannel,
} from "../../controller/users/channels";

export default (router: express.Router) => {
  router.post("/create-channel", authenticateUser, createChannel);
  router.post("/add-admin", authenticateUser, addAdminToChannel);
  router.post("/add-content", authenticateUser, addContent);
  router.post("/follow-channel/:channelId", authenticateUser, addFollowChannel);
  router.put("/update-channel/:id", authenticateUser, biographyEdited);
  router.put("/edit-content", authenticateUser, editContent);
  router.delete("delete-channel/:id", authenticateUser, deleteChannel);
  router.delete("/follow-channel/:id", authenticateUser, deleteFollow);
  router.delete("/delete-content", authenticateUser, deleteContent);
  router.get("/get-channel/:id", authenticateUser, getChannel);
  router.get("/search-content", authenticateUser, searchInChannel);
};
