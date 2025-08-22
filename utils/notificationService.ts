import * as Notifications from 'expo-notifications';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  // NOTIFICACIONES PARA USUARIOS (CLIENTES)
  
  // Pedido confirmado
  static async notifyPedidoConfirmado(pedidoId: string, restaurante: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Pedido Confirmado',
        body: `Tu pedido #${pedidoId} ha sido confirmado por ${restaurante}`,
        data: { 
          type: 'pedido_confirmado', 
          pedidoId, 
          restaurante,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null, // Enviar inmediatamente
    });
  }

  // Pedido aceptado
  static async notifyPedidoAceptado(pedidoId: string, restaurante: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍕 Pedido Aceptado',
        body: `${restaurante} ha aceptado tu pedido #${pedidoId}`,
        data: { 
          type: 'pedido_aceptado', 
          pedidoId, 
          restaurante,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Pedido cancelado
  static async notifyPedidoCancelado(pedidoId: string, restaurante: string, motivo?: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❌ Pedido Cancelado',
        body: `Tu pedido #${pedidoId} ha sido cancelado${motivo ? `: ${motivo}` : ''}`,
        data: { 
          type: 'pedido_cancelado', 
          pedidoId, 
          restaurante,
          motivo,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Pedido listo pronto
  static async notifyPedidoListoPronto(pedidoId: string, restaurante: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Tu pedido estará listo pronto',
        body: `${restaurante} está terminando tu pedido #${pedidoId}`,
        data: { 
          type: 'pedido_listo_pronto', 
          pedidoId, 
          restaurante,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Pedido entregado
  static async notifyPedidoEntregado(pedidoId: string, restaurante: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Pedido Entregado',
        body: `Tu pedido #${pedidoId} ha sido entregado. ¡Disfruta tu comida!`,
        data: { 
          type: 'pedido_entregado', 
          pedidoId, 
          restaurante,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // NOTIFICACIONES PARA RESTAURANTES

  // Nuevo pedido recibido
  static async notifyNuevoPedidoRestaurante(pedidoId: string, cliente: string, items: string[]) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🆕 Nuevo Pedido Recibido',
        body: `Pedido #${pedidoId} de ${cliente}: ${items.join(', ')}`,
        data: { 
          type: 'nuevo_pedido_restaurante', 
          pedidoId, 
          cliente,
          items,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Pedido listo para entregar
  static async notifyPedidoListoEntregar(pedidoId: string, cliente: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Pedido Listo para Entregar',
        body: `El pedido #${pedidoId} de ${cliente} está listo para entregar`,
        data: { 
          type: 'pedido_listo_entregar', 
          pedidoId, 
          cliente,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Recordatorio de pedidos pendientes
  static async notifyPedidosPendientes(cantidad: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Pedidos Pendientes',
        body: `Tienes ${cantidad} pedido${cantidad > 1 ? 's' : ''} pendiente${cantidad > 1 ? 's' : ''} por procesar`,
        data: { 
          type: 'pedidos_pendientes', 
          cantidad,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // NOTIFICACIONES DE PRUEBA (para testing)

  // Notificación de prueba inmediata
  static async testNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Prueba de Notificación',
        body: 'Esta es una notificación de prueba para verificar que funcionan correctamente',
        data: { 
          type: 'test', 
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: null,
    });
  }

  // Notificación de prueba programada
  static async testDelayedNotification(segundos: number = 5) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Notificación Programada',
        body: `Esta notificación se envió ${segundos} segundos después`,
        data: { 
          type: 'test_delayed', 
          segundos,
          timestamp: new Date().toISOString() 
        },
        sound: 'default',
      },
      trigger: { seconds: segundos },
    });
  }
}
