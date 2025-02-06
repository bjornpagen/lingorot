"use client"

import React from "react"
import { Text, View } from "react-native"
import { authClient } from "@/lib/auth-client"

const styles = {
	container: {
		marginTop: 20
	},
	text: {
		fontFamily: "monospace"
	}
}

export function AuthDebugger() {
	const [storeContents, setStoreContents] = React.useState<
		Record<string, string>
	>({})

	React.useEffect(() => {
		const cookies =
			process.env.EXPO_OS === "web"
				? "httpOnly - not accessible from client"
				: authClient.getCookie()

		setStoreContents({
			cookies: cookies || "none"
		})
	}, [])

	return (
		<View style={styles.container}>
			<Text style={styles.text}>
				SecureStore Contents:{"\n"}
				{Object.entries(storeContents)
					.map(([key, value]) => `${key}: ${value}`)
					.join("\n")}
			</Text>
		</View>
	)
}
