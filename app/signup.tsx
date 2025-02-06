import SignUpForm from "@/components/SignUpForm"
import { View } from "react-native"

const styles = {
	container: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const
	}
}

export default function SignUp() {
	return (
		<View style={styles.container}>
			<SignUpForm />
		</View>
	)
}
