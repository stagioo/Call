import authRoutes from "@/routes/auth";
import emailRoutes from "@/routes/email";
import { Hono } from "hono";

const router = new Hono();

router.route("/auth", authRoutes);
router.route("/email", emailRoutes);

export default router;
