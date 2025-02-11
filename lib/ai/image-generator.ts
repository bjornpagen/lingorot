import { uploadFrameToS3AndSave } from "@/lib/s3"
import { db } from "@/db"
import { generateImage, type GeneratedImage } from "@/lib/replicate"

export async function generateImagesFromScenes(
	scenes: Array<{ description: string; paragraph: string }>,
	sectionId: string
): Promise<GeneratedImage[]> {
	console.log(`Starting image generation for ${scenes.length} scenes`)
	return Promise.all(
		scenes.map((scene, index) =>
			generateImage(scene.description, sectionId, index)
		)
	)
}

type ParagraphOffset = {
	text: string
	startIndex: number
	endIndex: number
}

function computeParagraphOffsets(
	content: string,
	paragraphs: string[]
): ParagraphOffset[] {
	const offsets: ParagraphOffset[] = []
	let currentIndex = 0

	for (const paragraph of paragraphs) {
		const startIndex = content.indexOf(paragraph, currentIndex)
		if (startIndex === -1) {
			throw new Error(
				`Failed to find paragraph "${paragraph.slice(0, 50)}..." in content. This indicates a mismatch between generated scenes and the original content.`
			)
		}
		const endIndex = startIndex + paragraph.length
		offsets.push({ text: paragraph, startIndex, endIndex })
		currentIndex = endIndex
	}

	return offsets
}

export async function generateAndSaveSectionFrames(
	scenes: Array<{ description: string; paragraph: string }>,
	bookSectionId: string,
	sectionContent: string
): Promise<void> {
	console.log(`Generating images for ${scenes.length} scenes`)
	const images = await generateImagesFromScenes(scenes, bookSectionId)

	const paragraphs = scenes.map((scene) => scene.paragraph)
	const offsets = computeParagraphOffsets(sectionContent, paragraphs)
	const totalLength = sectionContent.length

	await Promise.all(
		images.map(async (img, index) => {
			const offset = offsets[index]
			const displayPercentage =
				totalLength > 0 ? offset.startIndex / totalLength : 0

			const imageFileName = `frame-${index.toString().padStart(3, "0")}.webp`
			const imageFile = new File([img.imageData], imageFileName, {
				type: "image/webp"
			})

			await uploadFrameToS3AndSave(
				db,
				imageFile,
				bookSectionId,
				displayPercentage
			)
		})
	)
}
