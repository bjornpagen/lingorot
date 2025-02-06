CREATE TYPE "public"."chat_role" AS ENUM('user', 'ai');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."expiry_type" AS ENUM('claims', 'date');--> statement-breakpoint
CREATE TABLE "lingorot_account" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"user_id" char(24) NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" date,
	"refresh_token_expires_at" date,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_challenge" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"points" integer NOT NULL,
	"expiry_type" "expiry_type" NOT NULL,
	"expiry" timestamp,
	"max_claims" integer,
	"current_claims" integer DEFAULT 0 NOT NULL,
	"progress_total" integer NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	CONSTRAINT "check_expiry_constraint" CHECK ((
				("lingorot_challenge"."expiry_type" = 'claims' AND "lingorot_challenge"."max_claims" IS NOT NULL AND "lingorot_challenge"."expiry" IS NULL) OR
				("lingorot_challenge"."expiry_type" = 'date' AND "lingorot_challenge"."expiry" IS NOT NULL AND "lingorot_challenge"."max_claims" IS NULL)
			))
);
--> statement-breakpoint
CREATE TABLE "lingorot_challenge_peer" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"challenge_id" char(24) NOT NULL,
	"peer_id" text NOT NULL,
	"name" text NOT NULL,
	"progress" integer NOT NULL,
	"avatar_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_chat_message" (
	"video_id" char(24) NOT NULL,
	"user_id" char(24) NOT NULL,
	"role" "chat_role" NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "lingorot_chat_message_video_id_user_id_pk" PRIMARY KEY("video_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "lingorot_interest" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_language" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	CONSTRAINT "lingorot_language_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lingorot_session" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"user_id" char(24) NOT NULL,
	"token" text NOT NULL,
	"expires_at" date NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_sub_interest" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"interest_id" char(24) NOT NULL,
	"name" text NOT NULL,
	"selected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_user" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"challenges_completed" integer DEFAULT 0 NOT NULL,
	"words_learned" integer DEFAULT 0 NOT NULL,
	"minutes_watched" integer DEFAULT 0 NOT NULL,
	"days_streak" integer DEFAULT 0 NOT NULL,
	"current_language_id" char(24)
);
--> statement-breakpoint
CREATE TABLE "lingorot_user_challenge" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"user_id" char(24) NOT NULL,
	"challenge_id" char(24) NOT NULL,
	"progress_total" integer NOT NULL,
	"progress_current" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_user_challenge_word" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"user_challenge_id" char(24) NOT NULL,
	"word" text NOT NULL,
	"date_discovered" timestamp NOT NULL,
	"date_last_seen" timestamp
);
--> statement-breakpoint
CREATE TABLE "lingorot_user_interest" (
	"created_at" timestamp NOT NULL,
	"user_id" char(24) NOT NULL,
	"sub_interest_id" char(24) NOT NULL,
	CONSTRAINT "lingorot_user_interest_user_id_sub_interest_id_pk" PRIMARY KEY("user_id","sub_interest_id")
);
--> statement-breakpoint
CREATE TABLE "lingorot_user_language_level" (
	"created_at" timestamp NOT NULL,
	"user_id" char(24) NOT NULL,
	"language_id" char(24) NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"level" integer GENERATED ALWAYS AS (FLOOR(SQRT(stars / 10.0) + 1)::integer) STORED NOT NULL,
	CONSTRAINT "lingorot_user_language_level_user_id_language_id_pk" PRIMARY KEY("user_id","language_id")
);
--> statement-breakpoint
CREATE TABLE "lingorot_verification" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" date NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_video" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"mux_asset_id" text NOT NULL,
	"mux_playback_id" text NOT NULL,
	"mux_transcript" text,
	"language_id" char(24) NOT NULL,
	"thumbnail" text GENERATED ALWAYS AS ('https://image.mux.com/' || mux_playback_id || '/thumbnail.png') STORED NOT NULL,
	"url" text GENERATED ALWAYS AS ('https://stream.mux.com/' || mux_playback_id || '.m3u8') STORED NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lingorot_video_word" (
	"id" char(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp NOT NULL,
	"video_id" char(24) NOT NULL,
	"word" text NOT NULL,
	"time_offset" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lingorot_account" ADD CONSTRAINT "lingorot_account_user_id_lingorot_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lingorot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_challenge_peer" ADD CONSTRAINT "lingorot_challenge_peer_challenge_id_lingorot_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."lingorot_challenge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_chat_message" ADD CONSTRAINT "lingorot_chat_message_video_id_lingorot_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."lingorot_video"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_chat_message" ADD CONSTRAINT "lingorot_chat_message_user_id_lingorot_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lingorot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_session" ADD CONSTRAINT "lingorot_session_user_id_lingorot_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lingorot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_sub_interest" ADD CONSTRAINT "lingorot_sub_interest_interest_id_lingorot_interest_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."lingorot_interest"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user" ADD CONSTRAINT "lingorot_user_current_language_id_lingorot_language_id_fk" FOREIGN KEY ("current_language_id") REFERENCES "public"."lingorot_language"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_challenge" ADD CONSTRAINT "lingorot_user_challenge_user_id_lingorot_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lingorot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_challenge" ADD CONSTRAINT "lingorot_user_challenge_challenge_id_lingorot_challenge_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."lingorot_challenge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_challenge_word" ADD CONSTRAINT "lingorot_user_challenge_word_user_challenge_id_lingorot_user_challenge_id_fk" FOREIGN KEY ("user_challenge_id") REFERENCES "public"."lingorot_user_challenge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_interest" ADD CONSTRAINT "lingorot_user_interest_user_id_lingorot_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lingorot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_interest" ADD CONSTRAINT "lingorot_user_interest_sub_interest_id_lingorot_sub_interest_id_fk" FOREIGN KEY ("sub_interest_id") REFERENCES "public"."lingorot_sub_interest"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_language_level" ADD CONSTRAINT "lingorot_user_language_level_user_id_lingorot_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."lingorot_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_user_language_level" ADD CONSTRAINT "lingorot_user_language_level_language_id_lingorot_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."lingorot_language"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_video" ADD CONSTRAINT "lingorot_video_language_id_lingorot_language_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."lingorot_language"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lingorot_video_word" ADD CONSTRAINT "lingorot_video_word_video_id_lingorot_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."lingorot_video"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenges_title_idx" ON "lingorot_challenge" USING btree ("title");--> statement-breakpoint
CREATE INDEX "challenge_peers_challenge_id_idx" ON "lingorot_challenge_peer" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "interests_name_idx" ON "lingorot_interest" USING btree ("name");--> statement-breakpoint
CREATE INDEX "languages_code_idx" ON "lingorot_language" USING btree ("code");--> statement-breakpoint
CREATE INDEX "sub_interests_interest_id_idx" ON "lingorot_sub_interest" USING btree ("interest_id");--> statement-breakpoint
CREATE INDEX "user_challenges_user_id_idx" ON "lingorot_user_challenge" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_challenges_challenge_id_idx" ON "lingorot_user_challenge" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "user_challenge_word_user_challenge_id_idx" ON "lingorot_user_challenge_word" USING btree ("user_challenge_id");--> statement-breakpoint
CREATE INDEX "user_interests_user_id_idx" ON "lingorot_user_interest" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_language_levels_user_id_idx" ON "lingorot_user_language_level" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "videos_title_idx" ON "lingorot_video" USING btree ("title");--> statement-breakpoint
CREATE INDEX "videos_language_id_idx" ON "lingorot_video" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX "video_word_video_id_idx" ON "lingorot_video_word" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_word_time_offset_idx" ON "lingorot_video_word" USING btree ("time_offset");