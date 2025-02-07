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
import { logVideoEvent, type VideoEvent } from "@/functions/logVideoEvent"

export const useVideoEventLogger = (
	player: VideoPlayer | null,
	videoId: string,
	isActive: boolean
) => {
	const timeUpdateThrottleRef = React.useRef<ReturnType<typeof setTimeout>>()

	const captureEvent = React.useCallback(
		async (event: VideoEvent) => {
			try {
				await logVideoEvent({ videoId, ...event })
			} catch {}
		},
		[videoId]
	)

	React.useEffect(() => {
		if (!player) {
			return
		}

		const handleStatusChange = (payload: StatusChangeEventPayload) => {
			captureEvent({ eventType: "statusChange", payload })
			if (payload.error) {
				captureEvent({ eventType: "error", payload: payload.error })
			}
		}

		const handlePlayingChange = (payload: PlayingChangeEventPayload) => {
			captureEvent({ eventType: payload.isPlaying ? "play" : "pause", payload })
		}

		const handlePlaybackRateChange = (
			payload: PlaybackRateChangeEventPayload
		) => {
			captureEvent({ eventType: "playbackRateChange", payload })
		}

		const handleVolumeChange = (payload: VolumeChangeEventPayload) => {
			captureEvent({ eventType: "volumeChange", payload })
		}

		const handleMutedChange = (payload: MutedChangeEventPayload) => {
			captureEvent({ eventType: "mutedChange", payload })
		}

		const handlePlayToEnd = () => {
			captureEvent({ eventType: "ended" })
		}

		const handleTimeUpdate = (payload: TimeUpdateEventPayload) => {
			if (timeUpdateThrottleRef.current) {
				clearTimeout(timeUpdateThrottleRef.current)
			}
			timeUpdateThrottleRef.current = setTimeout(() => {
				captureEvent({ eventType: "timeUpdate", payload })
			}, 1000)
		}

		const handleSourceChange = (payload: SourceChangeEventPayload) => {
			captureEvent({ eventType: "sourceChange", payload })
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
			captureEvent({ eventType: "viewinit" })
		}

		return () => {
			if (isActive) {
				captureEvent({ eventType: "viewend" })
			}
			if (timeUpdateThrottleRef.current) {
				clearTimeout(timeUpdateThrottleRef.current)
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
	}, [player, isActive, captureEvent])
}
