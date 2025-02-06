import "server-only"

import { auth } from "./auth"
import { unstable_headers as headers } from "expo-router/rsc/headers"

export async function getSession() {
	const reqHeaders = await headers()
	let session: Awaited<ReturnType<typeof auth.api.getSession>> | undefined
	try {
		session = await auth.api.getSession({
			headers: reqHeaders
		})
	} catch (error) {
		console.log(error)
	}
	return session
}
