/* eslint-disable prettier/prettier */
import { Text, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Store, LogOut, Settings, Mail, MapPin, Home } from "lucide-react-native";

const RestaurantProfile = () => {
    const { user, cerrarSesion } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleCerrarSesion = async () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Cerrar sesión",
                    onPress: async () => {
                        setIsLoading(true);

                        try {
                            const result = await cerrarSesion();

                            if (result.success) {
                                Alert.alert(
                                    "Sesión cerrada",
                                    "Has cerrado sesión exitosamente",
                                    [
                                        {
                                            text: "OK",
                                            onPress: () => router.replace("/(auth)/bienvenido")
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert("Error", result.error || "No se pudo cerrar la sesión");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Ocurrió un error inesperado");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (!user?.restaurantInfo) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 text-lg">Cargando información...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-5 py-8">
                {/* Header del restaurante */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 bg-[#132e3c] rounded-full items-center justify-center mb-4">
                        <Store size={40} color="white" />
                    </View>
                    <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center">
                        {user.restaurantInfo.nombreRestaurante}
                    </Text>
                    <Text className="text-gray-600 text-base font-JakartaMedium text-center mt-2">
                        Restaurante Partner de UniFood
                    </Text>

                    {/* Indicador de estado */}
                    <View className="bg-green-100 px-3 py-1 rounded-full mt-3">
                        <Text className="text-green-700 font-JakartaBold text-sm">
                            ✓ Cuenta verificada
                        </Text>
                    </View>
                </View>

                {/* Información del restaurante */}
                <View className="space-y-4 mb-8">
                    {/* Información de contacto */}
                    <View className="bg-gray-50 rounded-xl p-4">
                        <View className="flex-row items-center mb-3">
                            <Mail size={20} color="#132e3c" />
                            <Text className="text-[#132e3c] font-JakartaBold text-base ml-3">
                                Información de contacto
                            </Text>
                        </View>
                        <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
                            Email: {user.email}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">
                            ID del restaurante: #{user.restaurantInfo.restauranteId}
                        </Text>
                    </View>

                    {/* Ubicación */}
                    <View className="bg-gray-50 rounded-xl p-4">
                        <View className="flex-row items-center mb-3">
                            <MapPin size={20} color="#132e3c" />
                            <Text className="text-[#132e3c] font-JakartaBold text-base ml-3">
                                Ubicación
                            </Text>
                        </View>
                        <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
                            Universidad: {user.restaurantInfo.nombreUniversidad}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">
                            Campus ID: #{user.restaurantInfo.universidadId}
                        </Text>
                    </View>

                    {/* Opciones de configuración */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/configRestaurante")}
                        className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center"
                    >
                        <Settings size={20} color="#132e3c" />
                        <Text className="text-[#132e3c] font-JakartaBold text-base ml-3 flex-1">
                            Configuración del Restaurante
                        </Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>
                </View>

                {/* Navegación rápida */}
                <View className="mb-8">
                    <Text className="text-[#132e3c] font-JakartaBold text-base mb-3">
                        Acceso rápido
                    </Text>

                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3"
                    >
                        <View className="flex-row items-center">
                            <Home size={20} color="#3B82F6" />
                            <Text className="text-blue-800 font-JakartaBold text-base ml-3">
                                Ir al Panel Principal
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Información de la app */}
                <View className="bg-gray-50 rounded-xl p-4 mb-8">
                    <Text className="text-[#132e3c] font-JakartaBold text-base mb-3">
                        UniFood Restaurant Panel
                    </Text>
                    <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
                        Versión: 1.0.0
                    </Text>
                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                        Desarrollado por NeoDigital
                    </Text>
                </View>

                {/* Botón de cerrar sesión */}
                <TouchableOpacity
                    onPress={handleCerrarSesion}
                    disabled={isLoading}
                    className={`py-4 rounded-xl flex-row items-center justify-center ${isLoading ? 'bg-gray-300' : 'bg-red-500'
                        }`}
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <LogOut size={20} color="white" />
                    )}
                    <Text className="text-white font-JakartaBold text-lg ml-3">
                        {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                    </Text>
                </TouchableOpacity>

                {/* Espaciado inferior */}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default RestaurantProfile;