//import "server-only"
import { createCompletion } from "@/lib/ai/common"
import type * as schema from "@/db/schema"
type CEFRLevel = (typeof schema.cefrLevel.enumValues)[number]

interface CEFRDetail {
	name: string
	features: string[]
	guidelines: string[]
}

const cefrDetails: Record<CEFRLevel, CEFRDetail> = {
	A1: {
		name: "Breakthrough or Beginner",
		features: [
			"Can understand and use familiar everyday expressions and very basic phrases",
			"Active vocabulary (~300 words), passive vocabulary (~600 words)"
		],
		guidelines: [
			"Do not use any tense except simple present",
			"Do not use subordinate clauses",
			'Do not use any conjunctions except "and" and "but"',
			"Do not use comparatives or superlatives",
			"Do not use passive voice",
			"Do not use vocabulary beyond ~300 active words and ~600 passive words"
		]
	},
	A2: {
		name: "Waystage or Elementary",
		features: [
			"Can communicate in simple and routine tasks on familiar topics",
			"Can describe basic present and past situations",
			"Active vocabulary (~600 words), passive vocabulary (~1,200 words)"
		],
		guidelines: [
			"Use connecting words to link related ideas into simple compound sentences",
			'Do not use tenses beyond simple present, simple past, and "going to" future',
			"Do not use passive voice",
			'Do not use subordinate clauses except very basic ones with "because"',
			"Do not use comparisons beyond basic more/less",
			"Do not use vocabulary beyond ~600 active words and ~1,200 passive words"
		]
	},
	B1: {
		name: "Threshold or Intermediate",
		features: [
			"Can communicate about familiar topics and personal interests",
			"Can describe simple experiences and basic events",
			"Active vocabulary (~1,200 words), passive vocabulary (~2,500 words)"
		],
		guidelines: [
			"Use connecting words to link related ideas into compound sentences",
			'Do not use tenses beyond present simple, past simple, and "going to" future',
			"Do not write sentences with more than one main idea",
			"Do not use uncommon or specialized vocabulary",
			"Do not use idioms or complex expressions",
			"Do not use vocabulary beyond ~1,200 active words and ~2,500 passive words"
		]
	},
	B2: {
		name: "Vantage or Upper Intermediate",
		features: [
			"Can understand main ideas of complex text on both concrete and abstract topics",
			"Can express opinions with some nuance and reasoning",
			"Active vocabulary (~2,500 words), passive vocabulary (~5,000 words)"
		],
		guidelines: [
			"Do not use tenses beyond present/past simple/continuous and future forms",
			"Do not write sentences with more than two main ideas",
			"Do not use advanced academic or technical vocabulary",
			"Do not use complex idiomatic expressions",
			"Do not use vocabulary beyond ~2,500 active words and ~5,000 passive words"
		]
	},
	C1: {
		name: "Effective Operational Proficiency",
		features: [
			"Can understand complex texts and implicit meaning",
			"Can express ideas fluently and spontaneously",
			"Active vocabulary (~5,000 words), passive vocabulary (~10,000 words)"
		],
		guidelines: [
			"Do not use highly specialized academic terminology",
			"Do not use obscure idiomatic expressions",
			"Do not use extremely complex sentence structures",
			"Maintain appropriate register with some flexibility",
			"Do not use vocabulary beyond ~5,000 active words and ~10,000 passive words"
		]
	},
	C2: {
		name: "Advanced",
		features: [
			"Can understand a wide range of demanding, longer texts",
			"No limits on vocabulary and grammar"
		],
		guidelines: [
			"Do not simplify technical terminology unless extremely specialized",
			"Do not alter idiomatic expressions from source text",
			"Do not break complex sentence structures unless unclear",
			"Do not modify register or formality level"
		]
	}
}

function formatCEFRFeatures(features: string[]): string {
	return features.map((feature) => `    - ${feature}`).join("\n")
}

function formatCEFRGuidelines(guidelines: string[]): string {
	return guidelines.map((guideline) => `- ${guideline}`).join("\n")
}

/**
 * Builds the system prompt for the AI model based on language level.
 *
 * @param targetLanguage - The target language for transcription.
 * @param cefrLevel - The CEFR level for language complexity.
 * @returns A formatted system prompt string.
 */
export function buildLanguageTranscriptionPrompt(
	targetLanguage: string,
	cefrLevel: CEFRLevel
): string {
	const levelInfo = cefrDetails[cefrLevel]

	return `You are a transcriber who converts text into clear, modern ${targetLanguage} while:
- Maintaining all key details and nuances from the original text
- Using natural, contemporary ${targetLanguage} phrasing
- Following vocabulary and grammar structures appropriate for ${cefrLevel} level (${levelInfo.name}):
${formatCEFRFeatures(levelInfo.features)}

Level-Specific Guidelines:
${formatCEFRGuidelines(levelInfo.guidelines)}

CRITICAL: You must preserve 100% of the original meaning - do not add, remove, or alter ANY semantic content.

Format your response using a single pair of XML tags:
<transcription>Your transcription</transcription>`
}

/**
 * Generates a transcription using the OpenAI API based on the provided text and language parameters.
 *
 * @param text - The text to be transcribed.
 * @param targetLanguage - The target language for transcription.
 * @param cefrLevel - The CEFR level for language complexity.
 * @returns The transcribed text or null if unsuccessful.
 */
export async function transcribeText(
	text: string,
	targetLanguage: string,
	cefrLevel: CEFRLevel
): Promise<string | null> {
	const systemPrompt = buildLanguageTranscriptionPrompt(
		targetLanguage,
		cefrLevel
	)
	const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())
	const transcriptionChunks: string[] = []

	for (const paragraph of paragraphs) {
		const response = await createCompletion([
			{ role: "system", content: systemPrompt },
			{ role: "user", content: paragraph }
		])
		if (!response) {
			return null
		}
		const match = response.match(/<transcription>([\s\S]*?)<\/transcription>/)
		if (!match) {
			return null
		}
		transcriptionChunks.push(match[1].trim())
	}
	return transcriptionChunks.join("\n\n")
}
