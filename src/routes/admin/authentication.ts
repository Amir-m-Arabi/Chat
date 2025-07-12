import express from "express";
import {
  signUp,
  signIn,
  signOut,
  updateAdmin,
  getAdmin,
  getAdmins,
} from "../../controller/admin/authentication";

import { authenticateAdmin } from "../../middleware/tokenValidationMiddleware";

export default (router: express.Router) => {
  router.post("/signUp", signUp);
  router.post("/signIn", authenticateAdmin, signIn);
  router.delete("/signOut", authenticateAdmin, signOut);
  router.put("/update", authenticateAdmin, updateAdmin);
  router.get("/get-admin", authenticateAdmin, getAdmin);
  router.get("/get-admins", authenticateAdmin, getAdmins);
};
