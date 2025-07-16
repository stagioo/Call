ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_contact_id_pk" PRIMARY KEY("user_id","contact_id");--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id");--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "team_members" DROP COLUMN "id";