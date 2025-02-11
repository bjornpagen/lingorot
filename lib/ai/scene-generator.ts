import { z } from "zod"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { DEFAULT_TRANSLATION_MODEL } from "@/lib/ai/common"

export type SceneDescription = {
	paragraph: string
	description: string
}

const openai = new OpenAI()

const SceneResponseSchema = z.object({
	description: z.string()
})

const systemPrompt = `You are a visual description expert who creates vivid, cinematic scene descriptions in a realistic art style. Your descriptions will be used to generate photorealistic imagery.

For each paragraph, create a highly detailed scene description as a single paragraph that includes:

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

function splitIntoSentences(text: string): string[] {
	return text
		.replace(/([.!?])\s+/g, "$1|")
		.split("|")
		.map((s) => s.trim())
		.filter(Boolean)
}

function splitIntoParagraphs(text: string): string[] {
	return text
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean)
}

function groupSentencesInParagraph(paragraph: string): string[] {
	const sentences = splitIntoSentences(paragraph)
	const groups: string[] = []

	for (let i = 0; i < sentences.length; i += 2) {
		if (i + 1 < sentences.length) {
			groups.push(`${sentences[i]} ${sentences[i + 1]}`)
		} else {
			groups.push(sentences[i])
		}
	}

	return groups
}

export async function generateSceneDescription(
	paragraph: string,
	sectionContext: string
): Promise<SceneDescription> {
	console.log(
		"Generating scene description for paragraph:",
		`${paragraph.slice(0, 100)}...`
	)

	const prompt = `CONTEXT:
${sectionContext}

PARAGRAPH TO VISUALIZE:
${paragraph}

TASK:
Generate a single, highly detailed scene description for this specific paragraph that could be used to create a visual image. Consider the broader context but focus on this particular moment in the narrative.

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
		paragraph,
		description
	}
}

export async function generateSceneDescriptions(
	text: string
): Promise<SceneDescription[]> {
	console.log("Processing text into sentence groups...")
	const paragraphs = splitIntoParagraphs(text)
	const sentenceGroups: string[] = []

	for (const paragraph of paragraphs) {
		sentenceGroups.push(...groupSentencesInParagraph(paragraph))
	}

	console.log(`Found ${sentenceGroups.length} sentence groups`)

	const batchSize = 3
	const results: SceneDescription[] = []

	for (let i = 0; i < sentenceGroups.length; i += batchSize) {
		console.log(
			`Processing batch ${i / batchSize + 1}/${Math.ceil(sentenceGroups.length / batchSize)}`
		)
		const batch = sentenceGroups.slice(i, i + batchSize)
		const batchPromises = batch.map((sentences) =>
			generateSceneDescription(sentences, text)
		)
		const batchResults = await Promise.all(batchPromises)
		results.push(...batchResults)
		console.log(`Completed batch, total scenes so far: ${results.length}`)
	}

	return results
}
