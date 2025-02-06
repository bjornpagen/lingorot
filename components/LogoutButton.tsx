"use client"

import React from "react"
import { Pressable, Text } from "react-native"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "expo-router"

export default function LogoutButton() {
	const router = useRouter()

	const handleLogout = React.useCallback(async () => {
		await authClient.signOut()
		router.replace("/signin")
	}, [router])

	return (
		<Pressable
			onPress={handleLogout}
			style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
		>
			<Text style={styles.text}>Sign Out</Text>
		</Pressable>
	)
}

const styles = {
	button: {
		backgroundColor: "#f44336",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: "center" as const,
		justifyContent: "center" as const
	},
	buttonPressed: {
		opacity: 0.8
	},
	text: {
		color: "white",
		fontSize: 16,
		fontWeight: "600" as const
	}
} as const
