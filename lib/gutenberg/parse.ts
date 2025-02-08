/**
 * Helper function to strip text before and including the first occurrence of a marker line
 */
function stripBefore(text: string, marker: string): string {
	const pos = text.indexOf(marker) // First occurrence
	if (pos !== -1) {
		const lineEnd = text.indexOf("***", pos + marker.length) + 3
		return text.slice(lineEnd)
	}
	return text
}

/**
 * Helper function to strip text after and including the last occurrence of a marker line
 */
function stripAfter(text: string, marker: string): string {
	const pos = text.lastIndexOf(marker) // Last occurrence
	if (pos !== -1) {
		return text.slice(0, pos)
	}
	return text
}

/**
 * Strips both the Project Gutenberg header and footer from a text file.
 */
export function stripGutenbergText(text: string): string {
	const startMarker = "*** START OF THE PROJECT GUTENBERG EBOOK"
	const endMarker = "*** END OF THE PROJECT GUTENBERG EBOOK"

	// First strip the header and footer
	const strippedText = stripAfter(
		stripBefore(text, startMarker),
		endMarker
	).trim()

	return strippedText.replace(/\r\n/g, "\n") // Convert DOS to Unix line endings
}
