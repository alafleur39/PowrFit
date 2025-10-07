// this IS THE APP TSX FROM REACTIIVE VIDEO 
// this is where i implemented the bottom sheet to get it to work
import { useCallback, useRef } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native-paper";
import {
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetRefProps } from "../../components/BottomSheet";
import { useAuth } from "../../src/auth/AuthProvider";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);
const ref = useRef<BottomSheetRefProps>(null)
const onPress = useCallback(()=>{
  const isActive = ref?.current?.isActive();
  if (isActive) {
    ref?.current?.scrollTo(0);
  } else{
     ref?.current?.scrollTo(-200);
  }

},[]);

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator animating color="#2563EB" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/Login" />;
  }

  return (
    
    <View style={styles.container}>
      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: "#000",
          tabBarIndicatorStyle: { backgroundColor: "#000", height: 3 },
          tabBarLabelStyle: { fontSize: 14, fontWeight: "bold", textTransform: "capitalize" },
        }}
      >
        <MaterialTopTabs.Screen name="index" options={{ title: "Home" }} />
        <MaterialTopTabs.Screen name="profile" options={{ title: "Profile" }} />
        <MaterialTopTabs.Screen name="workouts" options={{ title: "Workouts" }} />
      </MaterialTopTabs>

      {/* Always render BottomSheet here so it overlays everything */}
      <TouchableOpacity style={styles.button} onPress={onPress} />
      <BottomSheet ref={ref} >
        <View style= {{flex: 1, backgroundColor: 'orange'}} />
      </BottomSheet>
    </View>
  );
};

export default Layout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  button: {
    height: 60,
    aspectRatio: 1,
    backgroundColor: 'white',
    opacity: 0.6,

  }

});
