import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import { writeFile, unlink, access, mkdir } from "node:fs/promises"
import * as path from "node:path"
import * as os from "node:os"
import { downloadFromS3 } from "@/lib/s3"

const execPromise = promisify(exec)
const TEMP_DIR = os.tmpdir()
const TEMP_AUDIO_DIR = path.join(TEMP_DIR, "audio")
const TEMP_FRAMES_DIR = path.join(TEMP_DIR, "frames")

/**
 * @typedef {Object} AudioSegment
 * @property {string} fileId
 * @property {number} durationMs
 * @property {number} position
 */
export type AudioSegment = {
	fileId: string
	durationMs: number
	position: number
}

/**
 * @typedef {Object} SceneFrame
 * @property {string} fileId
 * @property {number} displayPercentage
 */
export type SceneFrame = {
	fileId: string
	displayPercentage: number
}

/**
 * @typedef {Object} TimelineEntry
 * @property {number} boundaryMs
 * @property {string} frameFileId
 */
export type TimelineEntry = {
	boundaryMs: number
	frameFileId: string
}

/**
 * Retrieves audio segments for a given book section ordered by position.
 */
export async function getAudioSegments(
	bookSectionId: string
): Promise<AudioSegment[]> {
	return db
		.select({
			fileId: schema.sectionAudio.fileId,
			durationMs: schema.sectionAudio.durationMs,
			position: schema.sectionAudio.position
		})
		.from(schema.sectionAudio)
		.where(eq(schema.sectionAudio.bookSectionId, bookSectionId))
		.orderBy(schema.sectionAudio.position)
}

/**
 * Retrieves scene frames for a given book section.
 */
export async function getSceneFrames(
	bookSectionId: string
): Promise<SceneFrame[]> {
	return db
		.select({
			fileId: schema.sectionFrame.fileId,
			displayPercentage: schema.sectionFrame.displayPercentage
		})
		.from(schema.sectionFrame)
		.where(eq(schema.sectionFrame.bookSectionId, bookSectionId))
		.orderBy(schema.sectionFrame.displayPercentage)
}

/**
 * Converts audio segments and scene frames into a timeline mapping.
 */
export function mapTimeline(
	audioSegments: AudioSegment[],
	sceneFrames: SceneFrame[]
): TimelineEntry[] {
	const totalDuration = audioSegments.reduce(
		(sum, seg) => sum + seg.durationMs,
		0
	)
	const boundaries: number[] = []
	let cumulative = 0
	for (const seg of audioSegments) {
		cumulative += seg.durationMs
		boundaries.push(cumulative)
	}
	const framesWithAbsolute = sceneFrames.map((frame) => ({
		...frame,
		absoluteTime: frame.displayPercentage * totalDuration
	}))
	return boundaries.map((boundary) => {
		const bestFrame = framesWithAbsolute.reduce(
			(prev, curr) =>
				Math.abs(curr.absoluteTime - boundary) <
				Math.abs(prev.absoluteTime - boundary)
					? curr
					: prev,
			framesWithAbsolute[0]
		)
		return { boundaryMs: boundary, frameFileId: bestFrame.fileId }
	})
}

async function ensureTempDirs() {
	await Promise.all([
		mkdir(TEMP_AUDIO_DIR, { recursive: true }),
		mkdir(TEMP_FRAMES_DIR, { recursive: true })
	])
}

async function downloadAudioSegments(segments: AudioSegment[]) {
	await Promise.all(
		segments.map(async (seg) => {
			const localPath = getAudioPath(seg.fileId)
			await downloadFromS3(seg.fileId, localPath)
		})
	)
}

async function downloadFrames(timeline: TimelineEntry[]) {
	const uniqueFrameIds = [
		...new Set(timeline.map((entry) => entry.frameFileId))
	]
	await Promise.all(
		uniqueFrameIds.map(async (frameId) => {
			const localPath = getFramePath(frameId)
			await downloadFromS3(frameId, localPath)
		})
	)
}

function getAudioPath(fileId: string): string {
	return path.join(TEMP_AUDIO_DIR, `${fileId}.mp3`)
}

function getFramePath(fileId: string): string {
	return path.join(TEMP_FRAMES_DIR, `${fileId}.webp`)
}

/**
 * Uses ffmpeg to concatenate audio segments into one audio track.
 */
