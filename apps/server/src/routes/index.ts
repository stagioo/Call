import { Hono } from "hono";
import type { ReqVariables } from "../index.js";
import authRoutes from "./auth/index.js";
import callsRoutes from "./calls/index.js";
import contactsRoutes from "./contacts/index.js";
import emailRoutes from "./email/index.js";
import notificationsRoutes from "./notifications/index.js";
import roomRoutes from "./room/index.js";
import teamsRoutes from "./teams/index.js";
import { getMediasoupWorker } from "../config/mediasoup.js";

const routes = new Hono<{ Variables: ReqVariables }>();

routes.route("/auth", authRoutes);
routes.route("/calls", callsRoutes);
routes.route("/contacts", contactsRoutes);
routes.route("/email", emailRoutes);
routes.route("/notifications", notificationsRoutes);
routes.route("/room", roomRoutes);
routes.route("/teams", teamsRoutes);

// Test endpoint to verify mediasoup is working
routes.get("/mediasoup-test", async (c) => {
  try {
    const worker = getMediasoupWorker();
    return c.json({ 
      success: true, 
      message: "Mediasoup worker is available",
      workerPid: worker.pid 
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      message: "Mediasoup worker not available",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Test endpoint to verify router creation
routes.get("/mediasoup-router-test/:callId", async (c) => {
  try {
    const callId = c.req.param("callId");
    if (!callId) {
      return c.json({ success: false, message: "Call ID is required" }, 400);
    }
    
    const { createRouterForCall } = await import("../config/mediasoup.js");
    const router = await createRouterForCall(callId);
    
    return c.json({ 
      success: true, 
      message: "Router created successfully",
      callId,
      routerId: router.id
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      message: "Failed to create router",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Test endpoint to verify router capabilities
routes.get("/mediasoup-capabilities-test/:callId", async (c) => {
  try {
    const callId = c.req.param("callId");
    if (!callId) {
      return c.json({ success: false, message: "Call ID is required" }, 400);
    }
    
    const { getRouter } = await import("../config/mediasoup.js");
    const router = getRouter(callId);
    
    if (!router) {
      return c.json({ 
        success: false, 
        message: "Router not found for this call ID" 
      }, 404);
    }
    
    return c.json({ 
      success: true, 
      message: "Router capabilities retrieved successfully",
      callId,
      routerId: router.id,
      rtpCapabilities: router.rtpCapabilities
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      message: "Failed to get router capabilities",
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default routes;
