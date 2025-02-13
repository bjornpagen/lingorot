import Mux from "@mux/mux-node"
import type * as schema from "@/db/schema"

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
	throw new Error("MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set")
}

const mux = new Mux({
	tokenId: process.env.MUX_TOKEN_ID,
	tokenSecret: process.env.MUX_TOKEN_SECRET
})

async function createAsset(
	url: string,
	languageCode: (typeof schema.languageCode.enumValues)[number]
): Promise<{ assetId: string; playbackId: string }> {
	if (languageCode === "ar" || languageCode === "zh") {
		throw new Error("Mux does not support Arabic or Chinese")
	}

	const asset = await mux.video.assets.create({
		input: [
			{
				url,
				generated_subtitles: [
					{
						language_code: languageCode,
						name: `${languageCode.toUpperCase()} CC`
					}
				]
			}
		],
		playback_policy: ["public"],
		max_resolution_tier: "2160p",
		video_quality: "premium"
	})

	const playbackId = asset.playback_ids?.[0]?.id
	if (!playbackId) {
		throw new Error("No playback ID returned from Mux")
	}

	return {
		assetId: asset.id,
		playbackId
	}
}

async function getAssetStatus(assetId: string) {
	const maxAttempts = 60
	const delayMs = 1000

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const asset = await mux.video.assets.retrieve(assetId)

		if (asset.status === "ready") {
			return asset
		}

		if (asset.status === "errored") {
			throw new Error(
				`Mux asset creation failed: ${asset.errors?.messages?.[0] ?? "Unknown error"}`
			)
		}

		await new Promise((resolve) => setTimeout(resolve, delayMs))
	}

	throw new Error("Mux asset creation timed out")
}

export async function createMuxAsset(
	url: string,
	languageCode: (typeof schema.languageCode.enumValues)[number]
): Promise<{ assetId: string; playbackId: string }> {
	const { assetId, playbackId } = await createAsset(url, languageCode)
	await getAssetStatus(assetId)
	return { assetId, playbackId }
}
