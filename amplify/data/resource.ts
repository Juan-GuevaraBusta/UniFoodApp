import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Universidad: a
    .model({
      nombre: a.string().required(),
      ciudad: a.string().required(),
      imagen: a.string(),
      restaurantes: a.hasMany('Restaurante', 'universidadId'),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  Restaurante: a
    .model({
      nombre: a.string().required(),
      universidadId: a.id().required(),
      universidad: a.belongsTo('Universidad', 'universidadId'),
      imagen: a.string(),
      categorias: a.string().array(),
      calificacion: a.float(),
      tiempoEntrega: a.integer(),
      platos: a.hasMany('Plato', 'restauranteId'),
      pedidos: a.hasMany('Pedido', 'restauranteId'),
      disponibilidadPlatos: a.hasMany('DisponibilidadPlato', 'restauranteId'),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  Plato: a
    .model({
      nombre: a.string().required(),
      descripcion: a.string(),
      precio: a.integer().required(),
      categoria: a.string().required(),
      imagen: a.string(),
      tipoPlato: a.enum(['simple', 'fijo', 'mixto', 'personalizable']),
      restauranteId: a.id().required(),
      restaurante: a.belongsTo('Restaurante', 'restauranteId'),
      toppings: a.hasMany('Topping', 'platoId'),
      disponibilidad: a.hasMany('DisponibilidadPlato', 'platoId'),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  Topping: a
    .model({
      nombre: a.string().required(),
      precio: a.integer(),
      removible: a.boolean(),
      categoria: a.string(),
      platoId: a.id().required(),
      plato: a.belongsTo('Plato', 'platoId'),
    })
    .authorization((allow: any) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ✅ MODELO PEDIDO CORREGIDO - Sin usar owner() que causa el error
  Pedido: a
    .model({
      // Información básica del pedido
      numeroOrden: a.string().required(),
      usuarioEmail: a.string().required(),
      restauranteId: a.string().required(),
      restaurante: a.belongsTo('Restaurante', 'restauranteId'),

      // Información financiera
      subtotal: a.integer().required(),
      tarifaServicio: a.integer().required(),
      total: a.integer().required(),

      // Estado y fechas
      estado: a.enum(['pendiente', 'aceptado', 'preparando', 'listo', 'entregado', 'cancelado']),
      fechaPedido: a.datetime().required(),
      fechaAceptado: a.datetime(),
      fechaListo: a.datetime(),
      fechaEntregado: a.datetime(),

      // Información adicional
      comentariosCliente: a.string(),
      comentariosRestaurante: a.string(),
      tiempoEstimado: a.integer(),

      // Información del cliente (para mostrar en el restaurante)
      clienteNombre: a.string(),
      clienteTelefono: a.string(),

      // Items del pedido en JSON
      itemsPedido: a.json().required(),

      // Información de la universidad para filtros
      universidadId: a.integer().required(),

      // Índice para consultas eficientes
      restauranteEstado: a.string().required(),
    })
    .authorization((allow: any) => [
      // ✅ Permitir autenticados crear, leer y actualizar
      allow.authenticated().to(['create', 'read', 'update']),
      // ✅ Permitir API Key para lectura (para casos de emergencia)
      allow.guest().to(['read']),
    ])
    // ✅ Índices secundarios para consultas eficientes
    .secondaryIndexes((index: any) => [
      index('restauranteEstado').sortKeys(['fechaPedido']), // Para pedidos por restaurante y estado
      index('usuarioEmail').sortKeys(['fechaPedido']), // Para pedidos por usuario
      index('restauranteId').sortKeys(['fechaPedido']), // Para todos los pedidos de un restaurante
    ]),

  // ✅ MODELO DISPONIBILIDAD PLATO - Para sincronización en tiempo real
  DisponibilidadPlato: a
    .model({
      // Identificación del plato y restaurante
      platoId: a.string().required(),
      restauranteId: a.string().required(),

      // Estado de disponibilidad
      disponible: a.boolean().required(),

      // Información adicional
      comentario: a.string(),
      fechaActualizacion: a.datetime().required(),

      // Relaciones
      restaurante: a.belongsTo('Restaurante', 'restauranteId'),
      plato: a.belongsTo('Plato', 'platoId'),

      // Índice compuesto para consultas eficientes
      restaurantePlato: a.string().required(),
    })
    .authorization((allow: any) => [
      // ✅ Permitir autenticados crear, leer y actualizar
      allow.authenticated().to(['create', 'read', 'update']),
      // ✅ Permitir API Key para lectura (para casos de emergencia)
      allow.guest().to(['read']),
    ])
    // ✅ Índices secundarios para consultas eficientes
    .secondaryIndexes((index: any) => [
      index('restaurantePlato').sortKeys(['fechaActualizacion']), // Para disponibilidad por restaurante y plato
      index('restauranteId').sortKeys(['fechaActualizacion']), // Para todos los platos de un restaurante
      index('platoId').sortKeys(['fechaActualizacion']), // Para un plato específico
    ]),
});

// ✅ CRÍTICO: Exportar el tipo Schema
export type Schema = ClientSchema<typeof schema>;

// ✅ CRÍTICO: Exportar la configuración de data
export const data = defineData({
  schema,
  authorizationModes: {
    // ✅ userPool como modo primario
    defaultAuthorizationMode: 'userPool',
    // ✅ API Key como secundario
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});