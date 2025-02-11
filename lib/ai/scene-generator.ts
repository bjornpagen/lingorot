import { z } from "zod"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { DEFAULT_TRANSLATION_MODEL } from "@/lib/ai/common"

export type SentenceData = {
	text: string
	displayPercentage: number
}

export type SceneDescription = {
	text: string
	description: string
	displayPercentage: number
}

const openai = new OpenAI()

const SceneResponseSchema = z.object({
	description: z.string()
})

const systemPrompt = `You are a visual description expert who creates vivid, cinematic scene descriptions in a realistic art style. Your descriptions will be used to generate photorealistic imagery.

For each sentence, create a highly detailed scene description that includes:

REQUIRED ELEMENTS:
1. Physical Setting
   - Photorealistic details about the environment and location
   - Precise architectural features, natural elements, or room details
   - Natural lighting conditions and time of day

2. Visual Atmosphere
   - Natural color palette and realistic tones
   - True-to-life weather and environmental conditions
   - Realistic lighting, shadows, and reflections
   - Tangible textures and material properties

3. Key Subjects
   - Lifelike characters with natural proportions and expressions
   - Realistic objects with proper scale and detail
   - Natural spatial relationships and perspective

4. Camera Perspective
   - Cinematic camera angles (eye-level, bird's eye, etc.)
   - Professional shot composition (wide establishing shot, medium shot, etc.)
   - Natural depth of field and focus

RULES:
- Maintain strict photorealism in all descriptions
- Focus ONLY on visual elements that could exist in reality
- Be extremely specific about physical details
- Keep lighting and atmosphere naturalistic
- Avoid fantastical or stylized elements
- Produce your entire description as a single paragraph with no additional line breaks

Format your response as a JSON object:
{
  "description": "Your detailed visual description here"
}`

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

	const prompt = `CONTEXT:
${sectionContext}

SENTENCE TO VISUALIZE:
${sentenceData.text}

TASK:
Generate a single, highly detailed scene description for this specific sentence that could be used to create a visual image. Consider the broader context but focus on this particular moment in the narrative.

Remember to include all required elements:
1. Physical Setting
2. Visual Atmosphere
3. Key Subjects
4. Camera Perspective

Ensure your response is a single paragraph.`

	const completion = await openai.beta.chat.completions.parse({
		model: DEFAULT_TRANSLATION_MODEL,
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: prompt }
		],
		response_format: zodResponseFormat(SceneResponseSchema, "scene"),
		temperature: 0
	})

	console.log(
		"Received completion response:",
		completion.choices[0].message.parsed
	)

	const description = completion.choices[0].message.parsed?.description ?? ""

	return {
		text: sentenceData.text,
		description,
		displayPercentage: sentenceData.displayPercentage
	}
}

export async function generateSceneDescriptions(
	text: string
): Promise<SceneDescription[]> {
	console.log("Processing text into sentences...")
	const sentences = extractSentenceData(text)
	console.log(`Found ${sentences.length} sentences`)

	const batchSize = 3
	const results: SceneDescription[] = []

	for (let i = 0; i < sentences.length; i += batchSize) {
		console.log(
			`Processing batch ${i / batchSize + 1}/${Math.ceil(sentences.length / batchSize)}`
		)
		const batch = sentences.slice(i, i + batchSize)
		const batchPromises = batch.map((sentence) =>
			generateSceneDescription(sentence, text)
		)
		const batchResults = await Promise.all(batchPromises)
		results.push(...batchResults)
		console.log(`Completed batch, total scenes so far: ${results.length}`)
	}

	return results
}
