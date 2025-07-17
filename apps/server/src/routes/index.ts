import authRoutes from "@/routes/auth";
import emailRoutes from "@/routes/email";
import roomRoutes from "@/routes/room";
import { Hono } from "hono";
import contactsRoutes from "./contacts";
import teamsRoutes from "./teams";
import callsRoutes from "./calls";
import notificationsRoutes from "./notifications";
const router = new Hono();

router.route("/auth", authRoutes);
router.route("/email", emailRoutes);
router.route("/room", roomRoutes);
router.route("/contacts", contactsRoutes);
router.route("/teams", teamsRoutes);
router.route("/calls", callsRoutes);
router.route("/notifications", notificationsRoutes);
export default router;
