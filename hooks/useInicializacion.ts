// hooks/useInicializacion.ts - Inicializar disponibilidad desde restaurantes.json
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import restaurantesData from '../assets/data/restaurantes.json';

export const useInicializacion = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    inicializarDisponibilidad();
  }, []);

  const inicializarDisponibilidad = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Verificando inicialización de disponibilidad...');

      // ✅ Verificar si ya está inicializado
      const keys = await AsyncStorage.getAllKeys();
      const disponibilidadKeys = keys.filter(key => key.startsWith('disponibilidad_'));
      
      if (disponibilidadKeys.length > 0) {
        console.log('✅ Disponibilidad ya inicializada');
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      console.log('📝 Inicializando disponibilidad desde restaurantes.json...');

      // ✅ Inicializar disponibilidad para todos los platos
      for (const restaurante of restaurantesData) {
        for (const plato of restaurante.menu) {
          const key = `disponibilidad_${restaurante.idRestaurante}_${plato.idPlato}`;
          const data = {
            platoId: plato.idPlato.toString(),
            restauranteId: restaurante.idRestaurante.toString(),
            disponible: plato.disponible,
            fechaActualizacion: new Date().toISOString(),
            comentario: `Inicializado desde restaurantes.json - ${plato.disponible ? 'Disponible' : 'No disponible'}`,
          };

          await AsyncStorage.setItem(key, JSON.stringify(data));
        }
      }

      console.log('✅ Disponibilidad inicializada exitosamente');
      setIsInitialized(true);

    } catch (error) {
      console.error('❌ Error inicializando disponibilidad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reinicializarDisponibilidad = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Reinicializando disponibilidad desde JSON...');

      // ✅ Limpiar disponibilidad existente
      const keys = await AsyncStorage.getAllKeys();
      const disponibilidadKeys = keys.filter(key => key.startsWith('disponibilidad_'));
      
      for (const key of disponibilidadKeys) {
        await AsyncStorage.removeItem(key);
      }

      // ✅ Reinicializar desde JSON (todos disponibles)
      await inicializarDisponibilidad();

      console.log('✅ Disponibilidad reinicializada - todos los platos disponibles desde JSON');

    } catch (error) {
      console.error('❌ Error reinicializando disponibilidad:', error);
    }
  };

  return {
    isInitialized,
    isLoading,
    reinicializarDisponibilidad,
  };
};
