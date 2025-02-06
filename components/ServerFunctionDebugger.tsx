"use client"

import React from "react"
import { Text, View } from "react-native"
import { testServerHeaders } from "@/functions/headers"

const styles = {
	container: {
		marginTop: 20
	},
	text: {
		...(process.env.EXPO_OS === "web"
			? { whiteSpace: "pre-wrap" as const }
			: {}),
		fontFamily: "monospace"
	}
}

export function ServerFunctionDebugger() {
	const [headerContents, setHeaderContents] = React.useState<string>("")

	React.useEffect(() => {
		testServerHeaders().then((headers) => {
			setHeaderContents(headers)
		})
	}, [])

	return (
		<View style={styles.container}>
			<Text style={styles.text}>
				Server Function Headers:\n{headerContents}
			</Text>
		</View>
	)
}
