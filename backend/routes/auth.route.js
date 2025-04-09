import express from "express";

import {
  login,
  signup,
  logout,
  getUserProfile,
  updateUser,
  getAllUser,
  refreshAccessToken,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../utils/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup); //ar
router.post("/login", login); //ar
router.post("/logout", logout); //ar
router.post("/refreshAccessToken", refreshAccessToken); //ar
router.get("/getUserProfile", authenticateUser, getUserProfile); //hjb
router.get("/getAllUser", authenticateUser, getAllUser); //ar
router.patch("/updateUser", authenticateUser, updateUser); //hjb

export default router;
