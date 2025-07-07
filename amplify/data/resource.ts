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

  Pedido: a
    .model({
      usuarioEmail: a.string().required(),
      restauranteId: a.id().required(),
      restaurante: a.belongsTo('Restaurante', 'restauranteId'),
      total: a.integer().required(),
      estado: a.enum(['pendiente', 'preparando', 'listo', 'entregado', 'cancelado']),
      comentarios: a.string(),
      fechaPedido: a.datetime(),
      numeroOrden: a.string(),
      // Información del pedido en JSON para simplicidad
      itemsPedido: a.json(), // Array de items con toda la info
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});