import { Stack } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider, ActivityIndicator } from "react-native-paper";
import { AuthProvider, useAuth } from "../src/auth/AuthProvider";

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    // Keep the UI clean while Firebase restores any saved session.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerTitle: () => (
            <Image
              source={{ uri: "https://em-content.zobj.net/thumbs/120/apple/354/high-voltage_26a1.png" }}
              style={{ width: 30, height: 30, borderRadius: 20 }}
            />
          ),
          headerRight: () => <Ionicons name="settings-outline" size={24} color="black" />,
        }}
      />
      <Stack.Screen name="details" options={{ headerTitle: "Details", headerBackTitle: "Back" }} />
      <Stack.Screen name="Login" options={{ headerTitle: "Sign In" }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider>
        <AuthProvider>
          {/* Every screen in the app can now read auth state and Paper theme. */}
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
});
