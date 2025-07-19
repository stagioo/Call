import authRoutes from "./auth/index.js";
import emailRoutes from "./email/index.js";
import roomRoutes from "./room/index.js";
import { Hono } from "hono";
import contactsRoutes from "./contacts/index.js";
import teamsRoutes from "./teams/index.js";
import callsRoutes from "./calls/index.js";
import notificationsRoutes from "./notifications/index.js";
const router = new Hono();

router.route("/auth", authRoutes);
router.route("/email", emailRoutes);
router.route("/room", roomRoutes);
router.route("/contacts", contactsRoutes);
router.route("/teams", teamsRoutes);
router.route("/calls", callsRoutes);
router.route("/notifications", notificationsRoutes);
export default router;
