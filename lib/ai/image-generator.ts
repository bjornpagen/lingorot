import Replicate from "replicate"

if (!process.env.REPLICATE_API_TOKEN) {
	throw new Error("REPLICATE_API_TOKEN is not set")
}

const replicate = new Replicate()

export type GeneratedImage = {
	sectionId: string
	position: number
	prompt: string
	imageData: Buffer
}

export async function generateImage(
	prompt: string,
	sectionId: string,
	position: number
): Promise<GeneratedImage> {
	const output = (await replicate.run("black-forest-labs/flux-schnell", {
		input: { prompt }
	})) as string[]

	const imageData = Buffer.from(output[0])

	return {
		sectionId,
		position,
		prompt,
		imageData
	}
}

export async function generateImagesFromScenes(
	scenes: Array<{ description: string }>,
	sectionId: string
): Promise<GeneratedImage[]> {
	const images: GeneratedImage[] = []

	for (const [index, scene] of scenes.entries()) {
		const image = await generateImage(scene.description, sectionId, index)
		images.push(image)
	}

	return images
}
