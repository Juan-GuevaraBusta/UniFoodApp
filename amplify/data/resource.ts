import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Universidad: a
    .model({
      nombre: a.string().required(),
      ciudad: a.string().required(),
      imagen: a.string(),
      restaurantes: a.hasMany('Restaurante', 'universidadId'),
    })
    .authorization((allow) => [
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
    })
    .authorization((allow) => [
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
    })
    .authorization((allow) => [
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
    .authorization((allow) => [
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ✅ MODELO COMPLETO de pedidos para la vida real
  Pedido: a
    .model({
      // Información básica del pedido
      numeroOrden: a.string().required(), // Código corto como #A1B2C-D3E
      usuarioEmail: a.string().required(),
      restauranteId: a.id().required(),
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
      tiempoEstimado: a.integer(), // minutos

      // Información del cliente (para mostrar en el restaurante)
      clienteNombre: a.string(),
      clienteTelefono: a.string(),

      // Items del pedido en JSON para simplicidad
      itemsPedido: a.json().required(), // Array de items con toda la info

      // Información de la universidad para filtros
      universidadId: a.integer().required(),

      // Índices para consultas eficientes
      restauranteEstado: a.string().required(), // "restauranteId#estado" para filtrar
    })
    .authorization((allow) => [
      // Cualquier usuario autenticado puede crear y leer pedidos
      allow.authenticated().to(['create', 'read', 'update']),
      // Los invitados pueden leer (por si es necesario)
      allow.guest().to(['read']),
    ])
    // Índices para consultas eficientes
    .secondaryIndexes((index) => [
      index('restauranteEstado'), // Para obtener pedidos por restaurante y estado
      index('usuarioEmail'), // Para obtener pedidos por usuario
      index('restauranteId'), // Para obtener todos los pedidos de un restaurante
    ]),
});

// ✅ CRÍTICO: Exportar el tipo Schema
export type Schema = ClientSchema<typeof schema>;

// ✅ CRÍTICO: Exportar la configuración de data
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Mantener userPool para autenticación real
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});