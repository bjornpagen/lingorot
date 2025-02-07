"use server"

import * as schema from "@/db/schema"
import { db } from "@/db"
import { getSession } from "@/lib/session"
import type {
	TimeUpdateEventPayload,
	StatusChangeEventPayload,
	PlaybackRateChangeEventPayload,
	VolumeChangeEventPayload,
	MutedChangeEventPayload,
	SourceChangeEventPayload,
	PlayingChangeEventPayload,
	VideoSource
} from "expo-video"

export type VideoPlaybackEventInsert =
	typeof schema.videoPlaybackEvent.$inferInsert

export type VideoEvent =
	| { eventType: "viewinit" }
	| { eventType: "viewend" }
	| { eventType: "play"; payload: PlayingChangeEventPayload }
	| { eventType: "pause"; payload: PlayingChangeEventPayload }
	| { eventType: "timeUpdate"; payload: TimeUpdateEventPayload }
	| { eventType: "statusChange"; payload: StatusChangeEventPayload }
	| { eventType: "error"; payload: unknown }
	| { eventType: "playbackRateChange"; payload: PlaybackRateChangeEventPayload }
	| { eventType: "volumeChange"; payload: VolumeChangeEventPayload }
	| { eventType: "mutedChange"; payload: MutedChangeEventPayload }
	| { eventType: "sourceChange"; payload: SourceChangeEventPayload }
	| { eventType: "ended" }

function serializeVideoSource(source: VideoSource | undefined): string | null {
	if (source == null) {
		return null
	}
	if (typeof source === "string") {
		return source
	}
	if (typeof source === "number") {
		return String(source)
	}
	return source.uri ?? null
}

export async function logVideoEvent(
	params: { videoId: string } & VideoEvent
): Promise<void> {
	const session = await getSession()
	if (!session) {
		throw new Error("Unauthorized")
	}

	const now = new Date()
	const base: Partial<VideoPlaybackEventInsert> = {
		sessionId: session.session.id,
		videoId: params.videoId,
		userId: session.user.id,
		eventType: params.eventType,
		eventTime: now,
		createdAt: now
	}

	switch (params.eventType) {
		case "timeUpdate": {
			const payload = params.payload
			base.playbackPosition = payload.currentTime
			base.bufferedPosition = payload.bufferedPosition
			base.currentLiveTimestamp = payload.currentLiveTimestamp
			base.currentOffsetFromLive = payload.currentOffsetFromLive
			break
		}
		case "statusChange": {
			const payload = params.payload
			base.status = payload.status
			base.oldStatus = payload.oldStatus
			// Do not set base.error here so that it remains null.
			break
		}
		case "error": {
			base.error = String(params.payload)
			break
		}
		case "playbackRateChange": {
			const payload = params.payload
			base.playbackRate = payload.playbackRate
			base.oldPlaybackRate = payload.oldPlaybackRate
			break
		}
		case "volumeChange": {
			const payload = params.payload
			base.volume = payload.volume
			base.oldVolume = payload.oldVolume
			break
		}
		case "mutedChange": {
			const payload = params.payload
			base.muted = payload.muted
			base.oldMuted = payload.oldMuted
			break
		}
		case "sourceChange": {
			const payload = params.payload
			const serialized = serializeVideoSource(payload.source)
			if (!serialized) {
				throw new Error("Invalid video source for sourceChange event")
			}
			base.source = serialized
			base.oldSource = serializeVideoSource(payload.oldSource)
			break
		}
	}

	await db
		.insert(schema.videoPlaybackEvent)
		.values(base as VideoPlaybackEventInsert)
}
