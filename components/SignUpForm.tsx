"use client"

import * as React from "react"
import { View, TextInput, Text, Pressable } from "react-native"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "expo-router"

const styles = {
	container: {
		width: "100%" as const,
		maxWidth: 400,
		padding: 16,
		gap: 12
	},
	input: {
		backgroundColor: "white",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#e2e8f0"
	},
	button: {
		backgroundColor: "#007AFF",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: "center" as const
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600" as const
	}
}

export default function SignUpForm() {
	const [email, setEmail] = React.useState("")
	const [name, setName] = React.useState("")
	const [password, setPassword] = React.useState("")
	const router = useRouter()

	const handleLogin = async () => {
		const res = await authClient.signUp.email({
			email,
			password,
			name
		})
		if (res.error) {
			console.error(res.error)
		} else {
			router.replace("/")
		}
	}

	return (
		<View style={styles.container}>
			<TextInput
				style={styles.input}
				placeholder="Name"
				value={name}
				onChangeText={setName}
			/>
			<TextInput
				style={styles.input}
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<Pressable style={styles.button} onPress={handleLogin}>
				<Text style={styles.buttonText}>Sign Up</Text>
			</Pressable>
			<Pressable onPress={() => router.push("/signin")}>
				<Text>Already have an account? Sign in</Text>
			</Pressable>
		</View>
	)
}
