import "dotenv/config"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { getPresignedUrl } from "@/lib/s3"
import { createMuxAsset } from "@/lib/mux"
import { eq } from "drizzle-orm"

const GUTENBERG_ID = 84
const LANGUAGE_CODE = "es" as const
const CEFR_LEVEL = "A1" as const
const FILE_ID = "nm3v3sn0rkudvmmbgotx57o5"

async function addVideo() {
	const bookId = await db
		.insert(schema.book)
		.values({
			gutenbergId: GUTENBERG_ID,
			title: "Test Book",
			author: "Test Author",
			languageId: LANGUAGE_CODE
		})
		.onConflictDoNothing({ target: schema.book.gutenbergId })
		.returning({ id: schema.book.id })
		.then(
			(results) =>
				results[0]?.id ||
				db
					.select({ id: schema.book.id })
					.from(schema.book)
					.where(eq(schema.book.gutenbergId, GUTENBERG_ID))
					.then((results) => results[0].id)
		)

	const sectionId = await db
		.insert(schema.bookSection)
		.values({
			bookId,
			name: "Chapter 1",
			position: 1,
			content: "Test content"
		})
		.onConflictDoUpdate({
			target: [schema.bookSection.bookId, schema.bookSection.position],
			set: {
				name: "Chapter 1",
				content: "Test content"
			}
		})
		.returning({ id: schema.bookSection.id })
		.then((results) => results[0].id)

	await db
		.insert(schema.bookSectionTranslation)
		.values({
			sectionId,
			languageId: LANGUAGE_CODE,
			cefrLevel: CEFR_LEVEL,
			content: "Test translation"
		})
		.onConflictDoUpdate({
			target: [
				schema.bookSectionTranslation.sectionId,
				schema.bookSectionTranslation.languageId,
				schema.bookSectionTranslation.cefrLevel
			],
			set: {
				content: "Test translation"
			}
		})

	const s3Url = await getPresignedUrl(FILE_ID)
	const { assetId, playbackId } = await createMuxAsset(s3Url, LANGUAGE_CODE)

	await db
		.insert(schema.video)
		.values({
			bookSectionId: sectionId,
			languageId: LANGUAGE_CODE,
			cefrLevel: CEFR_LEVEL,
			fileId: FILE_ID,
			muxAssetId: assetId,
			muxPlaybackId: playbackId
		})
		.onConflictDoUpdate({
			target: [
				schema.video.bookSectionId,
				schema.video.languageId,
				schema.video.cefrLevel
			],
			set: {
				muxAssetId: assetId,
				muxPlaybackId: playbackId
			}
		})

	console.log("✅ Video and related data added successfully")
}

addVideo()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error:", error)
		process.exit(1)
	})
