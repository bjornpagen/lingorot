import { uploadFrameToS3AndSave } from "@/lib/s3"
import { db } from "@/db"
import { generateImage, type GeneratedImage } from "@/lib/replicate"
import type { SceneDescription } from "@/lib/ai/scene-generator"

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
