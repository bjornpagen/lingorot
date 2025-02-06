"use server"

import { unstable_headers as headers } from "expo-router/rsc/headers"

function spewHeaders(headers: Headers): string {
	const entries = Array.from(headers.entries())
	return entries.map(([key, value]) => `${key}: ${value}`).join("\n")
}

export async function testServerHeaders() {
	const reqHeaders = await headers()
	return spewHeaders(reqHeaders)
}
