import { Text, View, Pressable } from "react-native"
import { auth } from "@/lib/auth"
import { unstable_headers as headers } from "expo-router/rsc/headers"
import { Link } from "expo-router"
import React from "react"
import { AuthDebugger } from "@/components/AuthDebugger"
import { ServerFunctionDebugger } from "@/components/ServerFunctionDebugger"

function spewHeaders(headers: Headers): string {
	const entries = Array.from(headers.entries())
	return entries.map(([key, value]) => `${key}: ${value}`).join("\n")
}

const styles = {
	container: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		gap: 12,
		maxWidth: "100%" as const,
		padding: 16
	},
	headerText: {
		...(process.env.EXPO_OS === "web"
			? { whiteSpace: "pre-wrap" as const }
			: {}),
		fontFamily: "monospace",
		maxWidth: 800
	},
	signInButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8
	},
	signUpButton: {
		backgroundColor: "#0056b3",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600" as const
	}
}

export default async function Index() {
	const reqHeaders = await headers()
	const session = await auth.api.getSession({
		headers: reqHeaders
	})

	return (
		<View style={styles.container}>
			<Text style={styles.headerText}>
				Page Headers:\n{spewHeaders(reqHeaders)}
			</Text>
			<ServerFunctionDebugger />
			<AuthDebugger />
			{session ? (
				<Text>Welcome {session.user.name}</Text>
			) : (
				<React.Fragment>
					<Link href="/signin" asChild>
						<Pressable style={styles.signInButton}>
							<Text style={styles.buttonText}>Sign In</Text>
						</Pressable>
					</Link>
					<Link href="/signup" asChild>
						<Pressable style={styles.signUpButton}>
							<Text style={styles.buttonText}>Sign Up</Text>
						</Pressable>
					</Link>
				</React.Fragment>
			)}
		</View>
	)
}
