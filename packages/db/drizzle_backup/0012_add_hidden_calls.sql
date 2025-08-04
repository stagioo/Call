CREATE TABLE "hidden_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"user_id" text NOT NULL,
	"hidden_at" timestamp NOT NULL
);
ALTER TABLE "hidden_calls" ADD CONSTRAINT "hidden_calls_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "hidden_calls" ADD CONSTRAINT "hidden_calls_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "hidden_calls_call_id_idx" ON "hidden_calls" USING btree ("call_id");
CREATE INDEX "hidden_calls_user_id_idx" ON "hidden_calls" USING btree ("user_id");
CREATE UNIQUE INDEX "hidden_calls_call_user_unique_idx" ON "hidden_calls" USING btree ("call_id","user_id"); 