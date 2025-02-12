import { ElevenLabsClient } from "elevenlabs"
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { getAudioDurationInSeconds } from "get-audio-duration"
import pLimit from "p-limit"
import { buffer as streamBuffer } from "node:stream/consumers"

const ELEVEN_LABS_VOICE_ID = "9BWtsMINqrJLrRacOk9x"

if (!process.env.ELEVEN_LABS_API_KEY) {
	throw new Error("Missing ELEVEN_LABS_API_KEY environment variable")
}

const client = new ElevenLabsClient({
	apiKey: process.env.ELEVEN_LABS_API_KEY
})

export type TextToSpeechResult = {
	audioData: Buffer
	durationMs: number
}

const RATE_LIMIT = 2
const limit = pLimit(RATE_LIMIT)

export async function generateSpeech(
	text: string,
	previousText?: string,
	nextText?: string
): Promise<TextToSpeechResult> {
	return limit(async () => {
		console.log(
			`Starting speech generation for text: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`
		)

		try {
			console.time("speech_generation")
			const response = await client.textToSpeech.convert(ELEVEN_LABS_VOICE_ID, {
				text,
				model_id: "eleven_multilingual_v2",
				output_format: "mp3_44100_128",
				enable_logging: true,
				previous_text: previousText,
				next_text: nextText
			})
			console.timeEnd("speech_generation")

			console.time("buffer_processing")
			const audioBuffer = await streamBuffer(response)
			console.timeEnd("buffer_processing")

			const tempPath = join(tmpdir(), `temp-audio-${Date.now()}.mp3`)
			console.log(`Writing temporary file to: ${tempPath}`)

			try {
				await writeFile(tempPath, audioBuffer)
				console.time("duration_calculation")
				const duration = await getAudioDurationInSeconds(tempPath)
				const durationMs = Math.round(duration * 1000)
				console.timeEnd("duration_calculation")

				console.log(`Successfully generated speech. Duration: ${durationMs}ms`)
				return { audioData: audioBuffer, durationMs }
			} catch (error) {
				console.error("Error processing audio file:", error)
				throw new Error(
					`Failed to process audio file: ${error instanceof Error ? error.message : String(error)}`
				)
			}
		} catch (error) {
			console.error("Error generating speech:", error)
			throw new Error(
				`Speech generation failed: ${error instanceof Error ? error.message : String(error)}`
			)
		}
	})
}
