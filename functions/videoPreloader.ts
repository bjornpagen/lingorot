"use server"

import { asc, eq } from "drizzle-orm"
import * as schema from "@/db/schema"
import { db } from "@/db"
import { getSession } from "@/lib/session"

export type PaginatedVideo = {
	id: string
	url: string
	thumbnail: string
	transcript: string | null
	bookSectionId: string
	cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
}

export async function getPaginatedVideos(
	page: number,
	pageSize: number,
	languageId: (typeof schema.languageCode.enumValues)[number]
): Promise<PaginatedVideo[]> {
	const session = await getSession()
	if (!session) {
		return []
	}

	const videos = await db
		.select({
			id: schema.video.id,
			playbackId: schema.video.muxPlaybackId,
			transcript: schema.video.muxTranscript,
			bookSectionId: schema.video.bookSectionId,
			languageId: schema.video.languageId,
			cefrLevel: schema.video.cefrLevel
		})
		.from(schema.video)
		.where(eq(schema.video.languageId, languageId))
		.orderBy(asc(schema.video.createdAt), asc(schema.video.id))
		.limit(pageSize)
		.offset((page - 1) * pageSize)

	return videos.map((video) => ({
		...video,
		url: `https://stream.mux.com/${video.playbackId}.m3u8?default_subtitles_lang=${languageId}`,
		thumbnail: `https://image.mux.com/${video.playbackId}/animated.webp`
	}))
}
