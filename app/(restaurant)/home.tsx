/* eslint-disable prettier/prettier */
// app/(restaurant)/home.tsx - Home principal del restaurante
import { Text, View, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRestaurantes } from "@/hooks/useRestaurantes";
import { Settings, Eye, ClipboardList, User, Bell, TrendingUp, Clock, Users, Cog } from "lucide-react-native";

const RestaurantHome = () => {
    const { user } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);

    useEffect(() => {
        if (user?.restaurantInfo) {
            const restaurante = obtenerRestaurantePorId(user.restaurantInfo.restauranteId);
            setRestauranteData(restaurante);
        }
    }, [user]);

    if (!user?.restaurantInfo || !restauranteData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center px-8">
                    <Text className="text-gray-400 text-6xl mb-4">🍽️</Text>
                    <Text className="text-[#132e3c] text-xl font-JakartaBold text-center mb-2">
                        Cargando información del restaurante...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const restaurantInfo = user.restaurantInfo;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header con imagen de fondo del restaurante */}
                <View className="relative w-full pt-8 pb-6 px-5">
                    {/* Imagen de fondo */}
                    <View className="absolute inset-0">
                        <Image
                            source={restauranteData.imagen}
                            className="w-full h-full"
                            resizeMode="cover"
                            style={{
                                opacity: 0.3,
                                borderBottomLeftRadius: 30,
                                borderBottomRightRadius: 30
                            }}
                        />
                    </View>

                    {/* Contenido del header */}
                    <View className="relative z-10">
                        {/* Botón de perfil */}
                        <View className="flex-row justify-end mb-4">
                            <TouchableOpacity
                                onPress={() => router.push("/(restaurant)/profile")}
                                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                            >
                                <User size={20} color="#132e3c" />
                            </TouchableOpacity>
                        </View>

                        {/* Información del restaurante */}
                        <View className="items-center mb-6">
                            <Text className="text-[#132e3c] font-JakartaExtraBold text-4xl text-center mb-2">
                                {restaurantInfo.nombreRestaurante}
                            </Text>
                            <Text className="text-[#132e3c] font-JakartaMedium text-lg text-center opacity-80">
                                {restaurantInfo.nombreUniversidad}
                            </Text>
                        </View>

                        {/* Información rápida */}
                        <View
                            className="bg-[#132e3c] px-6 py-4 rounded-2xl mx-4"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <View className="flex-row justify-between">
                                <View className="items-center">
                                    <Text className="text-white text-sm font-JakartaBold mb-1">
                                        Calificación
                                    </Text>
                                    <View className="flex-row items-center">
                                        <TrendingUp size={16} color="#FFFFFF" />
                                        <Text className="text-white text-lg font-JakartaLight ml-2">
                                            {restauranteData.calificacionRestaurante}
                                        </Text>
                                    </View>
                                </View>

                                <View className="items-center">
                                    <Text className="text-white text-sm font-JakartaBold mb-1">
                                        Tiempo entrega
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Clock size={16} color="#FFFFFF" />
                                        <Text className="text-white text-lg font-JakartaLight ml-2">
                                            {restauranteData.tiempoEntrega} min
                                        </Text>
                                    </View>
                                </View>

                                <View className="items-center">
                                    <Text className="text-white text-sm font-JakartaBold mb-1">
                                        Platos
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Users size={16} color="#FFFFFF" />
                                        <Text className="text-white text-lg font-JakartaLight ml-2">
                                            {restauranteData.menu.length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menú de navegación principal */}
                <View className="px-5 py-6">
                    <Text className="text-[#132e3c] text-2xl font-JakartaBold mb-6 text-center">
                        Panel de Control
                    </Text>

                    {/* Grid de navegación - 2x3 */}
                    <View className="space-y-6">

                        {/* Fila 1: Nuestro Menú y Perfil */}
                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={() => router.push("/(restaurant)/(tabs)/edicionRestaurante")}
                                className="flex-1 bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-blue-200 rounded-3xl p-8"
                                style={{
                                    shadowColor: '#3B82F6',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                <View className="items-center">
                                    <View className="w-16 h-16 bg-blue-500 rounded-2xl items-center justify-center mb-4">
                                        <Settings size={32} color="white" />
                                    </View>
                                    <Text className="text-blue-800 font-JakartaExtraBold text-lg text-center">
                                        Nuestro menú
                                    </Text>
                                    <Text className="text-blue-600 font-JakartaMedium text-sm text-center mt-2">
                                        Editar platos y precios
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/(restaurant)/profile")}
                                className="flex-1 bg-gradient-to-b from-purple-50 to-purple-100 border-2 border-purple-200 rounded-3xl p-8"
                                style={{
                                    shadowColor: '#8B5CF6',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                <View className="items-center">
                                    <View className="w-16 h-16 bg-purple-500 rounded-2xl items-center justify-center mb-4">
                                        <User size={32} color="white" />
                                    </View>
                                    <Text className="text-purple-800 font-JakartaExtraBold text-lg text-center">
                                        Perfil
                                    </Text>
                                    <Text className="text-purple-600 font-JakartaMedium text-sm text-center mt-2">
                                        Mi cuenta
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Fila 2: Pedidos realizados (grande) */}
                        <TouchableOpacity
                            onPress={() => router.push("/(restaurant)/pedidos")}
                            className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-3xl p-8"
                            style={{
                                shadowColor: '#F97316',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.25,
                                shadowRadius: 10,
                                elevation: 10,
                            }}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl items-center justify-center mr-6">
                                        <ClipboardList size={40} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-orange-800 font-JakartaExtraBold text-2xl mb-2">
                                            Pedidos realizados
                                        </Text>
                                        <Text className="text-orange-600 font-JakartaMedium text-base">
                                            Gestionar órdenes activas
                                        </Text>
                                    </View>
                                </View>

                                {/* Badge de notificación */}
                                <View className="bg-red-500 rounded-full w-12 h-12 items-center justify-center">
                                    <Text className="text-white font-JakartaExtraBold text-lg">3</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Fila 3: Visualización y Edición */}
                        <View className="flex-row space-x-4">
                            <TouchableOpacity
                                onPress={() => router.push("/(restaurant)/(tabs)/viewRestaurante")}
                                className="flex-1 bg-gradient-to-b from-green-50 to-green-100 border-2 border-green-200 rounded-3xl p-8"
                                style={{
                                    shadowColor: '#10B981',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                <View className="items-center">
                                    <View className="w-16 h-16 bg-green-500 rounded-2xl items-center justify-center mb-4">
                                        <Eye size={32} color="white" />
                                    </View>
                                    <Text className="text-green-800 font-JakartaExtraBold text-lg text-center">
                                        Visualización del restaurante
                                    </Text>
                                    <Text className="text-green-600 font-JakartaMedium text-sm text-center mt-2">
                                        Vista previa
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/(restaurant)/(tabs)/configRestaurante")}
                                className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-gray-200 rounded-3xl p-8"
                                style={{
                                    shadowColor: '#6B7280',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                <View className="items-center">
                                    <View className="w-16 h-16 bg-gray-500 rounded-2xl items-center justify-center mb-4">
                                        <Cog size={32} color="white" />
                                    </View>
                                    <Text className="text-gray-800 font-JakartaExtraBold text-lg text-center">
                                        Edición
                                    </Text>
                                    <Text className="text-gray-600 font-JakartaMedium text-sm text-center mt-2">
                                        Configuración
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Fila 4: Pedidos activos (acceso directo) */}
                        <TouchableOpacity
                            onPress={() => router.push("/(restaurant)/(tabs)/edicionRestaurante")}
                            className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-3xl p-6"
                            style={{
                                shadowColor: '#6366F1',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <View className="flex-row items-center justify-center">
                                <View className="w-12 h-12 bg-indigo-500 rounded-xl items-center justify-center mr-4">
                                    <ClipboardList size={24} color="white" />
                                </View>
                                <Text className="text-indigo-800 font-JakartaExtraBold text-xl">
                                    Pedidos activos
                                </Text>
                            </View>
                        </TouchableOpacity>

                    </View>

                    {/* Espaciado inferior */}
                    <View className="h-8" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default RestaurantHome;