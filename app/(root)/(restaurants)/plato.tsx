/* eslint-disable prettier/prettier */
// (root)/(restaurants)/plato.tsx
import { Text, TouchableOpacity, View, ScrollView, Image, TextInput } from "react-native";
import { router } from 'expo-router';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useRestaurantes, type Plato as PlatoType } from '@/hooks/useRestaurantes';
import { useCarrito } from '@/context/contextCarrito';
import { usePlato } from '@/hooks/usePlato';
import { Stack } from "expo-router";
import { Plus, Minus } from "lucide-react-native";
import { ToppingCheckbox } from '@/components/checkboxCustom';

const plato = () => {
  const [platoActual, setPlatoActual] = useState<PlatoType | null>(null);
  const [idRestaurante, setIdRestaurante] = useState(0);
  const [restauranteNombre, setRestauranteNombre] = useState('');
  const [platoNombre, setPlatoNombre] = useState('');
  const [universidadActual, setUniversidadActual] = useState('')

  const { obtenerPlatoPorId } = useRestaurantes();
  const { agregarAlCarrito, obtenerCantidadTotalCarrito } = useCarrito();

  // Hook de plato - siempre se ejecuta con los mismos parámetros
  const platoHook = usePlato({
    plato: platoActual,
    idRestaurante,
    nombreRestaurante: restauranteNombre,
    nombreUniversidad: universidadActual
  });

  useFocusEffect(
    useCallback(() => {
      cargarDatosPlato();
    }, [])
  );

  const cargarDatosPlato = async () => {
    const platoId = await AsyncStorage.getItem('platoSeleccionado');
    const restauranteId = await AsyncStorage.getItem('restauranteSeleccionado');
    const nombreRestaurante = await AsyncStorage.getItem('restauranteNombre');
    const nombrePlato = await AsyncStorage.getItem('platoNombre');
    const nombreUniversidad = await AsyncStorage.getItem('universidadNombre')

    if (restauranteId && platoId) {
      const idRest = parseInt(restauranteId);
      const idPlato = parseInt(platoId);

      setIdRestaurante(idRest);

      const plato = obtenerPlatoPorId(idRest, idPlato);
      if (plato) {
        setPlatoActual(plato);
      }
    }

    if (nombreRestaurante) {
      setRestauranteNombre(nombreRestaurante);
    }

    if (nombrePlato) {
      setPlatoNombre(nombrePlato);
    }
    if (nombreUniversidad) {
      setUniversidadActual(nombreUniversidad)
    }
  };

  const handleAgregarAlCarrito = async () => {
    const platoCarrito = platoHook.crearPlatoParaCarrito();

    if (!platoCarrito || !platoHook.puedeAgregarAlCarrito) {
      return;
    }

    const idUnico = agregarAlCarrito(platoCarrito);

    if (idUnico) {
      platoHook.limpiarSelecciones();

      // Esperar un poco para que el estado se actualice
      setTimeout(() => {
        router.back();
      }, 100);
    }
  };

  const incrementarCantidad = () => {
    platoHook.setCantidad(platoHook.cantidad + 1);
  };

  const decrementarCantidad = () => {
    if (platoHook.cantidad > 1) {
      platoHook.setCantidad(platoHook.cantidad - 1);
    }
  };

  const formatearPrecio = (precio: number) => {
    return `$${precio.toLocaleString('es-CO')}`;
  };

  if (!platoActual || !platoHook.platoDisponible) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-[#132e3c] font-JakartaMedium">Cargando...</Text>
      </View>
    );
  }

  const {
    cantidad,
    comentarios,
    precioTotal,
    puedeAgregarAlCarrito,
    setComentarios,
    toggleToppingAdicional,
    toggleToppingBase,
    isToppingAdicionalSeleccionado,
    isToppingBaseRemovido
  } = platoHook;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full bg-white">

        {/* Header con imagen de fondo */}
        <View className="relative w-full pt-12 pb-6 px-5">
          <View className="absolute inset-0">
            <Image
              source={platoActual.imagen}
              className="w-full h-full"
              resizeMode="cover"
              style={{
                opacity: 0.3,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30
              }}
            />
          </View>

          {/* Header controls */}
          <View className="relative mb-4 h-12">
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
            >
              <Text className="text-[#132e3c] text-2xl font-JakartaBold">✕</Text>
            </TouchableOpacity>

            <View className="absolute left-0 right-0 top-0 flex items-center justify-center z-10">
              <Text className="text-[#132e3c] font-JakartaExtraBold text-3xl text-center absolute top-6 opacity-90">
                {platoNombre}
              </Text>
            </View>
          </View>

          {/* Caja de información con descripcion de plato */}
          <View
            className="bg-[#132e3c] px-8 py-4 rounded-full self-center relative z-10 mt-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center justify-center">
              <Text
                className="text-white text-lg font-JakartaExtraLight justify-center"
                style={{ textAlign: 'center' }}
              >
                {platoActual.descripcion}
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        <View
          className="px-20 bg-[#132e3c] items-center justify-center"
          style={{ height: 35 }}
        >
          <Text> </Text>
        </View>

        {/* Contenido scrolleable */}
        <ScrollView className="flex-1 px-5 bg-white" showsVerticalScrollIndicator={false}>

          {/* Toppings Base Removibles */}
          {platoActual.toppingsBase.length > 0 && platoActual.toppingsBase.some(t => t.removible) && (
            <View className="mb-6">
              <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4">
                Incluye (puedes remover):
              </Text>
              {platoActual.toppingsBase
                .filter(topping => topping.removible)
                .map(topping => (
                  <ToppingCheckbox
                    key={topping.id}
                    topping={topping}
                    checked={!isToppingBaseRemovido(topping.id)}
                    onToggle={toggleToppingBase}
                    type="base"
                    formatearPrecio={formatearPrecio}
                  />
                ))}
            </View>
          )}

          {/* Toppings Adicionales */}
          {platoActual.toppingsDisponibles.length > 0 && (
            <View className="mb-6">
              <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4">
                {platoActual.tipoPlato === 'personalizable' ? 'Elige tus ingredientes:' : 'Agregar extras:'}
              </Text>
              {platoActual.toppingsDisponibles.map(topping => (
                <ToppingCheckbox
                  key={topping.id}
                  topping={topping}
                  checked={isToppingAdicionalSeleccionado(topping.id)}
                  onToggle={toggleToppingAdicional}
                  type="adicional"
                  formatearPrecio={formatearPrecio}
                />
              ))}
            </View>
          )}

          {/* Mensaje para platos personalizables */}
          {platoActual.tipoPlato === 'personalizable' && !puedeAgregarAlCarrito && (
            <View className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <Text className="text-yellow-800 font-JakartaMedium text-sm text-center">
                Este plato es personalizable. Debes agregar al menos un ingrediente.
              </Text>
            </View>
          )}

          {/* Caja de Comentarios */}
          <View className="mb-6">
            <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4">
              Comentarios adicionales:
            </Text>
            <View
              className="bg-white rounded-xl border border-gray-200 p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <TextInput
                value={comentarios}
                onChangeText={setComentarios}
                placeholder="Ej: Sin cebolla, punto medio, extra salsa..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={200}
                className="text-[#132e3c] font-JakartaMedium text-base"
                style={{
                  textAlignVertical: 'top',
                  minHeight: 60,
                }}
              />
              <Text className="text-gray-500 font-JakartaLight text-xs mt-2 text-right">
                {comentarios.length}/200
              </Text>
            </View>
          </View>

          {/* Espaciado inferior para el footer fijo */}
          <View className="h-32" />
        </ScrollView>

        {/* Footer fijo - Cantidad y Agregar al carrito */}
        <View className="bg-white border-t border-gray-200 px-5 py-4">
          <View className="flex-row items-center justify-between mb-4">
            {/* Control de cantidad */}
            <View className="flex-row items-center">
              <Text className="text-[#132e3c] font-JakartaBold text-base mr-4">
                Cantidad:
              </Text>
              <View className="flex-row items-center bg-gray-100 rounded-full">
                <TouchableOpacity
                  onPress={decrementarCantidad}
                  disabled={cantidad <= 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  <Minus size={20} color={cantidad <= 1 ? "#9CA3AF" : "#132e3c"} />
                </TouchableOpacity>

                <Text className="text-[#132e3c] font-JakartaBold text-lg px-4">
                  {cantidad}
                </Text>

                <TouchableOpacity
                  onPress={incrementarCantidad}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                >
                  <Plus size={20} color="#132e3c" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Precio unitario */}
            <View className="items-end">
              <Text className="text-gray-600 font-JakartaMedium text-sm">
                Precio unitario:
              </Text>
              <Text className="text-[#132e3c] font-JakartaExtraBold text-lg">
                {formatearPrecio(precioTotal)}
              </Text>
            </View>
          </View>

          {/* Botón Agregar al Carrito */}
          <TouchableOpacity
            onPress={handleAgregarAlCarrito}
            disabled={!puedeAgregarAlCarrito}
            className={`py-4 rounded-xl flex items-center justify-center ${puedeAgregarAlCarrito ? 'bg-[#132e3c]' : 'bg-gray-300'
              }`}
            style={puedeAgregarAlCarrito ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            } : {}}
          >
            <Text className={`font-JakartaBold text-lg ${puedeAgregarAlCarrito ? 'text-white' : 'text-gray-500'
              }`}>
              Agregar al carrito - {formatearPrecio(precioTotal * cantidad)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default plato;

