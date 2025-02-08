import "server-only"

import { createCompletion } from "@/lib/ai/common"
import { XMLParser } from "fast-xml-parser"
import { z } from "zod"

interface Section {
	name?: string
	firstLine: number
	lastLine: number
}

const CHUNK_SIZE = 32000 // Characters per chunk, leaving room for prompt and response

const gutenbergSystemPrompt = `You are a text analyzer specializing in breaking books into logical chapters. Your task is to analyze text and identify chapter boundaries while following these strict rules:

Core Requirements:
- Identify distinct chapters or major story sections in the provided text
- Provide section boundaries using line numbers, EXCLUDING ALL section headers and titles
- Only include actual story content (ignore metadata, licenses, tables of contents, prefaces, etc)

CRITICAL RULES:
- You may ONLY create a new section when you find an EXPLICIT section header or chapter title in the text
- ONLY the very first section of a file may omit the name tag. ALL other sections MUST have names, NO EXCEPTIONS
- Section names MUST be taken VERBATIM from the text - NEVER infer, generate, or make up names
- The firstLine MUST be the first line of actual story content AFTER any headers, titles, or separators
- Each section MUST continue until the next section header is found - do not end sections early
- If no new section header is found, the section should continue to the end of the provided text

NOT Section Headers (Ignore These):
- Decorative separators like "* * *" or "-----" or "§"
- Roman numerals (I., II., III., etc.) within chapters
- Scene breaks or time shifts within chapters
- Any other internal divisions that don't represent full chapter or major section breaks

Line Counting Rules:
1. The firstLine must point to the first line containing actual story content
2. The lastLine MUST point to the last line containing human-readable text
3. The line AFTER lastLine MUST be an empty/blank line
4. The lastLine MUST NOT include:
   - Empty/blank lines
   - Decorative separators
   - Any non-story content

Output Format:
<sections>
  <section>
    <name>Chapter Name</name> <!-- ONLY the first section may omit name, ALL others MUST have names -->
    <firstLine>First Content Line Number</firstLine>
    <lastLine>Last Content Line Number</lastLine>
  </section>
</sections>

Examples:

1. Standard Chapter with Header:
Input:
   001: THE GHOST OF A LIVE MAN.
   002:
   003: We were in the South...
   004: Atlantic Ocean, in the...
   005: The storm raged on.
   006:
   007: More content here...
   008: Still the same chapter...
   009: Until we find another header.
   010:
   011: NEXT CHAPTER TITLE
   012: New chapter content...

Output:
<sections>
  <section>
    <name>THE GHOST OF A LIVE MAN</name>
    <firstLine>3</firstLine>
    <lastLine>9</lastLine>
  </section>
</sections>

2. Content Without Headers:
Input:
   001: along the highway, now
   002: so singularly deserted,
   003: looking hither and...
   004: more content here...
   005: continuing the story...
   006: until the very end...
   007:
   008: CHAPTER TWO: THE ARRIVAL
   009: The next chapter begins...

Output:
<sections>
  <section>
    <firstLine>1</firstLine>
    <lastLine>6</lastLine>
  </section>
</sections>

3. Complex Chapter Structure:
Input:
   020: PART ONE
   021: Chapter 1
   022: The Beginning
   023:
   024: First actual content
   025: More story...
   026: Some more story...
   027:        *       *       *       *       *
   028: Even more story...
   029: Ending of story...
   030:
   031: NEXT CHAPTER TITLE
   032: content...

Output:
<sections>
  <section>
    <name>The Beginning</name>
    <firstLine>24</firstLine>
    <lastLine>29</lastLine>
  </section>
</sections>

Remember: Format your response as a single pair of XML tags. The output will be parsed directly by an XML parser - do not include any other text or tags.`

const SectionSchema = z.object({
	name: z.string().optional(),
	firstLine: z.string(), // XML parser gives us strings, we'll convert to number later
	lastLine: z.string()
})

const ResponseSchema = z.object({
	sections: z.object({
		section: z.union([SectionSchema, z.array(SectionSchema)])
	})
})

type ParsedResponse = z.infer<typeof ResponseSchema>

/**
 * Splits text into overlapping chunks with a single overlapping line
 * @param text The full text content
 * @returns Array of chunks
 */
function createOverlappingChunks(text: string): string[] {
	const lines = text.split("\n")
	const chunks: string[] = []
	let currentChunk: string[] = []
	let currentSize = 0

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ""
		const lineSize = line.length + 1 // +1 for newline

		if (currentSize + lineSize > CHUNK_SIZE && currentChunk.length > 0) {
			// Add current chunk
			chunks.push(currentChunk.join("\n"))

			// Start new chunk with a single overlap line from the previous chunk
			const overlapLines = 1 // Changed from 10% to 1 line
			// Move cursor back by one line to include the overlapping line in the next chunk
			i -= overlapLines
			currentChunk = []
			currentSize = 0
			continue
		}

		currentChunk.push(line)
		currentSize += lineSize
	}

	if (currentChunk.length > 0) {
		chunks.push(currentChunk.join("\n"))
	}

	return chunks
}

/**
 * Adds line numbers to each line in the chunk
 * @param chunk The text chunk
 * @param chunkIndex The index of the chunk
 * @returns Numbered chunk as a string
 */
function addLineNumbers(chunk: string): string {
	const lines = chunk.split("\n")
	const numberedChunk = lines
		.map((line, idx) => `${(idx + 1).toString().padStart(3, "0")}: ${line}`)
		.join("\n")
	return numberedChunk
}

/**
 * Sends the numbered chunk to the LLM and retrieves the XML response
 * @param numberedChunk The chunk with line numbers
 * @returns XML response as a string
 */
