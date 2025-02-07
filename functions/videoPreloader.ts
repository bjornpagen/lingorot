"use server"

import { asc } from "drizzle-orm"
import { eq } from "drizzle-orm"
import * as schema from "@/db/schema"
import { db } from "@/db"
import { getSession } from "@/lib/session"

export type PaginatedVideo = {
	id: string
	title: string
	description: string
	url: string
	thumbnail: string
}

export async function getPaginatedVideos(
	page: number,
	pageSize: number,
	languageId: string
): Promise<PaginatedVideo[]> {
	const session = await getSession()
	if (!session) {
		throw new Error("Unauthorized")
	}

	return await db
		.select({
			id: schema.video.id,
			title: schema.video.title,
			description: schema.video.description,
			url: schema.video.url,
			thumbnail: schema.video.thumbnail
		})
		.from(schema.video)
		.where(eq(schema.video.languageId, languageId))
		.orderBy(asc(schema.video.createdAt), asc(schema.video.id))
		.limit(pageSize)
		.offset((page - 1) * pageSize)
}
