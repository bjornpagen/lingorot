ALTER TABLE "lingorot_video_playback_event" ADD COLUMN "viewer_time" timestamp;--> statement-breakpoint
ALTER TABLE "public"."lingorot_video_playback_event" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."playback_event_type";--> statement-breakpoint
CREATE TYPE "public"."playback_event_type" AS ENUM('playerready', 'viewinit', 'videochange', 'play', 'playing', 'pause', 'timeupdate', 'seeking', 'seeked', 'ended', 'viewend', 'error');--> statement-breakpoint
ALTER TABLE "public"."lingorot_video_playback_event" ALTER COLUMN "event_type" SET DATA TYPE "public"."playback_event_type" USING "event_type"::"public"."playback_event_type";