/* eslint-disable prettier/prettier */
import { Text, TouchableOpacity, View, FlatList, Image, Switch } from "react-native";
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Star, Clock } from "lucide-react-native";

const ConfigRestaurante = () => {
    const { user, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);
    const [platosDisponibles, setPlatosDisponibles] = useState<{ [key: number]: boolean }>({});

    // Verificar sesión al cargar el componente - IGUAL QUE EN HOME
    useEffect(() => {
        verificarSesion();
    }, []);

    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            // Pequeño delay para asegurar que los datos estén completamente cargados - IGUAL QUE EN HOME
            const timer = setTimeout(() => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);

                // Inicializar disponibilidad de platos
                if (restaurante?.menu) {
                    const disponibilidadInicial: { [key: number]: boolean } = {};
                    restaurante.menu.forEach((plato: any) => {
                        disponibilidadInicial[plato.idPlato] = true; // Por defecto disponibles
                    });
                    setPlatosDisponibles(disponibilidadInicial);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user]);

    const toggleDisponibilidadPlato = (idPlato: number) => {
        setPlatosDisponibles(prev => ({
            ...prev,
            [idPlato]: !prev[idPlato]
        }));
    };

    const agruparPorCategoria = () => {
        if (!restauranteData?.menu) return {};

        const grupos: { [key: string]: Plato[] } = {};
        restauranteData.menu.forEach((plato: any) => {
            const categoria = plato.categoria;
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }
            grupos[categoria].push(plato);
        });
        return grupos;
    };

    // Función para formatear precio
    const formatearPrecio = (precio: number) => {
        return `${precio.toLocaleString('es-CO')}`;
    };

    // MISMA LOGICA DE CARGA QUE EN HOME
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

    return (
        <SafeAreaView className="flex h-full bg-white">
            {/* Header con imagen de fondo */}
            <View className="relative w-full pt-12 pb-6 px-5">
                {/* Imagen de fondo solo en el header con bordes curvos */}
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

                {/* Contenedor relativo para posicionar elementos */}
                <View className="relative mb-4 h-12">
                    {/* Botón X - Contenedor separado, posicionado a la izquierda */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                    >
                        <ArrowLeft size={24} color="#132e3c" />
                    </TouchableOpacity>

                    {/* Título - Contenedor separado, centrado */}
                    <View className="absolute left-0 right-0 top-0 flex items-center justify-center z-10">
                        <Text className="text-[#132e3c] font-JakartaExtraBold text-3xl text-center absolute top-6 opacity-90">
                            Nuestro menú
                        </Text>
                    </View>
                </View>

                {/* Caja azul centrada debajo del nombre */}
                <View
                    className="bg-[#132e3c] px-16 py-4 rounded-full self-center relative z-10 p-4 mt-4"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    {/* Contenedor principal horizontal */}
                    <View className="flex-row items-center justify-between">

                        {/* Columna de Calificación */}
                        <View className="items-center">
                            <Text className="text-white text-sm font-JakartaBold mb-2">
                                Calificación
                            </Text>
                            <View className="flex-row items-center">
                                <Star size={12} color="#FFFFFF"></Star>
                                <Text className="text-white text-lg font-JakartaExtraLight ml-2">
                                    {restauranteData.calificacionRestaurante}
                                </Text>
                            </View>
                        </View>

                        <View style={{ width: 60 }}></View>

                        {/* Columna de Entrega */}
                        <View className="items-center">
                            <Text className="text-white text-sm font-JakartaBold mb-2">
                                Entrega
                            </Text>
                            <View className="flex-row items-center">
                                <Clock size={12} color="#FFFFFF"></Clock>
                                <Text className="text-white text-lg font-JakartaExtraLight ml-2">
                                    {restauranteData.tiempoEntrega} min
                                </Text>
                            </View>
                        </View>

                    </View>
                </View>
            </View>

            {/* Barra que mostrará las categorías principales del restaurante */}
            <View className="px-10 bg-[#132e3c] items-center justify-center">
                <Text className="text-white font-JakartaExtraBold m-4">
                    {restauranteData.categorias.join(' • ')}
                </Text>
            </View>

            {/* Lista del menú - fondo blanco sin imagen */}
            <View className="flex-1 px-5 pt-2 bg-white">
                <FlatList
                    data={Object.entries(agruparPorCategoria())}
                    keyExtractor={([categoria]) => categoria}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: [categoria, platos] }) => (
                        <View className="mb-6">
                            {/* Título de la categoría con número */}
                            <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4 ml-2">
                                {Object.keys(agruparPorCategoria()).indexOf(categoria) + 1}. {categoria}
                            </Text>

                            {/* Fila de platos de esta categoría */}
                            <FlatList
                                data={platos}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(plato) => plato.idPlato.toString()}
                                contentContainerStyle={{ paddingHorizontal: 8 }}
                                renderItem={({ item: plato }) => (
                                    <View
                                        className="bg-white rounded-xl mr-4 shadow-sm border border-gray-100 relative"
                                        style={{
                                            width: 160,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            elevation: 3,
                                        }}
                                    >
                                        {/* Checkbox de edición en la esquina superior izquierda */}
                                        <View className="absolute top-2 left-2 w-6 h-6 bg-white rounded border-2 border-[#132e3c] flex items-center justify-center z-10">
                                            <Text className="text-[#132e3c] text-xs font-bold">✓</Text>
                                        </View>

                                        {/* Imagen del plato */}
                                        <View className="h-32 bg-gray-200 rounded-t-xl mb-3 relative">
                                            <View className="absolute inset-0 bg-gray-300 rounded-t-xl flex items-center justify-center">
                                                <Image source={plato.imagen} className="w-full h-full rounded-t-xl" />
                                            </View>

                                            {/* Overlay de no disponible */}
                                            {!platosDisponibles[plato.idPlato] && (
                                                <View className="absolute inset-0 bg-black opacity-50 rounded-t-xl flex items-center justify-center">
                                                    <Text className="text-white font-JakartaBold text-sm">No disponible</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Información del plato */}
                                        <View className="px-3 pb-4 items-center justify-center">
                                            <Text className="text-[#132e3c] text-base font-JakartaExtraBold mb-1" numberOfLines={2}>
                                                {plato.nombre}
                                            </Text>

                                            <Text className="text-[#132e3c] text-lg font-JakartaLight mb-3">
                                                {formatearPrecio(plato.precio)}
                                            </Text>

                                            {/* Switch de disponibilidad */}
                                            <View className="flex-row items-center">
                                                <Switch
                                                    value={platosDisponibles[plato.idPlato]}
                                                    onValueChange={() => toggleDisponibilidadPlato(plato.idPlato)}
                                                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                                                    thumbColor={platosDisponibles[plato.idPlato] ? '#FFFFFF' : '#FFFFFF'}
                                                    ios_backgroundColor="#E5E7EB"
                                                />
                                                <Text className={`ml-2 text-xs font-JakartaBold ${platosDisponibles[plato.idPlato] ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {platosDisponibles[plato.idPlato] ? 'Disponible' : 'No disponible'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            />
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
};

export default ConfigRestaurante;