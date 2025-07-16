import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '@call/db';
import { calls, callInvitations, notifications, user } from '@call/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { initMediasoup, createRouterForCall } from '../../config/mediasoup';
import { auth } from '@call/auth/auth';
const callsRoutes = new Hono();

const createCallSchema = z.object({
  name: z.string().min(1),
  members: z.array(z.string().email()).min(1),
});

function generateCallCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

callsRoutes.post('/create', async (c) => {
  const body = await c.req.json();
  const parse = createCallSchema.safeParse(body);
  if (!parse.success) {
    return c.json({ error: 'Invalid input' }, 400);
  }
  const { name, members } = parse.data;


  const session = await auth.handler(c.req.raw);
  const authUser = (session as any)?.user;
  if (!authUser || !authUser.id) {
    return c.json({ error: 'Unauthorized' }, 401);
  }


  const users = await db.select().from(user).where(inArray(user.email, members));
  const emailToUserId = new Map(users.map(u => [u.email, u.id]));


  let callId;
  let exists = true;
  while (exists) {
    callId = generateCallCode();
    const found = await db.select().from(calls).where(eq(calls.id, callId));
    exists = found.length > 0;
  }


  await db.insert(calls).values({
    id: callId as string,
    name,
    creatorId: authUser.id as string,
    createdAt: new Date(),
  });


  for (const email of members) {
    const inviteeId = emailToUserId.get(email);

    const invitationData: any = {
      id: crypto.randomUUID(),
      callId,
      inviteeEmail: email,
      status: 'pending',
      createdAt: new Date(),
    };
    if (inviteeId) invitationData.inviteeId = inviteeId;
    await db.insert(callInvitations).values(invitationData);


    if (inviteeId) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: inviteeId,
        message: `${authUser.name || authUser.email} te invita a una llamada: ${name}`,
        callId,
        createdAt: new Date(),
      });
    }
  }

  
  await initMediasoup();
  await createRouterForCall(callId!);

  return c.json({ callId });
});


callsRoutes.patch('/invitations/:id/accept', async (c) => {
  
  const invitationId = c.req.param('id');
  if (!invitationId) return c.json({ error: 'Missing invitation id' }, 400);

 
  const [invitation] = await db
    .select()
    .from(callInvitations)
    .where(eq(callInvitations.id, invitationId));
  if (!invitation) return c.json({ error: 'Invitation not found' }, 404);
  if (invitation.status !== 'pending') return c.json({ error: 'Already handled' }, 400);

  
  await db
    .update(callInvitations)
    .set({ status: 'accepted' })
    .where(eq(callInvitations.id, invitationId));

  
  return c.json({ callId: invitation.callId });
});


callsRoutes.patch('/invitations/:id/reject', async (c) => {
  const invitationId = c.req.param('id');
  if (!invitationId) return c.json({ error: 'Missing invitation id' }, 400);

 
  const [invitation] = await db
    .select()
    .from(callInvitations)
    .where(eq(callInvitations.id, invitationId));
  if (!invitation) return c.json({ error: 'Invitation not found' }, 404);
  if (invitation.status !== 'pending') return c.json({ error: 'Already handled' }, 400);


  await db
    .update(callInvitations)
    .set({ status: 'rejected' })
    .where(eq(callInvitations.id, invitationId));

  return c.json({ message: 'Invitation rejected' });
});

export default callsRoutes; 