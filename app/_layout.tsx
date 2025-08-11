import { Stack } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack screenOptions={{ headerShadowVisible: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerTitle: () => (
              <Image
                source={{ uri: 'https://em-content.zobj.net/thumbs/120/apple/354/high-voltage_26a1.png' }}
                style={{ width: 30, height: 30, borderRadius: 20 }}
              />
            ),
            headerRight: () => (
              <Ionicons name="settings-outline" size={24} color="black" />
            ),
          }}
        />
        <Stack.Screen
          name="details"
          options={{ headerTitle: 'Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="login"
          options={{ headerTitle: 'Sign In' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
