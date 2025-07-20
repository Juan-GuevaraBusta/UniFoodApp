/* eslint-disable prettier/prettier */
// app/(root)/(restaurants)/menuRestaurante.tsx - CORREGIDO PARA DISPONIBILIDAD
import { Text, TouchableOpacity, View, FlatList, Image, Alert, RefreshControl } from "react-native";
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import { Stack } from "expo-router";
import { Star, Clock, ShoppingCart } from "lucide-react-native";
import { useCarrito } from "@/context/contextCarrito";

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

  // ✅ Usando el hook integrado para obtener datos actualizados
  const {
    obtenerRestaurantePorId,
    forzarRecargaDisponibilidad,
    precargarDisponibilidadRestaurante,
    disponibilidadLocal,
    isLoadingDisponibilidad
  } = useRestaurantes();

  const { obtenerCantidadTotalCarrito } = useCarrito();

  // ✅ NUEVA ESTRATEGIA: Pre-cargar disponibilidad en cuanto se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      console.log('🍽️ MenuRestaurante - Pantalla enfocada, iniciando carga...');
      inicializarDatos();
    }, [])
  );

  // ✅ PASO 1: Inicializar datos básicos rápidamente
  const inicializarDatos = async () => {
    try {
      setIsInitialLoading(true);

      // 🚀 PASO 1A: Obtener ID del restaurante rápidamente
      const [nombreRestaurante, idRestauranteStr] = await Promise.all([
        AsyncStorage.getItem('restauranteNombre'),
        AsyncStorage.getItem('restauranteSeleccionado')
      ]);

      if (nombreRestaurante) {
        setRestauranteActual(nombreRestaurante);
      }

      if (idRestauranteStr) {
        const id = parseInt(idRestauranteStr);
        setRestauranteId(id);

        console.log('📱 Inicializando restaurante ID:', id);

        // 🚀 PASO 1B: Pre-cargar disponibilidad específica del restaurante en paralelo
        const [, restauranteBase] = await Promise.all([
          precargarDisponibilidadRestaurante(id),
          obtenerRestaurantePorId(id)
        ]);

        // 🚀 PASO 1C: Cargar datos básicos inmediatamente
        if (restauranteBase) {
          setImagenRestaurante(restauranteBase.imagen);
          setCalificacion(restauranteBase.calificacionRestaurante);
          setTiempoEntrega(restauranteBase.tiempoEntrega);
          setCategorias(restauranteBase.categorias);

          console.log('📋 Datos básicos cargados para:', restauranteBase.nombreRestaurante);
        }

        // 🚀 PASO 2: Cargar menú con disponibilidad en paralelo
        await Promise.all([
          cargarMenuConDisponibilidad(id),
          forzarRecargaDisponibilidad()
        ]);
      }
    } catch (error) {
      console.error('❌ Error inicializando datos:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // ✅ PASO 2: Cargar menú con disponibilidad actualizada - MEJORADO con logging detallado
  const cargarMenuConDisponibilidad = async (restauranteId?: number) => {
    try {
      const id = restauranteId || idRestaurante;
      if (id <= 0) return;

      console.log('🍽️ Cargando menú con disponibilidad para restaurante:', id);

      // ✅ Intentar obtener el restaurante con disponibilidad
      const restaurante = obtenerRestaurantePorId(id);

      if (restaurante) {
        // ✅ VERIFICACIÓN DETALLADA de cada plato
        console.log('🔍 VERIFICACIÓN DETALLADA DE DISPONIBILIDAD:');
        restaurante.menu.forEach(plato => {
          console.log(`🍽️ Plato: ${plato.nombre}`);
          console.log(`   - ID: ${plato.idPlato}`);
          console.log(`   - Disponible en JSON original: ${plato.disponible}`);
          console.log(`   - Disponibilidad actual procesada: ${plato.disponible}`);
          console.log(`   - Disponibilidad local AsyncStorage: ${disponibilidadLocal[id] ? disponibilidadLocal[id][plato.idPlato] : 'No guardada'}`);
          console.log('   ---');
        });

        setItemsMenu(restaurante.menu);

        console.log('✅ Menú cargado con disponibilidad:', {
          restaurante: restaurante.nombreRestaurante,
          platosTotal: restaurante.menu.length,
          platosDisponibles: restaurante.menu.filter(p => p.disponible).length,
          detalleDisponibilidad: restaurante.menu.map(p => ({
            id: p.idPlato,
            nombre: p.nombre,
            disponible: p.disponible,
            disponibleOriginal: p.disponible // Para comparar
          }))
        });
      } else {
        console.error('❌ No se encontró el restaurante con ID:', id);
      }
    } catch (error) {
      console.error('❌ Error cargando menú:', error);
    }
  };

  // ✅ WATCHER: Actualizar menú cuando cambie la disponibilidad
  useEffect(() => {
    if (idRestaurante > 0 && !isInitialLoading) {
      console.log('🔄 Disponibilidad cambió, actualizando menú...');
      cargarMenuConDisponibilidad();
    }
  }, [disponibilidadLocal, idRestaurante, isInitialLoading]);

  // ✅ Función para refrescar manualmente (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      console.log('🔄 Refrescando menú del restaurante...');

      // Pre-cargar disponibilidad específica y forzar recarga general
      await Promise.all([
        idRestaurante > 0 ? precargarDisponibilidadRestaurante(idRestaurante) : Promise.resolve(),
        forzarRecargaDisponibilidad()
      ]);

      // Actualizar menú
      await cargarMenuConDisponibilidad();

      console.log('✅ Menú refrescado');
    } catch (error) {
      console.error('❌ Error refrescando menú:', error);
    } finally {
      setRefreshing(false);
    }
  }, [idRestaurante, precargarDisponibilidadRestaurante, forzarRecargaDisponibilidad]);

  // ✅ MEJORADA: Función para seleccionar plato con verificación doble
  const seleccionarPlato = async (plato: Plato) => {
    // ✅ VERIFICACIÓN DOBLE de disponibilidad
    console.log('🎯 Usuario seleccionó plato:', {
      nombre: plato.nombre,
      id: plato.idPlato,
      disponibleEnObjeto: plato.disponible,
      restauranteId: idRestaurante
    });

    // ✅ Verificar disponibilidad actual desde el hook
    const restauranteActualizado = obtenerRestaurantePorId(idRestaurante);
    const platoActualizado = restauranteActualizado?.menu.find(p => p.idPlato === plato.idPlato);

    console.log('🔍 Verificación actualizada:', {
      platoEncontrado: !!platoActualizado,
      disponibleActualizado: platoActualizado?.disponible,
    });

    // ✅ Usar la disponibilidad más actualizada
    const estaDisponible = platoActualizado?.disponible ?? plato.disponible;

    if (!estaDisponible) {
      console.log('❌ Plato NO disponible, mostrando alerta');
      Alert.alert(
        'Plato no disponible',
        `Lo sentimos, ${plato.nombre} está temporalmente agotado. Por favor elige otro plato.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    console.log('✅ Plato disponible, navegando a detalles');

    // Guardar plato en AsyncStorage para la siguiente pantalla
    await AsyncStorage.setItem('platoSeleccionado', plato.idPlato.toString());
    await AsyncStorage.setItem('platoNombre', plato.nombre);
    await AsyncStorage.setItem('platoPrecio', plato.precio.toString());

    // Navegar a detalles del plato
    router.push(`/(root)/(restaurants)/plato`);
  };

  const agruparPorCategoria = () => {
    const grupos: { [key: string]: Plato[] } = {};

    itemsMenu.forEach(plato => {
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

  // ✅ Pantalla de carga mejorada mientras se obtienen los datos
  if (isInitialLoading || (itemsMenu.length === 0 && isLoadingDisponibilidad)) {
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
                  style={{ width: isLoadingDisponibilidad ? '70%' : '100%' }}
                />
              </View>
              <Text className="text-gray-500 text-xs text-center mt-2">
                {isLoadingDisponibilidad ? 'Cargando disponibilidad...' : 'Finalizando...'}
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
        {(refreshing || isLoadingDisponibilidad) && (
          <View className="px-5 py-2 bg-blue-50">
            <Text className="text-blue-600 text-xs font-JakartaMedium text-center">
              🔄 {refreshing ? 'Refrescando menú...' : 'Verificando disponibilidad...'}
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

                        {/* ✅ Overlay de agotado */}
                        {!plato.disponible && (
                          <View className="absolute inset-0 bg-black bg-opacity-60 rounded-t-xl flex items-center justify-center">
                            <View className="bg-red-500 px-3 py-1 rounded-full">
                              <Text className="text-white font-JakartaBold text-xs">
                                AGOTADO
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
              Restaurante ID: {idRestaurante} | Disponibilidad local: {disponibilidadLocal[idRestaurante] ? 'SÍ' : 'NO'}
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

export default menuRestaurante;