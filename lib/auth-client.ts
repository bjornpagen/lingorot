"use client"

import { createAuthClient } from "better-auth/react"
import { expoClient } from "@better-auth/expo/client"
import * as SecureStore from "expo-secure-store"
import Constants from "expo-constants"

const manifest = Constants.expoConfig?.extra?.expoClient

const DEV_API_URL = manifest?.debuggerHost
	? `http://${manifest.debuggerHost.split(":").shift()}:8081`
	: "http://localhost:8081"

const getBaseURL = () => {
	if (typeof window === "undefined") {
		return DEV_API_URL
	}
	return `${window.location.protocol}//${window.location.host}`
}

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	plugins: [
		expoClient({
			scheme: "myapp",
			storagePrefix: "myapp",
			storage: SecureStore
		})
	]
})

globalThis.getCookie = authClient.getCookie

declare global {
	var getCookie: typeof authClient.getCookie
}
