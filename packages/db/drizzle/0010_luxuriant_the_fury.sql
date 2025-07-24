ALTER TABLE "notifications" DROP CONSTRAINT "notifications_contact_request_id_contact_requests_id_fk";
--> statement-breakpoint
DROP INDEX "contact_requests_status_idx";--> statement-breakpoint
ALTER TABLE "contact_requests" DROP COLUMN "note";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "contact_request_id";