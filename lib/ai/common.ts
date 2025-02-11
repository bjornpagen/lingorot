//import "server-only"

import OpenAI from "openai"
import pLimit from "p-limit"

if (!process.env.OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY is not set")
}

// Create rate limited OpenAI client
export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

export const limit = pLimit(10)

export const DEFAULT_TRANSLATION_MODEL = "gpt-4o"

export async function createCompletion(
	messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
	model: string = DEFAULT_TRANSLATION_MODEL
): Promise<string> {
	return limit(async () => {
		const completion = await openai.chat.completions.create({
			model,
			messages
		})
		const content = completion.choices[0]?.message?.content ?? null
		if (!content) {
			throw new Error("No content returned from OpenAI")
		}
		return content
	})
}
