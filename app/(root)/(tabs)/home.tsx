/* eslint-disable prettier/prettier */
// app/(root)/(tabs)/home.tsx - VERSIÓN CORREGIDA
import { useRestaurantes } from '@/hooks/useRestaurantes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, ImageBackground, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const [universidadActual, setUniversidadActual] = useState('ICESI');
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Usar el hook integrado para obtener restaurantes con disponibilidad actualizada
  const {
    restaurantesFiltrados,
    setUniversidadSeleccionada,
    isLoadingDisponibilidad,
    forzarRecargaDisponibilidad,
    disponibilidadLocal // Para debugging
  } = useRestaurantes();

  // ✅ CRÍTICO: Se ejecuta cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Home - Pantalla enfocada, cargando datos...');
      cargarUniversidadActual();
    }, [])
  );

  // ✅ Función para cargar universidad y forzar actualización
  const cargarUniversidadActual = async () => {
    try {
      const nombre = await AsyncStorage.getItem('universidadNombre');
      const id = await AsyncStorage.getItem('universidadSeleccionada');

      if (nombre) {
        setUniversidadActual(nombre);
      }

      if (id) {
        const universidadIdNum = parseInt(id);
        setUniversidadSeleccionada(universidadIdNum);

        console.log('🏫 Universidad seleccionada:', {
          nombre,
          id: universidadIdNum
        });
      }

      // ✅ Forzar recarga de disponibilidad al enfocar
      await forzarRecargaDisponibilidad();

      // ✅ Log para verificar estado de disponibilidad
      console.log('📊 Estado actual de disponibilidad:', disponibilidadLocal);

    } catch (error) {
      console.error('❌ Error cargando universidad:', error);
    }
  };

  // ✅ Función para refrescar manualmente (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      console.log('🔄 Refrescando datos de restaurantes...');
      await forzarRecargaDisponibilidad();

      // Pequeña pausa para UX
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Datos refrescados');
    } catch (error) {
      console.error('❌ Error refrescando:', error);
    } finally {
      setRefreshing(false);
    }
  }, [forzarRecargaDisponibilidad]);

  const seleccionarRestaurante = async (restaurante: any) => {
    await AsyncStorage.setItem('restauranteSeleccionado', restaurante.idRestaurante.toString());
    await AsyncStorage.setItem('restauranteNombre', restaurante.nombreRestaurante);

    setRestauranteSeleccionado(restaurante.idRestaurante);

    // ✅ Log detallado para verificar disponibilidad al seleccionar
    console.log('🏪 Estudiante seleccionó restaurante:', {
      nombre: restaurante.nombreRestaurante,
      id: restaurante.idRestaurante,
      platosTotal: restaurante.menu.length,
      platosDisponibles: restaurante.menu.filter((p: any) => p.disponible).length,
      detalleDisponibilidad: restaurante.menu.map((p: any) => ({
        nombre: p.nombre,
        disponible: p.disponible
      }))
    });

    router.push('/(root)/(restaurants)/menuRestaurante');
  };

  return (
    <SafeAreaView className="flex h-full bg-white">
      {/* Header - Selector de universidad */}
      <View className="w-full flex justify-start items-start p-5 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.push('/(root)/uniSelection')}
          className="bg-[#132e3c] p-4 rounded-full w-full"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-JakartaBold">{universidadActual}</Text>
              <Text className="text-gray-300 text-sm font-Jakarta">Toca para cambiar</Text>
            </View>
            <Text className="text-white text-xl">📍</Text>
          </View>
        </TouchableOpacity>

        {/* ✅ Indicador de estado de carga */}
        {isLoadingDisponibilidad && (
          <View className="mt-2 p-2 bg-blue-50 rounded-lg">
            <Text className="text-blue-600 text-xs font-JakartaMedium text-center">
              🔄 Actualizando disponibilidad de platos...
            </Text>
          </View>
        )}
      </View>

      {/* Lista de restaurantes */}
      <View className="flex-1 p-5">
        {restaurantesFiltrados.length > 0 ? (
          <FlatList
            data={restaurantesFiltrados}
            keyExtractor={(item) => item.idRestaurante.toString()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#132e3c"
                title="Actualizando restaurantes..."
                titleColor="#132e3c"
              />
            }
            renderItem={({ item }) => {
              const isSelected = restauranteSeleccionado === item.idRestaurante;

              // ✅ Calcular platos disponibles en tiempo real
              const platosDisponibles = item.menu.filter(p => p.disponible).length;
              const platosTotal = item.menu.length;

              return (
                <TouchableOpacity
                  onPress={() => seleccionarRestaurante(item)}
                  style={{
                    padding: 20,
                    borderRadius: 38,
                    marginBottom: 16,
                    borderWidth: 3,
                    borderColor: '#132e3c',
                    backgroundColor: '#132e3c',
                    overflow: 'hidden',
                    opacity: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {/* Imagen de fondo */}
                  {item.imagen && (
                    <View style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0.25
                    }}>
                      <ImageBackground
                        source={item.imagen}
                        style={{ flex: 1 }}
                        resizeMode="cover"
                      />
                    </View>
                  )}

                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0,0,0,0.8)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2
                      }}>
                        {item.nombreRestaurante}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: '#FFFFFF',
                        marginTop: 4,
                        textShadowColor: 'rgba(0,0,0,0.8)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 1
                      }}>
                        {item.categorias.join(' • ')}
                      </Text>


                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-400 text-6xl mb-4">🍽️</Text>
            <Text className="text-gray-600 text-lg font-JakartaBold text-center">
              No hay restaurantes disponibles
            </Text>
            <Text className="text-gray-500 text-sm font-Jakarta text-center mt-2 px-8">
              En {universidadActual} aún no tenemos restaurantes registrados.
              ¡Pronto habrá más opciones!
            </Text>

            {/* Botón para refrescar manualmente */}
            <TouchableOpacity
              onPress={onRefresh}
              className="mt-4 bg-[#132e3c] px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-JakartaBold">
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ✅ Indicador de última actualización (opcional, para debugging) */}
      {__DEV__ && (
        <View className="px-5 py-2 bg-gray-50">
          <Text className="text-gray-500 text-xs text-center">
            🔧 DEV: Última actualización: {new Date().toLocaleTimeString()}
          </Text>
          <Text className="text-gray-500 text-xs text-center mt-1">
            Disponibilidad cargada: {Object.keys(disponibilidadLocal).length} restaurantes
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Home;