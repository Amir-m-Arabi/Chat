import express from "express";
import { authenticateUser } from "../../middleware/tokenValidationMiddleware";
import {
  addGroup,
  addGroupMember,
  addMessage,
  deleteGroup,
  deleteMemberByAdmin,
  deleteMemberById,
  deleteMessagesByAdmin,
  getAllMessage,
  showBiography,
} from "../../controller/users/group";

export default (router: express.Router) => {
  router.post("/create-group", authenticateUser, addGroup);
  router.post("/add-member", authenticateUser, addGroupMember);
  router.post("/add-message", authenticateUser, addMessage);
  router.delete("/delete-member", authenticateUser, deleteMemberByAdmin);
  router.delete("/delete-message", authenticateUser, deleteMessagesByAdmin);
  router.delete("/delete-group/:id", authenticateUser, deleteGroup);
  router.delete("/delete-member/:id", authenticateUser, deleteMemberById);
  router.get("/messages/:groupId", authenticateUser, getAllMessage);
  router.get("/biography/:groupId", authenticateUser, showBiography);
};
