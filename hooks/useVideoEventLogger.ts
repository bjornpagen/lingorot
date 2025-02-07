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

const captureEvent = (eventType: string, payload?: unknown) => {
	console.log("[VideoEvent]", {
		eventType,
		payload,
		timestamp: new Date().toISOString()
	})
}

export const useVideoEventLogger = (
	player: VideoPlayer | null,
	videoId: string,
	isActive: boolean
) => {
	const timeUpdateThrottleRef = React.useRef<NodeJS.Timeout>()

	React.useEffect(() => {
		if (!player) {
			return
		}

		const handleStatusChange = (payload: StatusChangeEventPayload) => {
			captureEvent("statusChange", payload)
			if (payload.error) {
				captureEvent("error", payload.error)
			}
		}

		const handlePlayingChange = (payload: PlayingChangeEventPayload) => {
			captureEvent(payload.isPlaying ? "play" : "pause", payload)
		}

		const handlePlaybackRateChange = (
			payload: PlaybackRateChangeEventPayload
		) => {
			captureEvent("playbackRateChange", payload)
		}

		const handleVolumeChange = (payload: VolumeChangeEventPayload) => {
			captureEvent("volumeChange", payload)
		}

		const handleMutedChange = (payload: MutedChangeEventPayload) => {
			captureEvent("mutedChange", payload)
		}

		const handlePlayToEnd = () => {
			captureEvent("ended")
		}

		const handleTimeUpdate = (payload: TimeUpdateEventPayload) => {
			if (timeUpdateThrottleRef.current) {
				clearTimeout(timeUpdateThrottleRef.current)
			}

			timeUpdateThrottleRef.current = setTimeout(() => {
				captureEvent("timeUpdate", payload)
			}, 1000)
		}

		const handleSourceChange = (payload: SourceChangeEventPayload) => {
			captureEvent("sourceChange", payload)
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
			captureEvent("viewinit", { videoId })
		}

		return () => {
			if (isActive) {
				captureEvent("viewend", { videoId })
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
	}, [player, videoId, isActive])
}
