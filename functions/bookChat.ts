"use server"

import { createCompletion } from "@/lib/ai/common"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import type { OpenAI } from "openai"

export async function bookChat(params: {
	message: string
	bookId: string
	sectionId: string
	languageId: (typeof schema.languageCode.enumValues)[number]
}): Promise<string> {
	const section = await db
		.select({
			content: schema.bookSection.content,
			bookId: schema.bookSection.bookId
		})
		.from(schema.bookSection)
		.where(eq(schema.bookSection.id, params.sectionId))
		.then((rows) => rows[0])

	if (!section) {
		throw new Error("Book section not found")
	}

	if (section.bookId !== params.bookId) {
		throw new Error("Book section does not belong to the specified book")
	}

	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{
			role: "system",
			content: `You are a friendly language learning assistant. Help the student practice and understand the following text in its original language: "${section.content}". Respond in the same language as the text.`
		},
		{
			role: "user",
			content: params.message
		}
	]

	return createCompletion(messages)
}
