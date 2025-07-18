import { Text, View, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantes } from "@/hooks/useRestaurantes";
import { useState, useEffect } from "react";
import { Home, Eye, Star, Clock } from "lucide-react-native";

const ViewRestaurante = () => {
    const { user } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);

    useEffect(() => {
        if (user?.restaurantInfo) {
            const restaurante = obtenerRestaurantePorId(user.restaurantInfo.restauranteId);
            setRestauranteData(restaurante);
        }
    }, [user]);

    if (!restauranteData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 text-lg">Cargando vista previa...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-5 py-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/home")}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <Home size={20} color="#132e3c" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold">Vista Previa</Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium">
                            Como ven los estudiantes tu restaurante
                        </Text>
                    </View>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header del restaurante como lo ven los clientes */}
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
                        <View className="items-center mb-6">
                            <Text className="text-[#132e3c] font-JakartaExtraBold text-4xl text-center mb-2">
                                {restauranteData.nombreRestaurante}
                            </Text>
                            <Text className="text-[#132e3c] font-JakartaMedium text-lg text-center opacity-80">
                                {user?.restaurantInfo?.nombreUniversidad}
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
                                        <Star size={16} color="#FFFFFF" />
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
                                        <Eye size={16} color="#FFFFFF" />
                                        <Text className="text-white text-lg font-JakartaLight ml-2">
                                            {restauranteData.menu.length}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Categorías */}
                <View className="px-10 bg-[#132e3c] items-center justify-center">
                    <Text className="text-white font-JakartaExtraBold m-4">
                        {restauranteData.categorias.join(' • ')}
                    </Text>
                </View>

                {/* Vista previa del menú */}
                <View className="px-5 py-8">
                    <Text className="text-[#132e3c] text-2xl font-JakartaBold mb-6 text-center">
                        Vista previa del menú
                    </Text>

                    <Text className="text-gray-600 font-JakartaMedium text-center mb-8">
                        Así es como los estudiantes ven tu restaurante
                    </Text>

                    {/* Lista simplificada de platos */}
                    {restauranteData.menu.slice(0, 3).map((plato: any, index: number) => (
                        <View key={index} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                            <View className="flex-row">
                                <View className="w-16 h-16 bg-gray-200 rounded-lg mr-4">
                                    <Image source={plato.imagen} className="w-full h-full rounded-lg" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[#132e3c] font-JakartaBold text-base mb-1">
                                        {plato.nombre}
                                    </Text>
                                    <Text className="text-gray-600 font-JakartaMedium text-sm mb-2" numberOfLines={2}>
                                        {plato.descripcion}
                                    </Text>
                                    <Text className="text-[#132e3c] font-JakartaBold text-lg">
                                        ${plato.precio.toLocaleString('es-CO')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {restauranteData.menu.length > 3 && (
                        <Text className="text-gray-500 font-JakartaMedium text-center mt-4">
                            ... y {restauranteData.menu.length - 3} platos más
                        </Text>
                    )}
                </View>

                {/* Información útil */}
                <View className="px-5 pb-8">
                    <View className="bg-blue-50 rounded-xl p-4 mb-6">
                        <Text className="text-blue-800 font-JakartaBold text-sm mb-2">
                            👀 Vista del Cliente
                        </Text>
                        <Text className="text-blue-700 font-JakartaMedium text-xs">
                            Esta es exactamente la vista que tienen los estudiantes cuando navegan por tu restaurante desde la app UniFood.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="bg-[#132e3c] py-4 rounded-xl flex-row items-center justify-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <Text className="text-white font-JakartaBold text-lg">
                            Volver al Panel Principal
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ViewRestaurante;