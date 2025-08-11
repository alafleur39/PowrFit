// app/login.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  return (
    <View style={{ flex:1, backgroundColor:"#fff", padding:20, justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:"600", marginBottom:8 }}>Sign in to PowrFit</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={pw}
        onChangeText={setPw}
        style={{ borderWidth:1, borderColor:"#ddd", padding:12, borderRadius:10 }}
      />

      <Pressable onPress={() => router.replace("/(tabs)")} style={{ backgroundColor:"#000", padding:14, borderRadius:10 }}>
        <Text style={{ color:"#fff", textAlign:"center", fontWeight:"600" }}>Continue</Text>
      </Pressable>
    </View>
  );
}
