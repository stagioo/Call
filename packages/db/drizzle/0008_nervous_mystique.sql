ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_call_id_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_contact_request_id_contact_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_contact_request_id_contact_requests_id_fk" FOREIGN KEY ("contact_request_id") REFERENCES "public"."contact_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_requests_status_idx" ON "contact_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");