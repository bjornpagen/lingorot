import { z } from "zod"
import { zodResponseFormat } from "openai/helpers/zod"
import { uploadFrameToS3AndSave } from "@/lib/s3"
import { db } from "@/db"
import { generateImage, type GeneratedImage } from "@/lib/replicate"
import { openai, limit } from "@/lib/ai/common"

type SentenceData = {
	text: string
	displayPercentage: number
}

type SceneDescription = {
	text: string
	description: string
	displayPercentage: number
}

const SceneResponseSchema = z.object({
	description: z.string()
})

const systemPrompt = `You are a visual description expert who creates vivid, cinematic scene descriptions. Here are examples of excellent character-focused descriptions:

EXAMPLE 1:
Text: "Sarah walked into her sun-filled kitchen and began preparing breakfast."
Description: "A modern kitchen awash in morning sunlight. Sarah, a woman in her early 30s with shoulder-length brown hair and a cream sweater, moves purposefully at the marble countertop. Sunbeams stream through large windows, illuminating her gentle expression and the steam from a copper coffee maker. The scene, captured at eye level, frames her among white cabinets and stainless appliances, with a bowl of bright citrus fruits adding warmth to the composition."

EXAMPLE 2:
Text: "Professor Chen wrote the equation on the whiteboard while students took notes."
Description: "A bright university classroom viewed from the back corner. Professor Chen, distinguished in his 50s wearing a navy blazer and wire-rimmed glasses, writes on the whiteboard with confident gestures. Natural light from tall windows catches his salt-and-pepper hair and the chalk dust in the air. Rows of students sit at modern desks in the foreground, their faces illuminated by both laptops and afternoon sun, creating a focused academic atmosphere."

For each scene, include these essential elements:

CHARACTERS (Primary Focus):
- Detailed physical appearance (age, build, clothing, distinctive features)
- Facial expressions and emotional state
- Body language and positioning
- Actions and movements

SETTING:
- Precise environmental details
- Architecture and spatial layout
- Natural or artificial lighting (emphasize bright, clear lighting)
- Time of day and weather conditions

ATMOSPHERE:
- Color palette and tones
- Textures and materials
- Lighting quality (warm/cool, direct/diffuse)
- Depth and perspective

COMPOSITION:
- Camera angle and distance
- Focus points and depth of field
- Frame composition and subject placement

Remember:
- Prioritize character descriptions when people are present
- Maintain bright, clear lighting unless story demands otherwise
- Stay strictly photorealistic
- Connect every detail to the narrative context
- Write as one detailed paragraph`

const SectionSummarySchema = z.object({
	summary: z.string()
})

const sectionSummarySystemPrompt = `You are an expert narrative summarizer. Create a concise but detailed summary that captures:
- Main plot points and events
- Key character descriptions and dynamics
- Important setting and atmosphere details
- Overall tone and mood of the section
Keep the summary focused and vivid, highlighting elements that would be visually significant.`

export function extractSentenceData(content: string): SentenceData[] {
	const regex = /[^.!?]+[.!?]+/g
	const matches = Array.from(content.matchAll(regex))
	const totalLength = content.length

	return matches.map((match) => ({
		text: match[0].trim(),
		displayPercentage: (match.index || 0) / totalLength
	}))
}

export async function generateSceneDescription(
	sentenceData: SentenceData,
	sectionContext: string
): Promise<SceneDescription> {
	console.log(
		"Generating scene description for sentence:",
		`${sentenceData.text.slice(0, 100)}...`
	)

	const summary = await getSectionSummary(sectionContext)
	const localContext = getLocalParagraphContext(
		sectionContext,
		sentenceData.text
	)

	const contextPrompt = `SECTION SUMMARY:
${summary}

SURROUNDING CONTEXT:
${localContext}

SENTENCE TO VISUALIZE:
${sentenceData.text}

TASK:
Generate a single, highly detailed scene description for this specific sentence that is deeply connected to the narrative. Reflect the story's tone and details naturally and provide explicit visual cues derived directly from the text. Ensure the scene is well lit and avoids overly dark imagery unless explicitly required by the context.

Remember to include all required elements:
1. Physical Setting
2. Visual Atmosphere
3. Key Subjects
4. Camera Perspective

Ensure your response is a single paragraph.`

	const completion = await openai.beta.chat.completions.parse({
		model: "gpt-4o",
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: contextPrompt }
		],
		response_format: zodResponseFormat(SceneResponseSchema, "scene"),
		temperature: 0
	})

	const description = completion.choices[0].message.content ?? ""
	return {
		text: sentenceData.text,
		description,
		displayPercentage: sentenceData.displayPercentage
	}
}

async function getSectionSummary(sectionText: string): Promise<string> {
	const completion = await openai.beta.chat.completions.parse({
		model: "gpt-4o",
		messages: [
			{ role: "system", content: sectionSummarySystemPrompt },
			{ role: "user", content: sectionText }
		],
		response_format: zodResponseFormat(SectionSummarySchema, "summary"),
		temperature: 0.7
	})

	return completion.choices[0].message.content ?? ""
}

function getLocalParagraphContext(
	sectionText: string,
	sentence: string
): string {
	const paragraphs = sectionText
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean)

	const sentenceIndex = paragraphs.findIndex((p) => p.includes(sentence))
	if (sentenceIndex === -1) {
		return sentence
	}

	const relevantParagraphs = [
		sentenceIndex > 0 ? paragraphs[sentenceIndex - 1] : null,
		paragraphs[sentenceIndex],
		sentenceIndex < paragraphs.length - 1 ? paragraphs[sentenceIndex + 1] : null
	].filter((p): p is string => p !== null)

	return relevantParagraphs.join("\n\n")
}

export async function generateSceneDescriptions(
	text: string
): Promise<SceneDescription[]> {
	console.log("Processing text into sentences...")
	const sentences = extractSentenceData(text)
	console.log(`Found ${sentences.length} sentences`)

	const results = await Promise.all(
		sentences.map((sentence) =>
			limit(() => generateSceneDescription(sentence, text))
		)
	)

	return results
}

export async function generateImagesFromScenes(
	scenes: SceneDescription[],
	sectionId: string
): Promise<GeneratedImage[]> {
	console.log(`Starting image generation for ${scenes.length} scenes`)
	return Promise.all(
		scenes.map((scene, index) =>
			generateImage(scene.description, sectionId, index)
		)
	)
}

export async function generateAndSaveSectionFrames(
	scenes: SceneDescription[],
	bookSectionId: string
): Promise<void> {
	console.log(`Generating images for ${scenes.length} scenes`)
	const images = await generateImagesFromScenes(scenes, bookSectionId)

	await Promise.all(
		images.map(async (img, index) => {
			const scene = scenes[index]
			const imageFileName = `frame-${index.toString().padStart(3, "0")}.webp`
			const imageFile = new File([img.imageData], imageFileName, {
				type: "image/webp"
			})

			await uploadFrameToS3AndSave(
				db,
				imageFile,
				bookSectionId,
				scene.displayPercentage
			)
		})
	)
}
