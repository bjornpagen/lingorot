import { z } from "zod"

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
