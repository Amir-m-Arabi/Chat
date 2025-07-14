import express from "express";
import { authenticateUser } from "../../middleware/tokenValidationMiddleware";
import {
  startContact,
  secrchByUsername,
  getAllChatInContact,
  deleteChat,
  deleteContact,
  editMessage,
  sendMessage,
  searchInChannel,
} from "../../controller/users/contact";
import {
  musicUpload,
  profileUpload,
  videoUpload,
} from "../../helpers/uploadConfig";

export default (router: express.Router) => {
  router.post("/search-by-username", authenticateUser, secrchByUsername);
  router.post(
    "/start-contact",
    authenticateUser,
    musicUpload.single("file"),
    profileUpload.single("file"),
    videoUpload.single("file"),
    startContact
  );
  router.post(
    "/send-message",
    authenticateUser,
    musicUpload.single("file"),
    profileUpload.single("file"),
    videoUpload.single("file"),
    sendMessage
  );
  router.put(
    "/edit-message",
    authenticateUser,
    musicUpload.single("file"),
    profileUpload.single("file"),
    videoUpload.single("file"),
    editMessage
  );
  router.delete("/delete-contact/:chatId", authenticateUser, deleteContact);
  router.delete("/delete-chat/:id", authenticateUser, deleteChat);
  router.get("/get-all-chat/:chatId", authenticateUser, getAllChatInContact);
  router.get("/search-message", authenticateUser, searchInChannel);
};
