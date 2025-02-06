"use client"

import React from "react"
import { View, Animated, Easing } from "react-native"

export default function PageSpinner() {
	const rotation = React.useRef(new Animated.Value(0)).current
	const opacity = React.useRef(new Animated.Value(0)).current

	React.useEffect(() => {
		Animated.parallel([
			Animated.loop(
				Animated.timing(rotation, {
					toValue: 1,
					duration: 1500,
					easing: Easing.bezier(0.4, 0.0, 0.2, 1),
					useNativeDriver: true
				})
			),
			Animated.timing(opacity, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true
			})
		]).start()
	}, [rotation, opacity])

	const spin = rotation.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "360deg"]
	})

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.spinnerOuter,
					{
						opacity,
						transform: [{ rotate: spin }]
					}
				]}
			>
				<View style={styles.spinnerInner} />
			</Animated.View>
		</View>
	)
}

const styles = {
	container: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		minHeight: 200
	},
	spinnerOuter: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 4,
		borderColor: "#E2E8F0",
		borderTopColor: "#3B82F6",
		borderLeftColor: "#3B82F6"
	},
	spinnerInner: {
		position: "absolute" as const,
		top: -8,
		left: -8,
		right: -8,
		bottom: -8,
		borderRadius: 28,
		borderWidth: 4,
		borderColor: "transparent",
		borderTopColor: "#60A5FA",
		borderLeftColor: "#60A5FA",
		opacity: 0.4
	}
}
