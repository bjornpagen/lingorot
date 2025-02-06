"use client"

import { Redirect as ExpoRedirect } from "expo-router"

export function Redirect({ href }: Parameters<typeof ExpoRedirect>[0]) {
	return <ExpoRedirect href={href} />
}
