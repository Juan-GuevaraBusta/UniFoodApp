/* eslint-disable prettier/prettier */
import { Text, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantes } from "@/hooks/useRestaurantes";
import { useState, useEffect } from "react";
import { Store, LogOut, Settings, Mail, MapPin, Home, Eye, BarChart3, ClipboardList, Star, Clock } from "lucide-react-native";

const RestaurantProfile = () => {
    const { user, cerrarSesion, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ Verificar sesión al cargar el componente - IGUAL QUE EN HOME
    useEffect(() => {
        verificarSesion();
    }, []);

    // ✅ Cargar datos del restaurante - MISMA LÓGICA QUE EN HOME Y CONFIG
    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            const timer = setTimeout(() => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user]);

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

    // ✅ MISMA LOGICA DE CARGA QUE EN HOME - Evita el loading infinito
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
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-5 py-8">
                {/* Header del restaurante con imagen */}
                <View className="items-center mb-8">
                    {/* Imagen del restaurante */}
                    <View className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-[#132e3c]">
                        <Image
                            source={restauranteData.imagen}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>

                    <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center">
                        {restaurantInfo.nombreRestaurante}
                    </Text>
                    <Text className="text-gray-600 text-base font-JakartaMedium text-center mt-2">
                        Restaurante Partner de UniFood
                    </Text>

                    {/* Indicador de estado */}
                    <View className="bg-green-100 px-3 py-1 rounded-full mt-3">
                        <Text className="text-green-700 font-JakartaBold text-sm">
                            ✓ Cuenta verificada y activa
                        </Text>
                    </View>
                </View>

                {/* Estadísticas rápidas del restaurante */}
                <View className="mb-8">
                    <Text className="text-[#132e3c] font-JakartaBold text-lg mb-4">
                        Información del Restaurante
                    </Text>

                    <View className="flex-row justify-around py-4 bg-gray-50 rounded-xl mb-4">
                        <View className="items-center">
                            <Star size={24} color="#D97706" />
                            <Text className="text-[#132e3c] text-xl font-JakartaBold mt-2">
                                {restauranteData.calificacionRestaurante}
                            </Text>
                            <Text className="text-gray-600 font-JakartaMedium text-sm">Calificación</Text>
                        </View>

                        <View className="items-center">
                            <Clock size={24} color="#3B82F6" />
                            <Text className="text-[#132e3c] text-xl font-JakartaBold mt-2">
                                {restauranteData.tiempoEntrega}min
                            </Text>
                            <Text className="text-gray-600 font-JakartaMedium text-sm">Entrega</Text>
                        </View>

                        <View className="items-center">
                            <ClipboardList size={24} color="#059669" />
                            <Text className="text-[#132e3c] text-xl font-JakartaBold mt-2">
                                {restauranteData.menu.length}
                            </Text>
                            <Text className="text-gray-600 font-JakartaMedium text-sm">Platos</Text>
                        </View>
                    </View>

                    {/* Categorías del restaurante */}
                    <View className="bg-[#132e3c] rounded-xl p-4">
                        <Text className="text-white font-JakartaBold text-sm mb-2">
                            Especialidades:
                        </Text>
                        <Text className="text-white font-JakartaMedium text-base">
                            {restauranteData.categorias.join(' • ')}
                        </Text>
                    </View>
                </View>

                {/* Información de contacto y ubicación */}
                <View className="mb-8">
                    <Text className="text-[#132e3c] font-JakartaBold text-lg mb-4">
                        Detalles de la Cuenta
                    </Text>

                    {/* Información de contacto */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
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
                            ID del restaurante: #{restaurantInfo.restauranteId}
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
                            Universidad: {restaurantInfo.nombreUniversidad}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">
                            Campus ID: #{restaurantInfo.universidadId}
                        </Text>
                    </View>
                </View>

                {/* Navegación rápida */}
                <View className="mb-8">
                    <Text className="text-[#132e3c] font-JakartaBold text-lg mb-4">
                        Acceso Rápido
                    </Text>

                    {/* Panel Principal */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3"
                    >
                        <View className="flex-row items-center">
                            <Home size={20} color="#3B82F6" />
                            <View className="flex-1 ml-3">
                                <Text className="text-blue-800 font-JakartaBold text-base">
                                    Panel Principal
                                </Text>
                                <Text className="text-blue-600 font-JakartaMedium text-sm">
                                    Ir al dashboard principal
                                </Text>
                            </View>
                            <Text className="text-blue-400">→</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Configuración */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/configRestaurante")}
                        className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3"
                    >
                        <View className="flex-row items-center">
                            <Settings size={20} color="#EA580C" />
                            <View className="flex-1 ml-3">
                                <Text className="text-orange-800 font-JakartaBold text-base">
                                    Configurar Menú
                                </Text>
                                <Text className="text-orange-600 font-JakartaMedium text-sm">
                                    Gestionar disponibilidad de platos
                                </Text>
                            </View>
                            <Text className="text-orange-400">→</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Vista Previa */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/viewRestaurante")}
                        className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3"
                    >
                        <View className="flex-row items-center">
                            <Eye size={20} color="#059669" />
                            <View className="flex-1 ml-3">
                                <Text className="text-green-800 font-JakartaBold text-base">
                                    Vista Previa
                                </Text>
                                <Text className="text-green-600 font-JakartaMedium text-sm">
                                    Ver como ven los estudiantes
                                </Text>
                            </View>
                            <Text className="text-green-400">→</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Pedidos */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/pedidosRestaurante")}
                        className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-3"
                    >
                        <View className="flex-row items-center">
                            <ClipboardList size={20} color="#7C3AED" />
                            <View className="flex-1 ml-3">
                                <Text className="text-purple-800 font-JakartaBold text-base">
                                    Pedidos Activos
                                </Text>
                                <Text className="text-purple-600 font-JakartaMedium text-sm">
                                    Gestionar pedidos en tiempo real
                                </Text>
                            </View>
                            <Text className="text-purple-400">→</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Historial */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/historialPedidos")}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                    >
                        <View className="flex-row items-center">
                            <BarChart3 size={20} color="#6B7280" />
                            <View className="flex-1 ml-3">
                                <Text className="text-gray-800 font-JakartaBold text-base">
                                    Historial y Estadísticas
                                </Text>
                                <Text className="text-gray-600 font-JakartaMedium text-sm">
                                    Ver estadísticas de ventas
                                </Text>
                            </View>
                            <Text className="text-gray-400">→</Text>
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
                    <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
                        Desarrollado por NeoDigital
                    </Text>
                    <Text className="text-gray-500 font-JakartaMedium text-xs">
                        Panel especializado para gestión de restaurantes
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