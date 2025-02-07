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
	PlayingChangeEventPayload
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

export async function logVideoEvent(
	params: { videoId: string } & VideoEvent
): Promise<void> {
	await logVideoEvents([params])
}

export async function logVideoEvents(
	events: Array<{ videoId: string } & VideoEvent>
): Promise<void> {
	const session = await getSession()
	if (!session) {
		throw new Error("Unauthorized")
	}
	const now = new Date()
	const inserts: VideoPlaybackEventInsert[] = []
	for (const event of events) {
		const base: Partial<VideoPlaybackEventInsert> = {
			sessionId: session.session.id,
			videoId: event.videoId,
			userId: session.user.id,
			eventType: event.eventType,
			eventTime: now,
			createdAt: now
		}
		switch (event.eventType) {
			case "timeUpdate": {
				const payload = event.payload
				base.playbackPosition = payload.currentTime
				base.bufferedPosition = payload.bufferedPosition
				base.currentLiveTimestamp = payload.currentLiveTimestamp
				base.currentOffsetFromLive = payload.currentOffsetFromLive
				break
			}
			case "statusChange": {
				const payload = event.payload
				base.status = payload.status
				base.oldStatus = payload.oldStatus
				break
			}
			case "error": {
				base.error = String(event.payload)
				break
			}
			case "playbackRateChange": {
				const payload = event.payload
				base.playbackRate = payload.playbackRate
				base.oldPlaybackRate = payload.oldPlaybackRate
				break
			}
			case "volumeChange": {
				const payload = event.payload
				base.volume = payload.volume
				base.oldVolume = payload.oldVolume
				break
			}
			case "mutedChange": {
				const payload = event.payload
				base.muted = payload.muted
				base.oldMuted = payload.oldMuted
				break
			}
			case "sourceChange": {
				continue
			}
		}
		inserts.push(base as VideoPlaybackEventInsert)
	}
	if (inserts.length) {
		await db.insert(schema.videoPlaybackEvent).values(inserts)
	}
}
