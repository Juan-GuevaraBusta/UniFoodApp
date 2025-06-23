import { Stack, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { Home, Clock, User } from "lucide-react-native"

const Layout = () => {
  return (
    <Tabs
        screenOptions = {{
              tabBarActiveTintColor: '#132e3c',
              tabBarInactiveTintColor: '#132e3c',
              tabBarStyle: {
                  backgroundColor: '#132e3c',
                  borderTopWidth: 1,
                  height: 88,
                  paddingBottom: 8,
                  paddingTop: 8,
                  borderTopLeftRadius: 25,
                  borderTopRightRadius: 25,
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: -2,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 10,
              },
              headerShown:false
        }}
        >
            <Tabs.Screen 
                name="menuPrincipal"
                options={{
                    title: 'Menú Principal',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, color }}>👤</Text>
                        </View>
                    ),
                    }}
            />
          <Tabs.Screen
              name="menuPrincipal"
              options={{
                  title: 'Menú Principal',
                  tabBarIcon: ({ color, focused }) => (
                      <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 20, color }}>🍽️</Text>
                      </View>
                  ),
              }}
          />
          <Tabs.Screen
              name="menuPrincipal"
              options={{
                  title: 'Menú Principal',
                  tabBarIcon: ({ color, focused }) => (
                      <View style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 20, color }}>🍽️</Text>
                      </View>
                  ),
              }}
          />
        </Tabs>
  );
};

export default Layout;