import { Text, View, TouchableOpacity, ScrollView, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantes } from "@/hooks/useRestaurantes";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Plus, Settings, DollarSign } from "lucide-react-native";

const EdicionRestaurante = () => {
    const { user } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);

    useEffect(() => {
        if (user?.restaurantInfo) {
            const restaurante = obtenerRestaurantePorId(user.restaurantInfo.restauranteId);
            setRestauranteData(restaurante);
        }
    }, [user]);

    const agruparPorCategoria = () => {
        if (!restauranteData?.menu) return {};

        const grupos: { [key: string]: any[] } = {};
        restauranteData.menu.forEach((plato: any) => {
            const categoria = plato.categoria;
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }
            grupos[categoria].push(plato);
        });
        return grupos;
    };

    const formatearPrecio = (precio: number) => {
        return `$${precio.toLocaleString('es-CO')}`;
    };

    if (!restauranteData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 text-lg">Cargando datos del menú...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft size={20} color="#132e3c" />
                </TouchableOpacity>
                <Text className="text-[#132e3c] text-xl font-JakartaBold">Editar Menú</Text>
                <TouchableOpacity className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Plus size={20} color="#059669" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header del restaurante */}
                <View className="px-5 py-8 bg-gray-50">
                    <View className="items-center">
                        <View className="w-16 h-16 bg-[#132e3c] rounded-full items-center justify-center mb-4">
                            <Edit size={32} color="white" />
                        </View>
                        <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center">
                            {restauranteData.nombreRestaurante}
                        </Text>
                        <Text className="text-gray-600 text-base font-JakartaMedium text-center mt-2">
                            Gestiona tu menú y precios
                        </Text>
                    </View>
                </View>

                {/* Estadísticas rápidas */}
                <View className="flex-row justify-around py-6 bg-white border-b border-gray-200">
                    <View className="items-center">
                        <Text className="text-[#132e3c] text-2xl font-JakartaBold">
                            {restauranteData.menu.length}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium">Platos</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-[#132e3c] text-2xl font-JakartaBold">
                            {Object.keys(agruparPorCategoria()).length}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium">Categorías</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-[#132e3c] text-2xl font-JakartaBold">
                            {formatearPrecio(Math.round(restauranteData.menu.reduce((sum: number, plato: any) => sum + plato.precio, 0) / restauranteData.menu.length))}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium">Precio Promedio</Text>
                    </View>
                </View>

                {/* Lista del menú por categorías */}
                <View className="flex-1 px-5 pt-6">
                    {Object.entries(agruparPorCategoria()).map(([categoria, platos]) => (
                        <View key={categoria} className="mb-8">
                            {/* Header de categoría */}
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-[#132e3c] text-xl font-JakartaBold">
                                    {categoria}
                                </Text>
                                <TouchableOpacity className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full">
                                    <Plus size={16} color="#3B82F6" />
                                    <Text className="text-blue-600 font-JakartaBold text-sm ml-1">
                                        Agregar
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Lista de platos */}
                            {platos.map((plato: any, index: number) => (
                                <TouchableOpacity
                                    key={index}
                                    className="bg-white rounded-xl border border-gray-200 p-4 mb-3"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.1,
                                        shadowRadius: 3,
                                        elevation: 3,
                                    }}
                                >
                                    <View className="flex-row">
                                        {/* Imagen del plato */}
                                        <View className="w-20 h-20 bg-gray-200 rounded-lg mr-4">
                                            <Image source={plato.imagen} className="w-full h-full rounded-lg" />
                                        </View>

                                        {/* Información del plato */}
                                        <View className="flex-1">
                                            <View className="flex-row items-start justify-between mb-2">
                                                <Text className="text-[#132e3c] font-JakartaBold text-base flex-1" numberOfLines={2}>
                                                    {plato.nombre}
                                                </Text>
                                                <TouchableOpacity className="ml-2">
                                                    <Edit size={16} color="#6B7280" />
                                                </TouchableOpacity>
                                            </View>

                                            <Text className="text-gray-600 font-JakartaMedium text-sm mb-3" numberOfLines={2}>
                                                {plato.descripcion}
                                            </Text>

                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center">
                                                    <DollarSign size={16} color="#059669" />
                                                    <Text className="text-green-600 font-JakartaBold text-lg ml-1">
                                                        {formatearPrecio(plato.precio)}
                                                    </Text>
                                                </View>

                                                <View className="bg-gray-100 px-2 py-1 rounded-full">
                                                    <Text className="text-gray-600 font-JakartaMedium text-xs">
                                                        {plato.tipoPlato}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Toppings info */}
                                            {(plato.toppingsBase.length > 0 || plato.toppingsDisponibles.length > 0) && (
                                                <Text className="text-gray-500 font-JakartaMedium text-xs mt-2">
                                                    {plato.toppingsBase.length > 0 && `${plato.toppingsBase.length} base`}
                                                    {plato.toppingsBase.length > 0 && plato.toppingsDisponibles.length > 0 && " • "}
                                                    {plato.toppingsDisponibles.length > 0 && `${plato.toppingsDisponibles.length} extras`}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Botón para agregar nueva categoría */}
                <View className="px-5 pb-8">
                    <TouchableOpacity
                        className="bg-[#132e3c] py-4 rounded-xl flex-row items-center justify-center mb-4"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <Plus size={20} color="white" />
                        <Text className="text-white font-JakartaBold text-lg ml-2">
                            Agregar Nueva Categoría
                        </Text>
                    </TouchableOpacity>

                    <Text className="text-gray-500 font-JakartaMedium text-center text-sm">
                        Las funciones de edición estarán disponibles en futuras actualizaciones
                    </Text>
                </View>

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default EdicionRestaurante;