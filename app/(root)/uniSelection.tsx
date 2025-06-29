/* eslint-disable prettier/prettier */
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { Text, TouchableOpacity, View, FlatList, ImageBackground, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Universidades } from "@/constants/index";

interface Universidad {
  id: number;
  nombre: string;
  ciudad: string;
  imagen: any;
}

const UniSelection = () => {
  const [universidadSeleccionada, setUniversidadSeleccionada] = useState(1);

  const cargarUniversidadGuardada = async () => {
    try {
      const savedId = await AsyncStorage.getItem('universidadSeleccionada');
      if (savedId) {
        setUniversidadSeleccionada(parseInt(savedId));
      }
    } catch (error) {
      console.log('Error cargando universidad:', error);
    }
  };

  const seleccionarUniversidad = async (universidad: Universidad) => {
    try {
      await AsyncStorage.setItem('universidadSeleccionada', universidad.id.toString());
      await AsyncStorage.setItem('universidadNombre', universidad.nombre);

      setUniversidadSeleccionada(universidad.id);
      //router.back();
    } catch (error) {
      console.log('Error guardando universidad:', error);
    }
  };

  useEffect(() => {
    cargarUniversidadGuardada();
  }, []);

  return (
    <SafeAreaView className="flex h-full bg-white">
      {/* Header */}
      <View className="w-full flex justify-start items-start p-5 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#132e3c] text-lg font-JakartaBold">← Atrás</Text>
        </TouchableOpacity>
        <Text className="text-black text-3xl font-JakartaBold text-center w-full mt-4">
          Selecciona tu Universidad
        </Text>
        <Text className="text-gray-500 text-base font-Jakarta text-center w-full mt-2">
          Elige dónde quieres buscar restaurantes
        </Text>
      </View>

      {/* Lista de universidades */}
      <View className="flex-1 p-5">
        <FlatList
          data={Universidades}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = universidadSeleccionada === item.id;

            return (
              <TouchableOpacity
                onPress={() => seleccionarUniversidad(item)}
                style={{
                  padding: 20,
                  borderRadius: 38,
                  marginBottom: 16,
                  borderWidth: isSelected ? 3 : 2,
                  borderColor: isSelected ? '#132e3c' : '#D1D5DB',
                  backgroundColor: '#132e3c',
                  overflow: 'hidden',
                  opacity: isSelected ? 1 : 0.8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isSelected ? 0.2 : 0.1,
                  shadowRadius: 8,
                  elevation: isSelected ? 8 : 3,
                }}
              >
                {/* Imagen de fondo con opacidad */}
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
                      {item.nombre}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: '#FFFFFF',
                      marginTop: 4,
                      textShadowColor: 'rgba(0,0,0,0.8)',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 1
                    }}>
                      {item.ciudad}
                    </Text>
                  </View>

                  {/* Indicador de selección */}
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: isSelected ? '#132e3c' : '#D1D5DB',
                    backgroundColor: isSelected ? '#132e3c' : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {isSelected && (
                      <Text style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 'bold'
                      }}>✓</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default UniSelection;