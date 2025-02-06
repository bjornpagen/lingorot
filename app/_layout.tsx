import { AuthClient } from "@/components/AuthClient"
import React from "react"

export default function RootLayout({
	children
}: { children: React.ReactNode }) {
	return (
		<React.Fragment>
			<AuthClient />
			{children}
		</React.Fragment>
	)
}
