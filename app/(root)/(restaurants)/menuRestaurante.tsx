/* eslint-disable prettier/prettier */
// app/(root)/(restaurants)/menuRestaurante.tsx - CORREGIDO PARA DISPONIBILIDAD
import type { Schema } from '@/amplify/data/resource';
import { useCarrito } from "@/context/contextCarrito";
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/data';
import { router, Stack } from 'expo-router';
import { Clock, ShoppingCart, Star } from "lucide-react-native";
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";

// ✅ Cliente GraphQL tipado para producción
const client = generateClient<Schema>();

const menuRestaurante = () => {
  const [restauranteActual, setRestauranteActual] = useState('');
  const [idRestaurante, setRestauranteId] = useState(0);
  const [itemsMenu, setItemsMenu] = useState<Plato[]>([]);
  const [imagenRestaurante, setImagenRestaurante] = useState<any>(null);
  const [tiempoEntrega, setTiempoEntrega] = useState(0);
  const [calificacion, setCalificacion] = useState(0);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ✅ Usando el hook simplificado
  const {
    restaurantesFiltrados,
    obtenerRestaurantePorId
  } = useRestaurantes();

  const { obtenerCantidadTotalCarrito } = useCarrito();

  // ✅ Cargar datos al enfocar la pantalla (patrón de pedidos)
  useFocusEffect(
    useCallback(() => {
      console.log('🍽️ USUARIO - Pantalla menu enfocada, cargando datos...');
      cargarDatosRestaurante();
    }, [])
  );

  // ✅ FUNCIÓN: Cargar datos del restaurante con disponibilidad actualizada (patrón de pedidos)
  const cargarDatosRestaurante = async () => {
    try {
      console.log('🍽️ USUARIO - Cargando datos del restaurante...');
      setIsInitialLoading(true);

      // ✅ PASO 1: Obtener datos básicos del restaurante
      const [nombreRestaurante, idRestauranteStr] = await Promise.all([
        AsyncStorage.getItem('restauranteNombre'),
        AsyncStorage.getItem('restauranteSeleccionado')
      ]);

      if (nombreRestaurante) {
        setRestauranteActual(nombreRestaurante);
      }

      if (!idRestauranteStr) {
        console.error('❌ USUARIO - No se encontró ID del restaurante');
        return;
      }

      const id = parseInt(idRestauranteStr);
      setRestauranteId(id);

      // ✅ PASO 2: Obtener restaurante de datos locales
      const restaurante = obtenerRestaurantePorId(id);
      if (!restaurante) {
        console.error('❌ USUARIO - Restaurante no encontrado con ID:', id);
        return;
      }

      // ✅ PASO 3: Configurar datos básicos
      setImagenRestaurante(restaurante.imagen);
      setCalificacion(restaurante.calificacionRestaurante);
      setTiempoEntrega(restaurante.tiempoEntrega);
      setCategorias(restaurante.categorias);

      // ✅ PASO 4: Obtener disponibilidad directamente del backend
      console.log('🔍 USUARIO - Obteniendo disponibilidad del backend...');
      const { data: disponibilidadPlatos, errors } = await client.models.DisponibilidadPlato.list({
        filter: {
          restauranteId: { eq: id.toString() }
        }
      });

      if (errors && errors.length > 0) {
        console.error('❌ USUARIO - Error obteniendo disponibilidad:', errors);
        // Usar menú original si hay error
        setItemsMenu(restaurante.menu);
        return;
      }

      // ✅ PASO 5: Procesar disponibilidad y actualizar menú
      const disponibilidad: { [platoId: string]: boolean } = {};
      if (disponibilidadPlatos) {
        disponibilidadPlatos.forEach((item: any) => {
          disponibilidad[item.platoId] = item.disponible;
        });
      }

      console.log('✅ USUARIO - Disponibilidad obtenida:', disponibilidad);

      // ✅ PASO 6: Aplicar disponibilidad al menú
      const menuActualizado = restaurante.menu.map(plato => {
        const disponibleBackend = disponibilidad[plato.idPlato.toString()];
        const disponibleFinal = disponibleBackend !== undefined ? disponibleBackend : plato.disponible;

        console.log(`🍽️ Plato ${plato.nombre}: original=${plato.disponible}, backend=${disponibilidad[plato.idPlato.toString()]}, final=${disponibleFinal}`);

        return {
          ...plato,
          disponible: disponibleFinal
        };
      });

      setItemsMenu(menuActualizado);

      // ✅ LOGS DE DEBUGGING
      const disponibles = menuActualizado.filter(p => p.disponible).length;
      const noDisponibles = menuActualizado.filter(p => !p.disponible).length;
      console.log(`📊 USUARIO - Menú actualizado: ${disponibles} disponibles, ${noDisponibles} no disponibles`);

    } catch (error: any) {
      console.error('❌ USUARIO - Error cargando datos del restaurante:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del restaurante: ' + error.message);
    } finally {
      setIsInitialLoading(false);
    }
  };







  // ✅ Pull to refresh (patrón de pedidos)
  const onRefresh = useCallback(async () => {
    console.log('🔄 USUARIO - Refrescando menú...');
    setRefreshing(true);
    await cargarDatosRestaurante();
    setRefreshing(false);
  }, []);

  // ✅ Función para seleccionar plato (simplificada)
  const seleccionarPlato = async (plato: Plato) => {
    console.log('🎯 USUARIO - Seleccionó plato:', {
      nombre: plato.nombre,
      id: plato.idPlato,
      disponible: plato.disponible
    });

    if (!plato.disponible) {
      console.log('❌ USUARIO - Plato no disponible');
      Alert.alert(
        'Plato no disponible',
        `Lo sentimos, ${plato.nombre} está temporalmente agotado. Por favor elige otro plato.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    console.log('✅ USUARIO - Plato disponible, navegando a detalles');

    // Guardar plato en AsyncStorage para la siguiente pantalla
    await AsyncStorage.setItem('platoSeleccionado', plato.idPlato.toString());
    await AsyncStorage.setItem('platoNombre', plato.nombre);
    await AsyncStorage.setItem('platoPrecio', plato.precio.toString());

    // Navegar a detalles del plato
    router.push(`/(root)/(restaurants)/plato`);
  };

  const agruparPorCategoria = () => {
    const grupos: { [key: string]: Plato[] } = {};

    // ✅ Verificación de seguridad
    if (!itemsMenu || itemsMenu.length === 0) {
      console.log('⚠️ itemsMenu está vacío o no definido');
      return grupos;
    }

    itemsMenu.forEach(plato => {
      if (!plato || !plato.categoria) {
        console.log('⚠️ Plato inválido encontrado:', plato);
        return;
      }

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
    return `$${precio.toLocaleString('es-CO')}`;
  };

  // ✅ Pantalla de carga mientras se obtienen los datos
  if (isInitialLoading || itemsMenu.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-white">
          {/* Header básico durante la carga */}
          <View className="w-full pt-12 pb-6 px-5 bg-[#132e3c]">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4"
            >
              <Text className="text-white text-lg font-JakartaBold">← Atrás</Text>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-JakartaBold text-center">
              {restauranteActual || 'Cargando...'}
            </Text>
          </View>

          {/* Área de carga */}
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-6xl mb-4">🍽️</Text>
            <Text className="text-[#132e3c] text-xl font-JakartaBold mb-2 text-center">
              Preparando el menú...
            </Text>
            <Text className="text-gray-600 font-JakartaMedium text-center mb-4">
              Verificando disponibilidad de platos
            </Text>

            {/* Indicador de progreso */}
            <View className="w-full max-w-xs">
              <View className="bg-gray-200 rounded-full h-2">
                <View
                  className="bg-[#132e3c] h-2 rounded-full transition-all duration-1000"
                  style={{ width: isInitialLoading ? '70%' : '100%' }}
                />
              </View>
              <Text className="text-gray-500 text-xs text-center mt-2">
                {isInitialLoading ? 'Cargando menú...' : 'Finalizando...'}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full bg-white">
        {/* Header con imagen de fondo */}
        <View className="relative w-full pt-12 pb-6 px-5">
          <View className="absolute inset-0">
            <Image
              source={imagenRestaurante}
              className="w-full h-full"
              resizeMode="cover"
              style={{
                opacity: 0.3,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30
              }}
            />
          </View>

          <View className="relative mb-4 h-12">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
            >
              <Text className="text-[#132e3c] text-2xl font-JakartaBold">✕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(root)/(restaurants)/carrito')}
              className="absolute right-0 top-0 w-12 h-12 rounded-full bg-[#132e3c] flex items-center justify-center z-10"
            >
              <ShoppingCart size={20} color="white" />
              {obtenerCantidadTotalCarrito() > 0 && (
                <View className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Text className="text-white text-xs font-JakartaBold">
                    {obtenerCantidadTotalCarrito()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View className="absolute left-0 right-0 top-0 flex items-center justify-center z-10">
              <Text className="text-[#132e3c] font-JakartaExtraBold text-5xl text-center absolute top-6 opacity-90">
                {restauranteActual}
              </Text>
            </View>
          </View>

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
            <View className="flex-row items-center justify-between">
              <View className="items-center">
                <Text className="text-white text-sm font-JakartaBold mb-2">
                  Calificación
                </Text>
                <View className="flex-row items-center">
                  <Star size={12} color="#FFFFFF"></Star>
                  <Text className="text-white text-lg font-JakartaExtraLight ml-2">
                    {calificacion}
                  </Text>
                </View>
              </View>

              <View style={{ width: 60 }}></View>

              <View className="items-center">
                <Text className="text-white text-sm font-JakartaBold mb-2">
                  Entrega
                </Text>
                <View className="flex-row items-center">
                  <Clock size={12} color="#FFFFFF"></Clock>
                  <Text className="text-white text-lg font-JakartaExtraLight ml-2">
                    {tiempoEntrega} min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Barra de categorías */}
        <View className="px-10 bg-[#132e3c] items-center justify-center">
          <Text className="text-white font-JakartaExtraBold m-4">
            {categorias.join(' • ')}
          </Text>
        </View>

        {/* ✅ Indicador de actualización */}
        {refreshing && (
          <View className="px-5 py-2 bg-blue-50">
            <Text className="text-blue-600 text-xs font-JakartaMedium text-center">
              🔄 Refrescando menú...
            </Text>
          </View>
        )}



        {/* Lista del menú */}
        <View className="flex-1 px-5 pt-2 bg-white">
          <FlatList
            data={Object.entries(agruparPorCategoria())}
            keyExtractor={([categoria]) => categoria}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#132e3c"
                title="Actualizando menú..."
                titleColor="#132e3c"
              />
            }
            renderItem={({ item: [categoria, platos] }) => (
              <View className="mb-6">
                <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4 ml-2">
                  {categoria}
                </Text>

                <FlatList
                  data={platos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(plato) => plato.idPlato.toString()}
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                  renderItem={({ item: plato }) => (
                    <TouchableOpacity
                      onPress={() => seleccionarPlato(plato)}
                      disabled={!plato.disponible} // ✅ Deshabilitar si no está disponible
                      className={`bg-white rounded-xl mr-4 shadow-sm border border-gray-100 ${!plato.disponible ? 'opacity-60' : '' // ✅ Reducir opacidad si no está disponible
                        }`}
                      style={{
                        width: 160,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: plato.disponible ? 0.1 : 0.05, // ✅ Menos sombra si no está disponible
                        shadowRadius: 4,
                        elevation: plato.disponible ? 3 : 1, // ✅ Menos elevación si no está disponible
                      }}
                    >
                      {/* Imagen del plato */}
                      <View className="h-32 bg-gray-200 rounded-t-xl mb-3 relative">
                        <View className="absolute inset-0 bg-gray-300 rounded-t-xl flex items-center justify-center">
                          <Image
                            source={plato.imagen}
                            className="w-full h-full rounded-t-xl"
                            style={{
                              opacity: plato.disponible ? 1 : 0.5 // ✅ Imagen menos visible si no está disponible
                            }}
                          />
                        </View>

                        {/* ✅ Overlay de agotado mejorado */}
                        {!plato.disponible && (
                          <View className="absolute inset-0 bg-black bg-opacity-70 rounded-t-xl flex items-center justify-center">
                            <View className="bg-red-600 px-4 py-2 rounded-lg shadow-lg border-2 border-white">
                              <Text className="text-white font-JakartaBold text-sm text-center">
                                🔴 AGOTADO
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* ✅ Botón + solo si está disponible */}
                        {plato.disponible && (
                          <TouchableOpacity
                            className="absolute top-2 right-2 w-8 h-8 bg-[#132e3c] rounded-full flex items-center justify-center"
                            onPress={() => seleccionarPlato(plato)}
                          >
                            <Text className="text-white text-lg font-bold">+</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Información del plato */}
                      <View className="px-3 pb-4 items-center justify-center">
                        <Text
                          className={`text-base font-JakartaExtraBold mb-1 text-center ${plato.disponible ? 'text-[#132e3c]' : 'text-gray-500'
                            }`}
                          numberOfLines={2}
                        >
                          {plato.nombre}
                          {!plato.disponible && ' (Agotado)'}
                        </Text>

                        <Text
                          className={`text-lg font-JakartaLight ${plato.disponible ? 'text-[#132e3c]' : 'text-gray-400'
                            }`}
                        >
                          {formatearPrecio(plato.precio)}
                        </Text>

                        {/* ✅ Mensaje de no disponible */}
                        {!plato.disponible && (
                          <Text className="text-red-500 font-JakartaBold text-xs mt-1 text-center">
                            No disponible
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          />
        </View>

        {/* ✅ Información de última actualización (solo en desarrollo) */}
        {__DEV__ && (
          <View className="px-5 py-2 bg-gray-50 border-t border-gray-200">
            <Text className="text-gray-500 text-xs text-center">
              🔧 DEV: Menú actualizado - {new Date().toLocaleTimeString()}
            </Text>
            <Text className="text-gray-500 text-xs text-center">
              Platos disponibles: {itemsMenu.filter(p => p.disponible).length}/{itemsMenu.length}
            </Text>
            <Text className="text-gray-500 text-xs text-center">
              Restaurante ID: {idRestaurante}
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default menuRestaurante;