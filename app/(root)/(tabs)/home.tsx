/* eslint-disable prettier/prettier */
import { Text, TouchableOpacity, View, FlatList, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from 'expo-router';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useRestaurantes } from '@/hooks/useRestaurantes'; // Hook personalizado

const Home = () => {
  const [universidadActual, setUniversidadActual] = useState('ICESI');
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(0);

  // ✅ Usar el hook integrado para obtener restaurantes con disponibilidad actualizada
  const {
    restaurantesFiltrados,
    setUniversidadSeleccionada
  } = useRestaurantes();

  // Se ejecuta cada vez que la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      cargarUniversidadActual();
    }, [])
  );

  const cargarUniversidadActual = async () => {
    const nombre = await AsyncStorage.getItem('universidadNombre');
    const id = await AsyncStorage.getItem('universidadSeleccionada');

    if (nombre) {
      setUniversidadActual(nombre);
    }

    if (id) {
      const universidadIdNum = parseInt(id);
      setUniversidadSeleccionada(universidadIdNum);
    }
  };

  const seleccionarRestaurante = async (restaurante: any) => {
    await AsyncStorage.setItem('restauranteSeleccionado', restaurante.idRestaurante.toString());
    await AsyncStorage.setItem('restauranteNombre', restaurante.nombreRestaurante);

    setRestauranteSeleccionado(restaurante.idRestaurante);

    console.log('🏪 Estudiante seleccionó restaurante:', {
      nombre: restaurante.nombreRestaurante,
      platosDisponibles: restaurante.menu.filter((p: any) => p.disponible).length,
      platosTotal: restaurante.menu.length
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
      </View>

      {/* Lista de restaurantes */}
      <View className="flex-1 p-5">
        {restaurantesFiltrados.length > 0 ? (
          <FlatList
            data={restaurantesFiltrados}
            keyExtractor={(item) => item.idRestaurante.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = restauranteSeleccionado === item.idRestaurante;

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
                  {/* Imagen de fondo - ya procesada por el hook con disponibilidad actualizada */}
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
                        source={item.imagen} // Ya viene procesada del hook con disponibilidad
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
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Home;