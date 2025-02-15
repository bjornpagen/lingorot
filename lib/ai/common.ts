import { OpenAI } from "openai"
import pLimit from "p-limit"

const limit = pLimit(10)

if (!process.env.OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY is not set")
}

export const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

export async function createCompletion(
	messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<string> {
	return limit(async () => {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o", // <--- DON'T CHANGE THIS
			messages
		})
		const content = completion.choices[0]?.message?.content ?? null
		if (!content) {
			throw new Error("No content returned from OpenAI")
		}
		return content
	})
}

export { limit }
