"use client"

import * as React from "react"
import { View, TextInput, Button } from "react-native"
import { authClient } from "@/lib/auth-client"

export default function SignUpForm() {
	const [email, setEmail] = React.useState("")
	const [name, setName] = React.useState("")
	const [password, setPassword] = React.useState("")

	const handleLogin = async () => {
		await authClient.signUp.email({
			email,
			password,
			name
		})
	}

	return (
		<View style={{ width: "100%", maxWidth: 400, padding: 16, gap: 12 }}>
			<TextInput placeholder="Name" value={name} onChangeText={setName} />
			<TextInput placeholder="Email" value={email} onChangeText={setEmail} />
			<TextInput
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
			/>
			<Button title="Sign Up" onPress={handleLogin} />
		</View>
	)
}
