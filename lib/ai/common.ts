//import "server-only"

import OpenAI from "openai"
import pLimit from "p-limit"

if (!process.env.OPENROUTER_API_KEY) {
	throw new Error("OPENROUTER_API_KEY is not set")
}

// Create rate limited OpenAI client
const openai = new OpenAI({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: process.env.OPENROUTER_API_KEY
})

// Create rate limiter: 5 requests per second
const limit = pLimit(5)

export const DEFAULT_TRANSLATION_MODEL = "anthropic/claude-3.5-sonnet" as const

export async function createCompletion(
	messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
	model: string = DEFAULT_TRANSLATION_MODEL,
	temperature = 0
): Promise<string> {
	return limit(async () => {
		const completion = await openai.chat.completions.create({
			model,
			temperature,
			messages
		})
		const content = completion.choices[0]?.message?.content ?? null
		if (!content) {
			throw new Error("No content returned from OpenAI")
		}
		return content
	})
}
