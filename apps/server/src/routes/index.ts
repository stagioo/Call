import authRoutes from "@/routes/auth";
import emailRoutes from "@/routes/email";
import roomRoutes from "@/routes/room";
import { Hono } from "hono";
import contactsRoutes from "./contacts";

const router = new Hono();

router.route("/auth", authRoutes);
router.route("/email", emailRoutes);
router.route("/room", roomRoutes);
router.route("/contacts", contactsRoutes);
export default router;
