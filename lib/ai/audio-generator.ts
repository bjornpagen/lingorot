import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { limit } from "@/lib/ai/common"
import { uploadFileToS3AndSave } from "@/lib/s3"
import { generateSpeech } from "@/lib/eleven-labs"

function extractSentences(content: string): string[] {
	const parts = content.split(". ")
	return parts
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => (!part.endsWith(".") ? `${part}.` : part))
}

export async function generateSectionAudio(
	sectionId: string,
	languageCode: (typeof schema.languageCode.enumValues)[number],
	cefrLevel: (typeof schema.cefrLevel.enumValues)[number]
): Promise<void> {
	console.log(
		`Generating audio for section ${sectionId} in ${languageCode} at ${cefrLevel} level`
	)

	const translation = await db
		.select({
			content: schema.bookSectionTranslation.content
		})
		.from(schema.bookSectionTranslation)
		.where(
			and(
				eq(schema.bookSectionTranslation.sectionId, sectionId),
				eq(schema.bookSectionTranslation.languageId, languageCode),
				eq(schema.bookSectionTranslation.cefrLevel, cefrLevel)
			)
		)
		.then((results) => results[0])

	if (!translation) {
		throw new Error(
			`No translation found for section ${sectionId} in ${languageCode} at ${cefrLevel} level`
		)
	}

	const sentences = extractSentences(translation.content)
	console.log(`Found ${sentences.length} sentences to process`)

	for (let i = 0; i < sentences.length; i++) {
		console.log(`Checking for existing audio at position ${i}...`)
		const existingAudio = await db
			.select()
			.from(schema.sectionAudio)
			.where(
				and(
					eq(schema.sectionAudio.bookSectionId, sectionId),
					eq(schema.sectionAudio.position, i)
				)
			)
			.then((results) => results[0])

		if (existingAudio) {
			console.log("✓ Audio already exists, skipping...")
			continue
		}

		const sentence = sentences[i]
		const previousSentenceText = i > 0 ? sentences[i - 1] : ""
		const nextSentenceText = i < sentences.length - 1 ? sentences[i + 1] : ""

		console.log(`Processing sentence ${i + 1}/${sentences.length}`)

		try {
			const { audioData, durationMs } = await limit(() =>
				generateSpeech(sentence, previousSentenceText, nextSentenceText)
			)

			const audioFile = new File([audioData], `audio-${i}.mp3`, {
				type: "audio/mpeg"
			})

			const fileId = await uploadFileToS3AndSave(db, audioFile)

			await db.insert(schema.sectionAudio).values({
				bookSectionId: sectionId,
				fileId,
				durationMs,
				position: i
			})

			console.log(
				`Generated and stored audio for sentence ${i + 1} (${durationMs}ms)`
			)
		} catch (error) {
			console.error(`Failed to generate audio for sentence ${i + 1}: ${error}`)
			throw error
		}
	}

	console.log("Audio generation complete")
}
