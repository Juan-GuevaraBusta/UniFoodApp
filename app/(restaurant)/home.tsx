/* eslint-disable prettier/prettier */
// app/(restaurant)/home.tsx - Versión final limpia
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRestaurantes } from "@/hooks/useRestaurantes";

const RestaurantHome = () => {
    const { user, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);

    // Verificar sesión al cargar el componente
    useEffect(() => {
        verificarSesion();
    }, []);

    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            // Pequeño delay para asegurar que los datos estén completamente cargados
            const timer = setTimeout(() => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);
            }, 100); // 100ms es suficiente

            return () => clearTimeout(timer);
        }
    }, [user]);

    if (!user?.restaurantInfo?.restauranteId || !restauranteData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center px-8">
                    <Text className="text-2xl mb-4">🔄</Text>
                    <Text className="text-xl text-center mb-2">
                        Cargando información del restaurante...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const restaurantInfo = user.restaurantInfo;

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            {/* Header simple */}
            <View className="bg-white px-5 py-8">
                <Text className="text-2xl font-bold text-center">
                    Admin: {restaurantInfo.nombreRestaurante}
                </Text>
                <Text className="text-base text-center text-gray-600 mt-2">
                    {restaurantInfo.nombreUniversidad}
                </Text>
            </View>

            <ScrollView className="flex-1 px-5 py-8">
                {/* Botones principales */}
                <View className="space-y-4">

                    {/* Botón 1: Nuestro menú */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/edicionRestaurante")}
                        className="bg-blue-500 rounded-xl p-6"
                    >
                        <Text className="text-white text-lg font-bold text-center">
                            📋 Nuestro menú
                        </Text>
                    </TouchableOpacity>

                    {/* Botón 2: Perfil */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/profile")}
                        className="bg-green-500 rounded-xl p-6"
                    >
                        <Text className="text-white text-lg font-bold text-center">
                            👤 Perfil
                        </Text>
                    </TouchableOpacity>

                    {/* Botón 3: Pedidos realizados */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/pedidos")}
                        className="bg-red-500 rounded-xl p-6"
                    >
                        <Text className="text-white text-lg font-bold text-center">
                            📄 Pedidos realizados
                        </Text>
                    </TouchableOpacity>

                    {/* Botón 4: Vista del restaurante */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/viewRestaurante")}
                        className="bg-purple-500 rounded-xl p-6"
                    >
                        <Text className="text-white text-lg font-bold text-center">
                            👁️ Vista del restaurante
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* Tabs inferiores simples */}
            <View className="bg-blue-800 flex-row justify-around py-4">
                <TouchableOpacity
                    onPress={() => router.push("/(restaurant)/(tabs)/edicionRestaurante")}
                    className="items-center flex-1"
                >
                    <Text className="text-white text-sm">
                        ✏️ Edición
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/(restaurant)/(tabs)/viewRestaurante")}
                    className="items-center flex-1"
                >
                    <Text className="text-white text-sm">
                        👁️ Vista
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/(restaurant)/pedidos")}
                    className="items-center flex-1"
                >
                    <Text className="text-white text-sm">
                        🚚 Pedidos
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default RestaurantHome;