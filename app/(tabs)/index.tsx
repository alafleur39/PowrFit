import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Home() {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"#fff", gap:12 }}>
      <Text style={{ fontSize:20 }}>🏋️ Welcome to PowrFit</Text>
      <Pressable onPress={() => router.push("/Login")} style={{ padding:12, backgroundColor:"#eee", borderRadius:8 }}>
        <Text>Go to Login</Text>
      </Pressable>
    </View>
  );
}
