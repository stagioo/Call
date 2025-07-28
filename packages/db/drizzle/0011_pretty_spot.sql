CREATE TYPE "public"."call_join_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "call_join_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"status" "call_join_request_status" NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "call_participants" ADD COLUMN "left_at" timestamp;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "contact_request_id" text;--> statement-breakpoint
ALTER TABLE "call_join_requests" ADD CONSTRAINT "call_join_requests_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_join_requests" ADD CONSTRAINT "call_join_requests_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "call_join_requests_call_id_idx" ON "call_join_requests" USING btree ("call_id");--> statement-breakpoint
CREATE INDEX "call_join_requests_requester_id_idx" ON "call_join_requests" USING btree ("requester_id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_contact_request_id_contact_requests_id_fk" FOREIGN KEY ("contact_request_id") REFERENCES "public"."contact_requests"("id") ON DELETE set null ON UPDATE no action;