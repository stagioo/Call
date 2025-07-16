import { Hono } from "hono";
import { z } from "zod";
import { db } from "@call/db";
import { teams, teamMembers, user as userTable } from "@call/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { eq, inArray } from "drizzle-orm";
import type { ReqVariables } from "../../index";

const teamsRoutes = new Hono<{ Variables: ReqVariables }>();

// Zod schema for team creation
const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  members: z.array(z.string().email("Invalid email format")).min(1, "At least one member is required"),
});

// POST /api/teams/create - Create a new team
teamsRoutes.post("/create", async (c) => {
  // Get authenticated user
  const user = c.get("user");
  if (!user || !user.id) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  let body;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ message: "Invalid JSON body" }, 400);
  }
  // Validate input
  const result = createTeamSchema.safeParse(body);
  if (!result.success) {
    return c.json({ message: result.error.errors[0]?.message || "Invalid input" }, 400);
  }
  const { name, members } = result.data;

  // Find users by email
  const users = await db.select().from(userTable).where(inArray(userTable.email, members));
  if (users.length !== members.length) {
    // Find which emails are missing
    const foundEmails = users.map(u => u.email);
    const missing = members.filter(email => !foundEmails.includes(email));
    return c.json({ message: `Email(s) not registered: ${missing.join(", ")}` }, 400);
  }

  // Create team
  const teamId = createId();
  await db.insert(teams).values({
    id: teamId,
    name,
    creatorId: user.id,
    createdAt: new Date(),
  });

  // Add creator and members to team_members
  const memberIds = users.map(u => u.id);
  // Ensure creator is also a member
  if (!memberIds.includes(user.id)) {
    memberIds.push(user.id);
  }
  const teamMemberRows = memberIds.map(uid => ({
    teamId,
    userId: uid,
    createdAt: new Date(),
  }));
  await db.insert(teamMembers).values(teamMemberRows);

  return c.json({ message: "Team created" });
});

// GET /api/teams - List teams for authenticated user
teamsRoutes.get("/", async (c) => {
  const user = c.get("user");
  if (!user || !user.id) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  // Find all teams where user is a member
  const userTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id));
  const teamIds = userTeams.map(t => t.teamId);
  if (teamIds.length === 0) {
    return c.json({ teams: [] });
  }
  // Get team info
  const teamsList = await db
    .select({ id: teams.id, name: teams.name, creatorId: teams.creatorId })
    .from(teams)
    .where(inArray(teams.id, teamIds));
  // For each team, get members
  const allTeamMembers = await db
    .select({ teamId: teamMembers.teamId, userId: teamMembers.userId, name: userTable.name, email: userTable.email })
    .from(teamMembers)
    .leftJoin(userTable, eq(teamMembers.userId, userTable.id))
    .where(inArray(teamMembers.teamId, teamIds));
  // Group members by team
  const teamMembersMap: Record<string, Array<{ user_id: string; name: string; email: string }>> = {};
  for (const m of allTeamMembers) {
    if (!m.teamId || !m.userId) continue; // skip if missing
    if (!teamMembersMap[m.teamId]) teamMembersMap[m.teamId] = [];
    teamMembersMap[m.teamId]!.push({
      user_id: m.userId,
      name: m.name ?? "",
      email: m.email ?? ""
    });
  }
  // Build response
  const response = teamsList.map(team => ({
    id: team.id,
    name: team.name,
    creator_id: team.creatorId,
    members: teamMembersMap?.[team.id] || [],
  }));
  return c.json({ teams: response });
});

export default teamsRoutes; 