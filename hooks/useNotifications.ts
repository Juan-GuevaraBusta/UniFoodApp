import { useEffect, useRef, useState } from 'react';
import { Platform, Alert } from 'react-native';

// ✅ Hook simplificado para notificaciones locales
export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<any>();

  useEffect(() => {
    console.log('🔔 NOTIFICATIONS - Hook inicializado');
  }, []);

  // ✅ Función para enviar notificación local (simplificada)
  const sendLocalNotification = async (title: string, body: string, data?: any) => {
    try {
      console.log('🔔 NOTIFICATIONS - Enviando notificación:', { title, body, data });

      // ✅ Para desarrollo, usar Alert nativo
      if (Platform.OS !== 'web') {
        Alert.alert(title, body, [
          {
            text: 'OK',
            onPress: () => console.log('✅ NOTIFICATIONS - Usuario cerró notificación')
          }
        ]);
      }

      console.log('✅ NOTIFICATIONS - Notificación enviada exitosamente');
    } catch (error) {
      console.error('❌ NOTIFICATIONS - Error enviando notificación:', error);
    }
  };

  return {
    expoPushToken, // Siempre vacío para evitar errores
    notification,
    sendLocalNotification,
  };
};