async function stitchAudioSegments(segments: AudioSegment[]): Promise<string> {
	console.log("📂 Creating temporary directories...")
	const audioListPath = path.join(TEMP_DIR, `audioList-${Date.now()}.txt`)
	const finalAudioPath = path.join(TEMP_DIR, `final_audio-${Date.now()}.mp3`)

	await ensureTempDirs()
	console.log("⬇️  Downloading audio segments...")
	await downloadAudioSegments(segments)

	await Promise.all(
		segments.map((seg) =>
			access(getAudioPath(seg.fileId)).catch(() => {
				throw new Error(
					`Missing audio segment file at ${getAudioPath(seg.fileId)}`
				)
			})
		)
	)

	try {
		const listContent = segments
			.map((seg) => `file '${getAudioPath(seg.fileId)}'`)
			.join("\n")
		await writeFile(audioListPath, listContent)
		const cmd = `ffmpeg -y -f concat -safe 0 -i ${audioListPath} -c copy ${finalAudioPath}`
		console.log("🔄 Running ffmpeg audio concat...")
		await execPromise(cmd)
		return finalAudioPath
	} finally {
		await unlink(audioListPath).catch(() => {})
	}
}

/**
 * Uses ffmpeg to stitch image-based video segments with an audio track.
 */
async function stitchVideoTimeline(
	audioPath: string,
	timeline: TimelineEntry[]
): Promise<string> {
	const segmentPaths: string[] = []
	const segmentListPath = path.join(TEMP_DIR, `segments-${Date.now()}.txt`)
	const finalVideoPath = path.join(TEMP_DIR, `final_video-${Date.now()}.mp4`)

	await ensureTempDirs()
	console.log("⬇️  Downloading frame images...")
	await downloadFrames(timeline)

	await Promise.all(
		timeline.map((entry) =>
			access(getFramePath(entry.frameFileId)).catch(() => {
				throw new Error(
					`Missing frame file at ${getFramePath(entry.frameFileId)}`
				)
			})
		)
	)

	try {
		const segmentListLines: string[] = []
		let previousBoundary = 0

		for (let idx = 0; idx < timeline.length; idx++) {
			console.log(`🎞️  Processing frame ${idx + 1}/${timeline.length}`)
			const currentBoundary = timeline[idx].boundaryMs
			const durationSec = (currentBoundary - previousBoundary) / 1000
			previousBoundary = currentBoundary

			const framePath = getFramePath(timeline[idx].frameFileId)
			const segmentPath = path.join(
				TEMP_DIR,
				`segment_${Date.now()}_${idx}.mp4`
			)
			segmentPaths.push(segmentPath)

			const cmd = `ffmpeg -y -loop 1 -i ${framePath} -t ${durationSec} -vf "format=yuv420p" -c:v libx264 ${segmentPath}`
			await execPromise(cmd)
			segmentListLines.push(`file '${segmentPath}'`)
		}

		await writeFile(segmentListPath, segmentListLines.join("\n"))

		console.log("🎬 Combining video segments with audio...")
		const concatCmd = `ffmpeg -y -f concat -safe 0 -i ${segmentListPath} -i ${audioPath} -c:v libx264 -c:a aac -strict experimental ${finalVideoPath}`
		await execPromise(concatCmd)

		return finalVideoPath
	} finally {
		await Promise.allSettled([
			...segmentPaths.map((segPath) => unlink(segPath).catch(() => {})),
			unlink(segmentListPath).catch(() => {})
		])
	}
}

/**
 * Orchestrates final video generation by stitching audio and frames using ffmpeg.
 */
export async function generateVideo(
	bookSectionId: string,
	languageId: (typeof schema.languageCode.enumValues)[number],
	cefrLevel: (typeof schema.cefrLevel.enumValues)[number]
): Promise<string> {
	console.log("\n🎬 Starting video generation for section:", bookSectionId)

	const [audioSegments, sceneFrames] = await Promise.all([
		getAudioSegments(bookSectionId),
		getSceneFrames(bookSectionId)
	])

	console.log(
		`📊 Found ${audioSegments.length} audio segments and ${sceneFrames.length} scene frames`
	)

	if (audioSegments.length === 0) {
		throw new Error(`No audio segments found for section ${bookSectionId}`)
	}
	if (sceneFrames.length === 0) {
		throw new Error(`No scene frames found for section ${bookSectionId}`)
	}

	const timeline = mapTimeline(audioSegments, sceneFrames)
	console.log(`⏱️  Created timeline with ${timeline.length} entries`)

	console.log("🔊 Starting audio stitching...")
	const finalAudioPath = await stitchAudioSegments(audioSegments)
	console.log("✅ Audio stitching complete:", finalAudioPath)

	console.log("🎥 Starting video assembly...")
	const finalVideoPath = await stitchVideoTimeline(finalAudioPath, timeline)
	console.log("✅ Video assembly complete")

	await unlink(finalAudioPath).catch(() => {})
	console.log(
		`\n🎉 Final video generated at: ${finalVideoPath}\n   Language: ${languageId}\n   CEFR Level: ${cefrLevel}`
	)
	return finalVideoPath
}
