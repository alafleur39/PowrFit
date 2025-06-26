// layout for tabs
// layout for tabs
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
} from "@react-navigation/material-top-tabs";
import {
  ParamListBase,
  TabNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>, // 👈 State comes 3rd
  MaterialTopTabNavigationEventMap   // 👈 Event map comes 4th
>(Navigator);

const Layout = () => {
  return (
    <MaterialTopTabs screenOptions={{tabBarActiveTintColor: '#000000',
      tabBarIndicatorStyle: {backgroundColor: '#000000', height: 3},
      tabBarLabelStyle: {fontSize:14,fontWeight:'bold',textTransform:'capitalize'}
    }}>
      <MaterialTopTabs.Screen name="index" options={{ title: "Home" }} />
      <MaterialTopTabs.Screen name="profile" options={{ title: "Profile" }} />
      <MaterialTopTabs.Screen name="workouts" options={{title: "Workouts"}} />
    </MaterialTopTabs>
  );
};

export default Layout
