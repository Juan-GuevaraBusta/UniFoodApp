import { Tabs } from "expo-router";
import { Settings, Eye, ClipboardList, Cog } from "lucide-react-native";

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
                name="edicionRestaurante"
                options={{
                    title: 'Editar Menú',
                    tabBarIcon: ({ color, size }) => (
                        <Settings color={color} size={size || 24} />
                    ),
                }}
            />

            <Tabs.Screen
                name="viewRestaurante"
                options={{
                    title: 'Vista Previa',
                    tabBarIcon: ({ color, size }) => (
                        <Eye color={color} size={size || 24} />
                    ),
                }}
            />

            <Tabs.Screen
                name="configRestaurante"
                options={{
                    title: 'Configuración',
                    tabBarIcon: ({ color, size }) => (
                        <Cog color={color} size={size || 24} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default RestaurantTabsLayout;