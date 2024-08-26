import { Router } from "express";
import { regsiterUser } from "../controllers/user.controller.js";

const router = Router()
router.route("/register").post(regsiterUser)
// router.route("/login").post(loginUser)

export default router