async function getLLMResponse(numberedChunk: string): Promise<string | null> {
	try {
		console.log(`Sending chunk of ${numberedChunk.length} characters to LLM...`)
		const response = await createCompletion(
			[
				{
					role: "system",
					content: gutenbergSystemPrompt
				},
				{
					role: "user",
					content: numberedChunk
				}
			],
			"deepseek/deepseek-chat"
		)

		if (!response.content) {
			console.log("Received null response from LLM")
			return null
		}
		console.log("Received valid response from LLM")
		return response.content.trim()
	} catch (error) {
		console.error(`Error while fetching LLM response: ${error}`)
		return null
	}
}

/**
 * Parses the XML response into JSON and validates the structure
 * @param xml The XML string
 * @returns Parsed and validated JSON object or null if parsing/validation fails
 */
function parseXmlToJson(xml: string): ParsedResponse | null {
	const parser = new XMLParser({
		ignoreAttributes: false,
		trimValues: true,
		parseTagValue: false
	})

	try {
		const parsed = parser.parse(xml)
		// Validate the parsed data against our schema
		const validated = ResponseSchema.parse(parsed)
		return validated
	} catch (e) {
		console.error(`Failed to parse or validate XML: ${e}`)
		return null
	}
}

/**
 * Extracts sections from the parsed JSON
 * @param parsedJson The parsed JSON object
 * @param totalLines The total number of lines processed before this chunk
 * @returns Array of Section objects
 */
function extractSections(
	parsedJson: ParsedResponse,
	totalLines: number
): Section[] {
	const allSections: Section[] = []
	const sectionsData = parsedJson.sections.section

	console.log(`Processing sections with totalLines offset: ${totalLines}`)

	const sectionsArray = Array.isArray(sectionsData)
		? sectionsData
		: [sectionsData]
	sectionsArray.forEach((sec, idx) => {
		const rawFirstLine = Number.parseInt(sec.firstLine, 10)
		const rawLastLine = Number.parseInt(sec.lastLine, 10)
		const adjustedFirstLine = rawFirstLine + totalLines
		const adjustedLastLine = rawLastLine + totalLines

		console.log(`Section ${idx + 1}:`)
		console.log(`  Raw lines: ${rawFirstLine}-${rawLastLine}`)
		console.log(`  Adjusted: ${adjustedFirstLine}-${adjustedLastLine}`)

		allSections.push({
			name: sec.name ?? undefined,
			firstLine: adjustedFirstLine,
			lastLine: adjustedLastLine
		})
	})

	return allSections
}

/**
 * Analyzes text content to extract chapters and sections
 * @param text The full text content
 * @returns Array of merged sections
 */
export async function extractTextSections(text: string): Promise<Section[]> {
	console.log(`Starting to process text of length: ${text.length} characters`)
	const chunks = createOverlappingChunks(text)
	console.log(`Split into ${chunks.length} chunks`)

	const numberedChunks = chunks.map((chunk) => addLineNumbers(chunk))
	const allSections: Section[] = []
	let totalLines = 0

	// Parallelize all LLM requests
	console.log("Sending parallel requests to LLM...")
	const responses = await Promise.all(
		numberedChunks.map(async (chunk, index) => {
			console.log(`Processing chunk ${index + 1}/${numberedChunks.length}...`)
			return getLLMResponse(chunk)
		})
	)
	console.log(
		`Received ${responses.filter((r) => r !== null).length} valid responses`
	)

	// Process responses in order
	for (let i = 0; i < numberedChunks.length; i++) {
		console.log(`\nProcessing response ${i + 1}/${numberedChunks.length}:`)
		const numberedChunk = numberedChunks[i]
		const xmlResponse = responses[i]
		if (!numberedChunk || !xmlResponse) {
			console.log(`Skipping chunk ${i + 1} - missing chunk or response`)
			continue
		}

		const parsedJson = parseXmlToJson(xmlResponse)
		if (!parsedJson) {
			console.log(`Failed to parse XML for chunk ${i + 1}`)
			continue
		}

		const lines = numberedChunk.split("\n")
		const lastLine = lines[lines.length - 1]!
		const match = lastLine.match(/^(\d+):/)
		if (!match || !match[1]) {
			console.error(`Failed to extract line number from last line: ${lastLine}`)
			throw new Error(
				`Failed to extract line number from last line: ${lastLine}`
			)
		}
		const lastLineNumber = Number.parseInt(match[1], 10)
		console.log(`Chunk ${i + 1} line numbers:`)
		console.log(`  First line: ${lines[0]?.match(/^(\d+):/)?.[1] ?? "unknown"}`)
		console.log(`  Last line: ${lastLineNumber}`)
		console.log(`  Current totalLines: ${totalLines}`)
		console.log(`  Next totalLines will be: ${totalLines + lastLineNumber}`)

		const sections = extractSections(parsedJson, totalLines)
		console.log(`Found ${sections.length} sections in chunk ${i + 1}`)

		// Peek at the first section
		const firstSection = sections[0]
		if (sections.length > 0 && firstSection && !firstSection.name) {
			console.log("Found unnamed first section, merging with previous section")
			const unnamedSection = sections.shift()
			if (unnamedSection && allSections.length > 0) {
				allSections[allSections.length - 1]!.lastLine = unnamedSection.lastLine
			}
		}

		allSections.push(...sections)
		totalLines += lastLineNumber
		console.log(`Total sections so far: ${allSections.length}`)
	}

	console.log(
		`\nProcessing complete. Found ${allSections.length} total sections`
	)
	return allSections
}
