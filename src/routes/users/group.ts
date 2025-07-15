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
  deleteMessageById,
  editMessage,
  searchInGroup,
  showBiography,
} from "../../controller/users/group";
import {
  fileUpload,
  musicUpload,
  profileUpload,
  videoUpload,
} from "../../helpers/uploadConfig";

const router = express.Router();

router.post(
  "/create-group",
  authenticateUser,
  profileUpload.single("file"),
  addGroup
);
router.post("/add-member", authenticateUser, addGroupMember);
router.post(
  "/add-message",
  authenticateUser,
  fileUpload.single("file"),
  videoUpload.single("file"),
  musicUpload.single("file"),
  profileUpload.single("file"),
  addMessage
);
router.put(
  "/edit-message",
  authenticateUser,
  fileUpload.single("file"),
  videoUpload.single("file"),
  musicUpload.single("file"),
  profileUpload.single("file"),
  editMessage
);
router.delete("/delete-member", authenticateUser, deleteMemberByAdmin);
router.delete("/delete-message", authenticateUser, deleteMessagesByAdmin);
router.delete("/delete-group/:id", authenticateUser, deleteGroup);
router.delete("/delete-member/:id", authenticateUser, deleteMemberById);
router.delete("delete-message", authenticateUser, deleteMessageById);
router.get("/messages/:groupId", authenticateUser, getAllMessage);
router.get("/biography/:groupId", authenticateUser, showBiography);
router.get("/search-message", authenticateUser, searchInGroup);

export default router;
