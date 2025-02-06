"use client"

import "@/lib/auth-client"
import { useRouter } from "expo-router"
import * as React from "react"

export function AuthClient() {
	const router = useRouter()

	React.useEffect(() => {
		if (process.env.EXPO_OS !== "web" && !globalThis.hasRefreshed) {
			globalThis.hasRefreshed = true
			router.reload()
		}
	}, [router])

	return null
}

declare global {
	var hasRefreshed: boolean
}
