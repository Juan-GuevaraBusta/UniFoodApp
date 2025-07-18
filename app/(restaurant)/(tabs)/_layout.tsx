import { Tabs } from "expo-router";
import { Home, User } from "lucide-react-native";

const RestaurantTabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#FFFFFF',
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
                headerShown: false
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Home color={color} size={size || 24} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <User color={color} size={size || 24} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default RestaurantTabsLayout;