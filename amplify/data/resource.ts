import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Universidad: a
    .model({
      nombre: a.string().required(),
      ciudad: a.string().required(),
      imagen: a.string(),
      restaurantes: a.hasMany('Restaurante', 'universidadId'),
    })
    .authorization((allow) => [allow.guest()]),

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
    .authorization((allow) => [allow.guest()]),

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
    .authorization((allow) => [allow.guest()]),

  Topping: a
    .model({
      nombre: a.string().required(),
      precio: a.integer(),
      removible: a.boolean(),
      categoria: a.string(),
      platoId: a.id().required(),
      plato: a.belongsTo('Plato', 'platoId'),
    })
    .authorization((allow) => [allow.guest()]),

  Pedido: a
    .model({
      usuario: a.string().required(),
      restauranteId: a.id().required(),
      restaurante: a.belongsTo('Restaurante', 'restauranteId'),
      total: a.integer().required(),
      estado: a.enum(['pendiente', 'preparando', 'listo', 'entregado']),
      comentarios: a.string(),
      fechaPedido: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});