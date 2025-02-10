import { createCompletion } from "@/lib/ai/common"
import { z } from "zod"

export type SceneDescription = {
	paragraph: string
	description: string
}

const SceneResponseSchema = z.object({
	description: z.string()
})

const systemPrompt = `You are a visual description expert who creates vivid, cinematic scene descriptions. Your descriptions will be used to generate visual imagery.

For each paragraph, create a highly detailed scene description that includes:

REQUIRED ELEMENTS:
1. Physical Setting
   - Specific details about the environment and location
   - Architecture, natural features, or room details
   - Time of day and lighting conditions

2. Visual Atmosphere
   - Color palette and overall tone
   - Weather or environmental conditions
   - Lighting quality and shadows
   - Texture and material details

3. Key Subjects
   - Main characters or objects and their positioning
   - Important visual elements that draw focus
   - Scale and spatial relationships

4. Camera Perspective
   - Suggested viewing angle (eye-level, bird's eye, etc.)
   - Shot type (wide establishing shot, medium shot, etc.)
   - Depth and composition details

RULES:
- Focus ONLY on visual elements that could be rendered in an image
- Be extremely specific about visual details
- Maintain consistency with the broader narrative context
- Describe only what is visible, not abstract concepts
- Keep descriptions objective and avoid interpretation

Format your response as a JSON object:
{
  "description": "Your detailed visual description here"
}

Example output:
{
  "description": "A wide establishing shot frames a weathered Victorian mansion against a violet twilight sky. The three-story structure looms from a low angle, its dark windows reflecting the last copper rays of sunset. Thick ivy covers the eastern wall, while the western facade reveals peeling gray paint and ornate but deteriorating woodwork. Two stone chimneys pierce the steep slate roof, trailing thin wisps of smoke. The foreground shows an overgrown garden path leading to worn marble steps, with twisted iron railings casting long shadows across lichen-covered stones."
}`

function splitIntoParagraphs(text: string): string[] {
	return text
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean)
}

export async function generateSceneDescription(
	paragraph: string,
	sectionContext: string
): Promise<SceneDescription> {
	const prompt = `CONTEXT:
${sectionContext}

PARAGRAPH TO VISUALIZE:
${paragraph}

TASK:
Generate a highly detailed scene description for this specific paragraph that could be used to create a visual image. Consider the broader context but focus on this particular moment in the narrative.

Remember to include all required elements:
1. Physical Setting
2. Visual Atmosphere
3. Key Subjects
4. Camera Perspective`

	const response = await createCompletion(
		[
			{ role: "system", content: systemPrompt },
			{ role: "user", content: prompt }
		],
		"gpt-4"
	)

	try {
		const parsed = JSON.parse(response)
		const validated = SceneResponseSchema.parse(parsed)

		return {
			paragraph,
			description: validated.description
		}
	} catch (error) {
		console.error("Failed to parse scene description:", error)
		throw new Error("Failed to generate valid scene description")
	}
}

export async function generateSceneDescriptions(
	text: string
): Promise<SceneDescription[]> {
	const paragraphs = splitIntoParagraphs(text)

	// Process paragraphs in parallel since they're now independent
	const scenePromises = paragraphs.map((paragraph, index) =>
		generateSceneDescription(paragraph, text)
	)

	return Promise.all(scenePromises)
}
