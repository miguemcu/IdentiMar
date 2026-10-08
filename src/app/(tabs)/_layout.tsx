import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#475569",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#94A3B8",
          borderTopWidth: 0.5,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Nunito_600SemiBold",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{ ios: "house.fill", android: "home", web: "home" }}
              size={focused ? 26 : 24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="registros"
        options={{
          title: "Registros",
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: "list.bullet.clipboard.fill",
                android: "description",
                web: "description",
              }}
              size={focused ? 26 : 24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="especies"
        options={{
          title: "Especies",
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: "book.closed.fill",
                android: "menu_book",
                web: "menu_book",
              }}
              size={focused ? 26 : 24}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <SymbolView
              name={{
                ios: "person.circle.fill",
                android: "account_circle",
                web: "account_circle",
              }}
              size={focused ? 26 : 24}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
