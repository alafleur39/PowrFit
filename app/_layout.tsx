import { Stack } from 'expo-router';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

const Layout = () => {
  return (
    <GestureHandlerRootView>
    <Stack screenOptions={{headerShadowVisible: false}}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerTitle: () => ( // we will make the lightning emoji the main logo for now
            <Image
              source={{
                uri: 'https://em-content.zobj.net/thumbs/120/apple/354/high-voltage_26a1.png',
              }}
              style={{ width: 30, height: 30, borderRadius: 20 }}
            />
          ),
          headerRight: () => <Ionicons name= "settings-outline" size={24} color = "Black" />
        }}
      />
      <Stack.Screen name="details" options={{headerTitle: 'Details', headerBackTitle:'Back'}}/>
    </Stack>
    </GestureHandlerRootView>
  );
};

export default Layout;

