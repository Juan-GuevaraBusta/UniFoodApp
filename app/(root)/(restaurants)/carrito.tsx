/* eslint-disable prettier/prettier */
// app/(root)/(restaurants)/carrito.tsx - Actualizado para navegar a pago
import { Text, TouchableOpacity, View, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from 'expo-router';
import { useCarrito } from '@/context/contextCarrito';
import { Stack } from "expo-router";
import { Plus, Minus, Trash2, ArrowLeft, CreditCard } from "lucide-react-native";

const Carrito = () => {
  const {
    carrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    calcularTotalCarrito,
    obtenerCantidadTotalCarrito,
    limpiarCarrito
  } = useCarrito();

  // Función para formatear precio
  const formatearPrecio = (precio: number) => {
    return `$${precio.toLocaleString('es-CO')}`;
  };

  // Calcular totales
  const subtotal = calcularTotalCarrito();
  const tarifaServicio = Math.round(subtotal * 0.05); // 5% de tarifa de servicio
  const total = subtotal + tarifaServicio;

  // Función para proceder al pago - ACTUALIZADA
  const procederAlPago = async () => {
    if (carrito.length === 0) {
      Alert.alert('Error', 'El carrito está vacío');
      return;
    }

    // Navegar a la pantalla de pago con el total
    router.push({
      pathname: '/(root)/(restaurants)/pagoPlato',
      params: { total: total.toString() }
    });
  };

  if (carrito.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft size={20} color="#132e3c" />
            </TouchableOpacity>
            <Text className="text-[#132e3c] text-xl font-JakartaBold">Mi Carrito</Text>
            <View className="w-10" />
          </View>

          {/* Carrito vacío */}
          <View className="flex-1 justify-center items-center px-8">
            <Text className="text-gray-400 text-6xl mb-4">🛒</Text>
            <Text className="text-[#132e3c] text-xl font-JakartaBold text-center mb-2">
              Tu carrito está vacío
            </Text>
            <Text className="text-gray-500 font-JakartaMedium text-center mb-6">
              Agrega algunos deliciosos platos para comenzar
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-[#132e3c] px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-JakartaBold text-base">
                Explorar Restaurantes
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={20} color="#132e3c" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-[#132e3c] text-xl font-JakartaBold">Mi Carrito</Text>
            <Text className="text-gray-500 text-sm font-JakartaMedium">
              {obtenerCantidadTotalCarrito()} {obtenerCantidadTotalCarrito() === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={limpiarCarrito}
            className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Lista de productos */}
        <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
          {carrito.map((item) => (
            <View
              key={item.idUnico}
              className="bg-white rounded-xl border border-gray-200 mb-4 p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              {/* Información principal del plato */}
              <View className="flex-row mb-3">
                <Image
                  source={item.plato.imagen}
                  className="w-16 h-16 rounded-lg mr-3"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-[#132e3c] font-JakartaBold text-base mb-1">
                    {item.plato.nombre}
                  </Text>
                  <Text className="text-gray-600 font-JakartaMedium text-sm">
                    Precio base: {formatearPrecio(item.plato.precio)}
                  </Text>
                  <Text className="text-[#132e3c] font-JakartaBold text-base mt-1">
                    Total: {formatearPrecio(item.precioTotal)}
                  </Text>
                </View>
              </View>

              {/* Toppings agregados */}
              {item.toppingsSeleccionados.length > 0 && (
                <View className="mb-3">
                  <Text className="text-[#132e3c] font-JakartaBold text-sm mb-2">
                    ✅ Agregados:
                  </Text>
                  {item.toppingsSeleccionados.map((topping, index) => (
                    <View key={`${topping.id}-${index}`} className="flex-row justify-between mb-1">
                      <Text className="text-green-600 font-JakartaMedium text-sm">
                        + {topping.nombre}
                      </Text>
                      <Text className="text-green-600 font-JakartaBold text-sm">
                        +{formatearPrecio(topping.precio || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Toppings removidos */}
              {item.toppingsBaseRemocionados.length > 0 && (
                <View className="mb-3">
                  <Text className="text-[#132e3c] font-JakartaBold text-sm mb-2">
                    ❌ Removidos:
                  </Text>
                  {item.toppingsBaseRemocionados.map((toppingId) => {
                    const topping = item.plato.toppingsBase.find(t => t.id === toppingId);
                    return topping ? (
                      <Text key={toppingId} className="text-red-500 font-JakartaMedium text-sm mb-1">
                        - {topping.nombre}
                      </Text>
                    ) : null;
                  })}
                </View>
              )}

              {/* Info del restaurante */}
              {carrito.length > 0 && (
                <View className="items-center mt-1">
                  <Text className="text-gray-600 text-xs font-JakartaLight">
                    {carrito[0].nombreUniversidad} • {carrito[0].nombreRestaurante}
                  </Text>
                </View>
              )}

              {/* Comentarios */}
              {item.comentarios && item.comentarios.trim() !== '' && (
                <View className="mb-3">
                  <Text className="text-[#132e3c] font-JakartaBold text-sm mb-1">
                    💬 Comentarios:
                  </Text>
                  <Text className="text-gray-600 font-JakartaMedium text-sm italic">
                    "{item.comentarios}"
                  </Text>
                </View>
              )}

              {/* Controles de cantidad y eliminar */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <View className="flex-row items-center bg-gray-100 rounded-full">
                  <TouchableOpacity
                    onPress={() => actualizarCantidadCarrito(item.idUnico, item.cantidad - 1)}
                    disabled={item.cantidad <= 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <Minus size={16} color={item.cantidad <= 1 ? "#9CA3AF" : "#132e3c"} />
                  </TouchableOpacity>

                  <Text className="text-[#132e3c] font-JakartaBold text-base px-3">
                    {item.cantidad}
                  </Text>

                  <TouchableOpacity
                    onPress={() => actualizarCantidadCarrito(item.idUnico, item.cantidad + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <Plus size={16} color="#132e3c" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-[#132e3c] font-JakartaBold text-lg mr-3">
                    {formatearPrecio(item.precioTotal * item.cantidad)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => eliminarDelCarrito(item.idUnico)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Espaciado para el footer */}
          <View className="h-32" />
        </ScrollView>

        {/* Footer con totales y botón de proceder al pago - ACTUALIZADO */}
        <View className="bg-white border-t border-gray-200 px-5 py-4">
          {/* Resumen de costos */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 font-JakartaMedium">
                Subtotal ({obtenerCantidadTotalCarrito()} productos)
              </Text>
              <Text className="text-gray-600 font-JakartaMedium">
                {formatearPrecio(subtotal)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 font-JakartaMedium">
                Tarifa de servicio (5%)
              </Text>
              <Text className="text-gray-600 font-JakartaMedium">
                {formatearPrecio(tarifaServicio)}
              </Text>
            </View>

            <View className="border-t border-gray-200 pt-2">
              <View className="flex-row justify-between">
                <Text className="text-[#132e3c] font-JakartaBold text-lg">
                  Total
                </Text>
                <Text className="text-[#132e3c] font-JakartaBold text-lg">
                  {formatearPrecio(total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Botón de proceder al pago - ACTUALIZADO */}
          <TouchableOpacity
            onPress={procederAlPago}
            className="py-4 rounded-xl flex-row items-center justify-center bg-[#132e3c]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <CreditCard size={20} color="white" />
            <Text className="text-white font-JakartaBold text-lg ml-3">
              Proceder al pago - {formatearPrecio(total)}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

export default Carrito;