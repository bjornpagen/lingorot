import "server-only"

import { auth } from "./auth"
import { unstable_headers as headers } from "expo-router/rsc/headers"

export async function getSession() {
	const reqHeaders = await headers()
	return auth.api.getSession({
		headers: reqHeaders
	})
}
