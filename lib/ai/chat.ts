"use server"

import { createCompletion } from "./common"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"
import {
	cefrDetails,
	formatCEFRFeatures,
	formatCEFRGuidelines
} from "./transcribe"
import type { OpenAI } from "openai"
import { getSession } from "../session"

export async function bookChat(params: {
	message: string
	bookId: string
	sectionId: string
	languageId: (typeof schema.languageCode.enumValues)[number]
}): Promise<string> {
	console.log("\nProcessing chat request:", {
		message: params.message,
		bookId: params.bookId,
		sectionId: params.sectionId,
		languageId: params.languageId
	})

	const session = await getSession()
	if (!session) {
		throw new Error("User not authenticated")
	}

	const result = await db
		.select({
			content: schema.bookSection.content,
			bookId: schema.bookSection.bookId,
			languageName: schema.language.name,
			cefrLevel: schema.video.cefrLevel
		})
		.from(schema.bookSection)
		.leftJoin(schema.book, eq(schema.bookSection.bookId, schema.book.id))
		.innerJoin(
			schema.video,
			eq(schema.video.bookSectionId, schema.bookSection.id)
		)
		.innerJoin(schema.language, eq(schema.language.code, params.languageId))
		.where(
			and(
				eq(schema.bookSection.id, params.sectionId),
				eq(schema.video.languageId, params.languageId)
			)
		)
		.then((rows) => rows[0])

	console.log("\nContext retrieved:", {
		content: `${result?.content?.slice(0, 150)}...`,
		languageName: result?.languageName,
		cefrLevel: result?.cefrLevel
	})

	if (!result) {
		throw new Error("Section, video, or language not found")
	}

	if (result.bookId !== params.bookId) {
		throw new Error("Book section does not belong to the specified book")
	}

	const levelInfo = cefrDetails[result.cefrLevel]

	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{
			role: "system",
			content: `You are a friendly ${result.languageName} language learning assistant for ${levelInfo.name} (${result.cefrLevel}) level students.

The student is reading the following text in ${result.languageName}:

"${result.content}"

Level-Specific Features:
${formatCEFRFeatures(levelInfo.features)}

Guidelines for your responses:
${formatCEFRGuidelines(levelInfo.guidelines)}

Your role is to:
1. Help them understand the text while staying within their level
2. Answer questions about vocabulary and grammar using only ${result.cefrLevel}-appropriate language
3. Encourage them to practice speaking and writing in ${result.languageName}
4. Provide gentle corrections when they make mistakes
5. Only use vocabulary and grammar structures appropriate for ${result.cefrLevel} level

Always respond in ${result.languageName} unless specifically asked to explain in another language.
Keep your responses clear and within the student's comprehension level.`
		},
		{
			role: "user",
			content: params.message
		}
	]

	console.log(
		"\nSending completion request with system prompt:",
		messages[0].content
	)

	const response = await createCompletion(messages)
	console.log("\nReceived response:", `${response.slice(0, 150)}...`)
	return response
}
