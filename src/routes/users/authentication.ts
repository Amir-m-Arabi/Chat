import express from "express";
import { authenticateUser } from "../../middleware/tokenValidationMiddleware";
import {
  signUp,
  signIn,
  updateUser,
  deleteUser,
  getUserById,
  forgetPassword,
  resetPassword,
  verifyCode,
} from "../../controller/users/authentication";

export default (router: express.Router) => {
  router.post("/signUp", signUp);
  router.post("/signIn", authenticateUser, signIn);
  router.put("/update-user", authenticateUser, updateUser);
  router.delete("/delete-user", authenticateUser, deleteUser);
  router.put("/get-user", authenticateUser, getUserById);
  router.post("/forget-password", authenticateUser, forgetPassword);
  router.post("/verifyCode", authenticateUser, verifyCode);
  router.put("/reset-password", authenticateUser, resetPassword);
};
