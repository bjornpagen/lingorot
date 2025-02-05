"use client"

import * as React from "react"
import { View, TextInput, Button } from "react-native"
import { authClient } from "@/lib/auth-client"

export default function SignInForm() {
	const [email, setEmail] = React.useState("")
	const [password, setPassword] = React.useState("")

	const handleLogin = async () => {
		await authClient.signIn.email({
			email,
			password
		})
	}

	return (
		<View style={{ width: "100%", maxWidth: 400, padding: 16, gap: 12 }}>
			<TextInput placeholder="Email" value={email} onChangeText={setEmail} />
			<TextInput
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
			/>
			<Button title="Sign In" onPress={handleLogin} />
		</View>
	)
}
