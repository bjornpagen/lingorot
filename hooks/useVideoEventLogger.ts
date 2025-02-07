"use client"

import * as React from "react"
import type { VideoPlayer } from "expo-video"
import type {
	StatusChangeEventPayload,
	PlayingChangeEventPayload,
	PlaybackRateChangeEventPayload,
	VolumeChangeEventPayload,
	MutedChangeEventPayload,
	TimeUpdateEventPayload,
	SourceChangeEventPayload
} from "expo-video"
import { logVideoEvents, type VideoEvent } from "@/functions/logVideoEvent"

export const useVideoEventLogger = (
	player: VideoPlayer | null,
	videoId: string,
	isActive: boolean
) => {
	const batchQueueRef = React.useRef<
		Array<{ videoId: string } & VideoEvent & { eventTimestamp: Date }>
	>([])

	const flushBatch = React.useCallback(() => {
		if (batchQueueRef.current.length > 0) {
			const eventsToFlush = batchQueueRef.current.slice()
			batchQueueRef.current.length = 0
			void logVideoEvents(eventsToFlush).catch(() => {})
		}
	}, [])

	React.useEffect(() => {
		if (!isActive) {
			flushBatch()
		}
	}, [isActive, flushBatch])

	React.useEffect(() => {
		return () => {
			flushBatch()
		}
	}, [flushBatch])

	const addEventToBatch = React.useCallback(
		(event: VideoEvent) => {
			const eventWithTimestamp = { ...event, eventTimestamp: new Date() }
			if (event.eventType === "timeUpdate") {
				const queue = batchQueueRef.current
				if (
					queue.length &&
					queue[queue.length - 1].eventType === "timeUpdate"
				) {
					queue[queue.length - 1] = { videoId, ...eventWithTimestamp }
				} else {
					batchQueueRef.current.push({ videoId, ...eventWithTimestamp })
				}
			} else {
				batchQueueRef.current.push({ videoId, ...eventWithTimestamp })
			}
		},
		[videoId]
	)

	React.useEffect(() => {
		if (!player) {
			return
		}
		const handleStatusChange = (payload: StatusChangeEventPayload) => {
			addEventToBatch({ eventType: "statusChange", payload })
			if (payload.error) {
				addEventToBatch({ eventType: "error", payload: payload.error })
			}
		}
		const handlePlayingChange = (payload: PlayingChangeEventPayload) => {
			addEventToBatch({
				eventType: payload.isPlaying ? "play" : "pause",
				payload
			})
		}
		const handlePlaybackRateChange = (
			payload: PlaybackRateChangeEventPayload
		) => {
			addEventToBatch({ eventType: "playbackRateChange", payload })
		}
		const handleVolumeChange = (payload: VolumeChangeEventPayload) => {
			addEventToBatch({ eventType: "volumeChange", payload })
		}
		const handleMutedChange = (payload: MutedChangeEventPayload) => {
			addEventToBatch({ eventType: "mutedChange", payload })
		}
		const handlePlayToEnd = () => {
			addEventToBatch({ eventType: "ended" })
		}
		const handleTimeUpdate = (payload: TimeUpdateEventPayload) => {
			addEventToBatch({ eventType: "timeUpdate", payload })
		}
		const handleSourceChange = (payload: SourceChangeEventPayload) => {
			addEventToBatch({ eventType: "sourceChange", payload })
		}
		player.addListener("statusChange", handleStatusChange)
		player.addListener("playingChange", handlePlayingChange)
		player.addListener("playbackRateChange", handlePlaybackRateChange)
		player.addListener("volumeChange", handleVolumeChange)
		player.addListener("mutedChange", handleMutedChange)
		player.addListener("playToEnd", handlePlayToEnd)
		player.addListener("timeUpdate", handleTimeUpdate)
		player.addListener("sourceChange", handleSourceChange)
		if (isActive) {
			addEventToBatch({ eventType: "viewinit" })
		}
		return () => {
			if (isActive) {
				addEventToBatch({ eventType: "viewend" })
			}
			player.removeListener("statusChange", handleStatusChange)
			player.removeListener("playingChange", handlePlayingChange)
			player.removeListener("playbackRateChange", handlePlaybackRateChange)
			player.removeListener("volumeChange", handleVolumeChange)
			player.removeListener("mutedChange", handleMutedChange)
			player.removeListener("playToEnd", handlePlayToEnd)
			player.removeListener("timeUpdate", handleTimeUpdate)
			player.removeListener("sourceChange", handleSourceChange)
		}
	}, [player, isActive, addEventToBatch])
}
