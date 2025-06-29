/* eslint-disable prettier/prettier */
import { Text, TouchableOpacity, View, FlatList, Image } from "react-native";
import { router } from 'expo-router';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import { Stack } from "expo-router";
import { Star, Clock } from "lucide-react-native"

const menuRestaurante = () => {
  const [restauranteActual, setRestauranteActual] = useState('');
  const [idRestaurante, setRestauranteId] = useState(0);
  const [itemsMenu, setItemsMenu] = useState<Plato[]>([]);
  const [imagenRestaurante, setImagenRestaurante] = useState<any>(null);
  const [tiempoEntrega, setTiempoEntrega] = useState(0);
  const [calificacion, setCalificacion] = useState(0);
  const [categorias, setCategorias] = useState<string[]>([]);

  const {
    obtenerRestaurantePorId
  } = useRestaurantes();

  useFocusEffect(
    useCallback(() => {
      cargarDatosRestaurante();
    }, [])
  );

  const cargarDatosRestaurante = async () => {
    const nombreRestaurante = await AsyncStorage.getItem('restauranteNombre');
    const idRestaurante = await AsyncStorage.getItem('restauranteSeleccionado');

    if (nombreRestaurante) {
      setRestauranteActual(nombreRestaurante);
    }

    if (idRestaurante) {
      const id = parseInt(idRestaurante);
      setRestauranteId(id);

      const restaurante = obtenerRestaurantePorId(id);

      if (restaurante) {
        setItemsMenu(restaurante.menu);
        setImagenRestaurante(restaurante.imagen);
        setCalificacion(restaurante.calificacionRestaurante)
        setTiempoEntrega(restaurante.tiempoEntrega)
        setCategorias(restaurante.categorias)
      }
    }
  };

  const seleccionarPlato = async (plato: Plato) => {
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full bg-white">
        {/* Header con imagen de fondo que llega hasta arriba del celular */}
        <View className="relative w-full pt-12 pb-6 px-5">
          {/* Imagen de fondo solo en el header con bordes curvos */}
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

          {/* Contenedor relativo para posicionar elementos */}
          <View className="relative mb-4 h-12">
            {/* Botón X - Contenedor separado, posicionado a la izquierda */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
            >
              <Text className="text-[#132e3c] text-2xl font-JakartaBold">✕</Text>
            </TouchableOpacity>

            {/* Nombre del restaurante - Contenedor separado, centrado */}
            <View className="absolute left-0 right-0 top-0 flex items-center justify-center z-10">
              <Text className="text-[#132e3c] font-JakartaExtraBold text-5xl text-center absolute top-6 opacity-90">
                {restauranteActual}
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
                    {calificacion}
                  </Text>
                </View>
              </View>

              <View style={{width:60}}></View>

              {/* Columna de Entrega */}
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

        {/* Barra que mostrará las categorías principales del restaurante */}
        <View className="px-10 bg-[#132e3c] items-center justify-center">
          <Text className="text-white font-JakartaExtraBold m-4">
            {categorias.join(' • ')}
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
                {/* Título de la categoría */}
                <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4 ml-2">
                  {categoria}
                </Text>

                {/* Fila de platos de esta categoría */}
                <FlatList
                  data={platos}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(plato) => plato.idPlato.toString()}
                  contentContainerStyle={{ paddingHorizontal: 8 }}
                  renderItem={({ item: plato }) => (
                    <TouchableOpacity
                      onPress={() => seleccionarPlato(plato)}
                      className="bg-white rounded-xl mr-4 shadow-sm border border-gray-100"
                      style={{
                        width: 160,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      {/* Imagen del plato */}
                      <View className="h-32 bg-gray-200 rounded-t-xl mb-3 relative">
                        <View className="absolute inset-0 bg-gray-300 rounded-t-xl flex items-center justify-center">
                          <Image source={plato.imagen}/>
                        </View>

                        {/* Botón + en la esquina */}
                        <TouchableOpacity
                          className="absolute top-2 right-2 w-8 h-8 bg-[#132e3c] rounded-full flex items-center justify-center"
                          onPress={() => seleccionarPlato(plato)}
                        >
                          <Text className="text-white text-lg font-bold">+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Información del plato */}
                      <View className="px-3 pb-4">
                        <Text className="text-[#132e3c] text-sm font-JakartaBold mb-1" numberOfLines={2}>
                          {plato.nombre}
                        </Text>

                        <Text className="text-[#132e3c] text-lg font-JakartaExtraBold">
                          {formatearPrecio(plato.precio)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          />
        </View>
      </View>
    </>
  );
};

export default menuRestaurante;