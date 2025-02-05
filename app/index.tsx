import { Text, View, Pressable } from "react-native"
import { auth } from "@/lib/auth"
import { unstable_headers as headers } from "expo-router/rsc/headers"
import { Link } from "expo-router"
import React from "react"

export default async function Index() {
	const session = await auth.api.getSession({
		headers: await headers()
	})

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				gap: 12
			}}
		>
			{session ? (
				<Text>Welcome {session.user.name}</Text>
			) : (
				<React.Fragment>
					<Link href="/signin" asChild>
						<Pressable
							style={{
								backgroundColor: "#007AFF",
								paddingVertical: 12,
								paddingHorizontal: 24,
								borderRadius: 8
							}}
						>
							<Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
								Sign In
							</Text>
						</Pressable>
					</Link>
					<Link href="/signup" asChild>
						<Pressable
							style={{
								backgroundColor: "#0056b3",
								paddingVertical: 12,
								paddingHorizontal: 24,
								borderRadius: 8
							}}
						>
							<Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
								Sign Up
							</Text>
						</Pressable>
					</Link>
				</React.Fragment>
			)}
		</View>
	)
}
