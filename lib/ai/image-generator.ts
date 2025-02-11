import { exec } from "node:child_process"
import { promisify } from "node:util"
import { writeFile, unlink, mkdir, rmdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { uploadToS3 } from "@/lib/s3"
import { db } from "@/db"
import { file, baseVideo } from "@/db/schema"
import { createId } from "@paralleldrive/cuid2"
import { z } from "zod"

const execAsync = promisify(exec)

if (!process.env.REPLICATE_API_TOKEN) {
	throw new Error("REPLICATE_API_TOKEN is not set")
}

const REPLICATE_API_URL = "https://api.replicate.com/v1"

type FluxSchnellInput = {
	prompt: string
	seed?: number
	go_fast?: boolean
	megapixels?: "1" | "0.25"
	num_outputs?: 1 | 2 | 3 | 4
	aspect_ratio?:
		| "1:1"
		| "16:9"
		| "21:9"
		| "3:2"
		| "2:3"
		| "4:5"
		| "5:4"
		| "3:4"
		| "4:3"
		| "9:16"
		| "9:21"
	output_format?: "webp" | "jpg" | "png"
	output_quality?: number
	num_inference_steps?: 1 | 2 | 3 | 4
	disable_safety_checker?: boolean
}

type ReplicateResponse = {
	id: string
	status: "starting" | "processing" | "succeeded" | "failed"
	output: string[] | null
	error: string | null
}

type ReplicateRequest = {
	input: FluxSchnellInput
}

async function createPrediction(prompt: string): Promise<string> {
	const payload: ReplicateRequest = {
		input: {
			prompt
		}
	}

	const response = await fetch(
		`${REPLICATE_API_URL}/models/black-forest-labs/flux-schnell/predictions`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
				"Content-Type": "application/json",
				Prefer: "wait"
			},
			body: JSON.stringify(payload)
		}
	)

	if (!response.ok) {
		throw new Error(
			`Replicate API error: ${response.status} ${response.statusText}`
		)
	}

	const prediction = (await response.json()) as ReplicateResponse
	return prediction.id
}

async function getPredictionResult(id: string): Promise<string[]> {
	const maxAttempts = 60
	const delayMs = 1000

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const response = await fetch(`${REPLICATE_API_URL}/predictions/${id}`, {
			headers: {
				Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`
			}
		})

		if (!response.ok) {
			throw new Error(
				`Replicate API error: ${response.status} ${response.statusText}`
			)
		}

		const prediction = (await response.json()) as ReplicateResponse

		if (prediction.status === "succeeded" && prediction.output) {
			return prediction.output
		}

		if (prediction.status === "failed") {
			throw new Error(`Prediction failed: ${prediction.error}`)
		}

		await new Promise((resolve) => setTimeout(resolve, delayMs))
	}

	throw new Error("Prediction timed out")
}

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
	const predictionId = await createPrediction(prompt)
	const outputs = await getPredictionResult(predictionId)

	const urlSchema = z.string().url()
	const replicateOutputSchema = z.array(z.string())
	const parseResult = replicateOutputSchema.safeParse(outputs)
	if (!parseResult.success) {
		throw new Error("Invalid replicate output format")
	}

	const output = parseResult.data[0]
	let imageData: Buffer
	if (urlSchema.safeParse(output).success) {
		const response = await fetch(output)
		if (!response.ok) {
			throw new Error(`Failed to fetch generated image: ${response.status}`)
		}
		const arrayBuffer = await response.arrayBuffer()
		imageData = Buffer.from(arrayBuffer)
	} else {
		imageData = Buffer.from(output)
	}

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
	console.log(`Starting image generation for ${scenes.length} scenes`)
	await mkdir("generated-images", { recursive: true })
	return Promise.all(
		scenes.map((scene, index) =>
			generateImage(scene.description, sectionId, index)
		)
	)
}

export type GeneratedVideo = {
	videoBuffer: Buffer
	imagePaths: string[]
	tempDir: string
}

export async function generateVideo(
	scenes: Array<{ description: string }>,
	sectionId: string
): Promise<GeneratedVideo> {
	console.log("Starting video generation process...")
	const tempDir = join(tmpdir(), createId())
	console.log("Created temp directory:", tempDir)
	await mkdir(tempDir, { recursive: true })

	try {
		console.log("Generating images for video frames...")
		const images = await generateImagesFromScenes(scenes, sectionId)
		console.log(`Successfully generated ${images.length} images`)

		console.log("Writing image frames to temp directory...")
		const imageWritePromises = images.map((image, index) => {
			const imagePath = join(
				tempDir,
				`frame-${index.toString().padStart(3, "0")}.webp`
			)
			return writeFile(imagePath, image.imageData).then(() => imagePath)
		})

		const imagePaths = await Promise.all(imageWritePromises)
		console.log(`Successfully wrote ${imagePaths.length} frames to disk`)

		const outputPath = join(tempDir, "output.mp4")
		console.log("Running ffmpeg to generate video with zoompan effect...")
		// Each image is held for 2 seconds (120 frames at 60fps) with a very subtle zoom, preserving the original aspect ratio
		const ffmpegCommand = `ffmpeg -framerate 1 -i ${join(tempDir, "frame-%03d.webp")} \
		-vf "zoompan=z='1.0+0.0005*on':d=120:s=iw:ih" \
		-c:v libx264 -pix_fmt yuv420p -r 60 ${outputPath}`
		console.log("FFmpeg command:", ffmpegCommand)

		try {
			await execAsync(ffmpegCommand)
		} catch (error) {
			throw new Error(
				`FFmpeg failed: ${error instanceof Error ? error.message : String(error)}`
			)
		}

		console.log("Reading generated video file...")
		const videoBuffer = await readFile(outputPath)
		console.log(`Successfully generated video (${videoBuffer.length} bytes)`)

		return {
			videoBuffer,
			imagePaths,
			tempDir
		}
	} catch (error) {
		console.error("Failed to generate video:", error)
		await rmdir(tempDir, { recursive: true }).catch((e) =>
			console.error("Failed to cleanup temp directory:", e)
		)
		throw error
	}
}

export async function uploadGeneratedVideo(
	videoBuffer: Buffer,
	sectionId: string
): Promise<string> {
	const videoFile = new File([videoBuffer], "video.mp4", {
		type: "video/mp4"
	})
	const s3Key = await uploadToS3(videoFile)

	const [fileRecord] = await db
		.insert(file)
		.values({
			id: s3Key,
			name: "video.mp4",
			size: videoBuffer.length,
			type: "video/mp4"
		})
		.returning()

	const [baseVideoRecord] = await db
		.insert(baseVideo)
		.values({
			bookSectionId: sectionId,
			fileId: fileRecord.id
		})
		.returning()

	return baseVideoRecord.id
}

export async function generateAndUploadVideo(
	scenes: Array<{ description: string }>,
	sectionId: string
): Promise<string> {
	const { videoBuffer, imagePaths, tempDir } = await generateVideo(
		scenes,
		sectionId
	)

	try {
		const videoId = await uploadGeneratedVideo(videoBuffer, sectionId)

		await Promise.all([
			...imagePaths.map((path) => unlink(path)),
			unlink(join(tempDir, "output.mp4"))
		])
		await rmdir(tempDir)

		return videoId
	} catch (error) {
		await rmdir(tempDir, { recursive: true })
		throw error
	}
}
