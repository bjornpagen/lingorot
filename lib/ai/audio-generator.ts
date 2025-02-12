import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { limit } from "@/lib/ai/common"
import { uploadFileToS3AndSave } from "@/lib/s3"
import { getAudioDurationInSeconds } from "get-audio-duration"
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY
const ELEVEN_LABS_VOICE_ID = process.env.ELEVEN_LABS_VOICE_ID

if (!ELEVEN_LABS_API_KEY) {
	throw new Error("Missing ELEVEN_LABS_API_KEY environment variable")
}

if (!ELEVEN_LABS_VOICE_ID) {
	throw new Error("Missing ELEVEN_LABS_VOICE_ID environment variable")
}

function extractSentences(content: string): string[] {
	const parts = content.split(". ")
	return parts
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => (!part.endsWith(".") ? part + "." : part))
}

async function generateAudioForSentence(
	sentence: string,
	previousText: string,
	nextText?: string
): Promise<{ audioData: Buffer; durationMs: number }> {
	const headers: HeadersInit = {
		"Content-Type": "application/json"
	}

	if (ELEVEN_LABS_API_KEY) {
		headers["xi-api-key"] = ELEVEN_LABS_API_KEY
	}

	const response = await fetch(
		`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`,
		{
			method: "POST",
			headers,
			body: JSON.stringify({
				text: sentence,
				model_id: "eleven_multilingual_v2",
				previous_text: previousText,
				next_text: nextText
			})
		}
	)

	if (!response.ok) {
		throw new Error(
			`Eleven Labs API error: ${response.status} ${response.statusText}`
		)
	}

	const audioBuffer = Buffer.from(await response.arrayBuffer())
	const tempPath = join(tmpdir(), `temp-audio-${Date.now()}.mp3`)
	await writeFile(tempPath, audioBuffer)
	const duration = await getAudioDurationInSeconds(tempPath)
	const durationMs = Math.round(duration * 1000)

	return { audioData: audioBuffer, durationMs }
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
		.select()
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
		const sentence = sentences[i]
		const previousSentenceText = i > 0 ? sentences[i - 1] : ""
		const nextSentenceText = i < sentences.length - 1 ? sentences[i + 1] : ""

		console.log(`Processing sentence ${i + 1}/${sentences.length}`)

		try {
			const { audioData, durationMs } = await limit(() =>
				generateAudioForSentence(
					sentence,
					previousSentenceText,
					nextSentenceText
				)
			)

			const audioFile = new File([audioData], `audio-${i}.mp3`, {
				type: "audio/mpeg"
			})

			const fileId = await uploadFileToS3AndSave(db, audioFile)

			await db.insert(schema.sectionAudio).values({
				bookSectionId: sectionId,
				fileId,
				durationMs
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
