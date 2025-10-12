import { useState } from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useAuth } from "../src/auth/AuthProvider";

type FormState = {
  email: string;
  password: string;
};

export default function Login() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [submittingAction, setSubmittingAction] = useState<"signIn" | "signUp" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  // Keep input state in sync as the user types.
  const updateField = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const emailRegex = /\S+@\S+\.\S+/;

  const mapFirebaseError = (code: string | undefined): string => {
    switch (code) {
      case "auth/email-already-in-use":
        return "That email is already registered. Try signing in instead.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Incorrect email or password. Please try again.";
      case "auth/user-not-found":
        return "We couldn’t find an account with that email.";
      case "auth/weak-password":
        return "Choose a stronger password (at least 6 characters).";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleAuth = async (action: "signIn" | "signUp") => {
    const email = form.email.trim();
    const password = form.password;

    // Quick checks that stop empty or invalid submissions.
    if (!email || !password) {
      setError("Enter both email and password to continue.");
      return;
    }

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setSubmittingAction(action);

    try {
      // Use the shared auth helpers so the provider updates everywhere.
      if (action === "signIn") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      console.log(
        `[Auth] ${action === "signIn" ? "Sign in" : "Sign up"} success → navigating to profile`
      );
      router.replace("/(tabs)/profile");
    } catch (err) {
      // Show a friendly error message the user can understand.
      const message =
        typeof err === "object" && err !== null && "code" in err
          ? mapFirebaseError((err as { code?: string }).code)
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{ uri: "https://em-content.zobj.net/thumbs/120/apple/354/high-voltage_26a1.png" }}
            style={styles.headerImg}
          />
          <Text style={styles.title}>Sign into PowrFit</Text>
          <Text style={styles.subtitle}>This is where fitness journeys start.</Text>
        </View>

        <View style={styles.form}>
          {/* Collect the email with keyboard tweaks that make typing easier. */}
          <TextInput
            label="Email address"
            value={form.email}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            onChangeText={updateField("email")}
            mode="outlined"
            style={styles.paperInput}
            inputMode="email"
            disabled={submittingAction !== null}
          />

          <TextInput
            label="Password"
            value={form.password}
            onChangeText={updateField("password")}
            secureTextEntry
            mode="outlined"
            style={styles.paperInput}
            disabled={submittingAction !== null}
          />

          <HelperText type="error" visible={Boolean(error)}>
            {error}
          </HelperText>

          {/* Present both paths so users can log in or make a fresh account. */}
          <Button
            mode="contained"
            onPress={() => handleAuth("signIn")}
            loading={submittingAction === "signIn"}
            disabled={submittingAction !== null}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleAuth("signUp")}
            loading={submittingAction === "signUp"}
            disabled={submittingAction !== null}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
            textColor="#075eec"
          >
            Create Account
          </Button>
        </View>

        <Text style={styles.footerNote}>
          Creating an account will sync your workouts and progress securely with PowrFit.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginVertical: 36,
    alignItems: "center",
    gap: 16,
  },
  headerImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
  },
  form: {
    flex: 1,
    gap: 16,
  },
  paperInput: {
    backgroundColor: "white",
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  secondaryButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footerNote: {
    marginTop: "auto",
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
  },
});
