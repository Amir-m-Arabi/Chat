import express from "express";
import { authenticateUser } from "../../middleware/tokenValidationMiddleware";
import {
  startContact,
  secrchByUsername,
  getAllChatInContact,
  deleteChat,
  deleteContact,
} from "../../controller/users/contact";


export default(router : express.Router)=>{
    router.post("/search-by-username" , authenticateUser , secrchByUsername)
    router.post("/start-contact" , authenticateUser , startContact)
    router.delete("/delete-contact/:chatId" , authenticateUser , deleteContact)
    router.delete("/delete-chat/:id" , authenticateUser , deleteChat)
    router.get("/get-all-chat/:chatId" , authenticateUser , getAllChatInContact)
}
