import SignInForm from "@/components/SignInForm"
import { View } from "react-native"

const styles = {
	container: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const
	}
}

export default function SignIn() {
	return (
		<View style={styles.container}>
			<SignInForm />
		</View>
	)
}
