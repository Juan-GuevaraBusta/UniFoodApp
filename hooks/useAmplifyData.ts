// hooks/useAmplifyData.ts - Versión directa usando GraphQL
import { generateClient } from 'aws-amplify/api';
import { useAuth } from './useAuth';

// ✅ Cliente directo de GraphQL
const client = generateClient();

// ✅ Queries y mutaciones directas en GraphQL
const CREATE_PEDIDO = `
  mutation CreatePedido($input: CreatePedidoInput!) {
    createPedido(input: $input) {
      id
      numeroOrden
      usuarioEmail
      restauranteId
      subtotal
      tarifaServicio
      total
      estado
      fechaPedido
      comentariosCliente
      universidadId
      restauranteEstado
      itemsPedido
      createdAt
      updatedAt
    }
  }
`;

const LIST_PEDIDOS_BY_RESTAURANTE = `
  query ListPedidosByRestaurante($filter: ModelPedidoFilterInput) {
    listPedidos(filter: $filter) {
      items {
        id
        numeroOrden
        usuarioEmail
        restauranteId
        subtotal
        tarifaServicio
        total
        estado
        fechaPedido
        fechaAceptado
        fechaListo
        fechaEntregado
        comentariosCliente
        comentariosRestaurante
        tiempoEstimado
        universidadId
        restauranteEstado
        itemsPedido
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_PEDIDO = `
  mutation UpdatePedido($input: UpdatePedidoInput!) {
    updatePedido(input: $input) {
      id
      numeroOrden
      estado
      fechaAceptado
      fechaListo
      fechaEntregado
      comentariosRestaurante
      tiempoEstimado
      restauranteEstado
      updatedAt
    }
  }
`;

const GET_PEDIDO = `
  query GetPedido($id: ID!) {
    getPedido(id: $id) {
      id
      restauranteId
      estado
    }
  }
`;

// ✅ Tipos para los resultados
interface PedidoResult {
    success: boolean;
    error?: string;
    numeroOrden?: string;
    pedidoId?: string;
    message?: string;
    pedido?: any;
    needsReauth?: boolean;
}

interface PedidosResult {
    success: boolean;
    error?: string;
    pedidos?: any[];
    restaurantInfo?: any;
    needsReauth?: boolean;
}

interface UpdateResult {
    success: boolean;
    error?: string;
    pedido?: any;
    needsReauth?: boolean;
}

export const useAmplifyData = () => {
    const { user, isAuthenticated, verificarSesion } = useAuth();

    const verificarAutenticacion = async () => {
        try {
            if (!isAuthenticated || !user?.email) {
                throw new Error('Usuario no autenticado localmente');
            }

            await verificarSesion();

            console.log('✅ Usuario autenticado verificado:', {
                email: user.email,
                role: user.role,
                isAuthenticated
            });

            return true;

        } catch (error) {
            console.error('❌ Error de autenticación:', error);
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
    };

    // ✅ CREAR PEDIDO usando GraphQL directo
    const crearPedido = async (carritoItems: any[], total: number): Promise<PedidoResult> => {
        try {
            console.log('📝 Creando pedido con GraphQL directo...');

            if (!carritoItems || carritoItems.length === 0) {
                return {
                    success: false,
                    error: 'El carrito está vacío'
                };
            }

            await verificarAutenticacion();

            const primerItem = carritoItems[0];
            const restauranteId = primerItem.idRestaurante.toString();
            const universidadId = primerItem.universidadId;
            const subtotal = total - Math.round(total * 0.05);
            const tarifaServicio = Math.round(total * 0.05);
            const numeroOrden = generateShortOrderNumber();

            const input = {
                numeroOrden,
                usuarioEmail: user!.email,
                restauranteId,
                subtotal,
                tarifaServicio,
                total,
                estado: 'pendiente',
                fechaPedido: new Date().toISOString(),
                comentariosCliente: carritoItems
                    .filter(item => item.comentarios?.trim())
                    .map(item => `${item.plato.nombre}: ${item.comentarios}`)
                    .join('; ') || undefined,
                universidadId,
                restauranteEstado: `${restauranteId}#pendiente`,
                itemsPedido: JSON.stringify(carritoItems.map(item => ({
                    platoId: item.plato.idPlato,
                    platoNombre: item.plato.nombre,
                    platoDescripcion: item.plato.descripcion,
                    precioUnitario: item.plato.precio,
                    cantidad: item.cantidad,
                    comentarios: item.comentarios || undefined,
                    toppingsSeleccionados: item.toppingsSeleccionados || [],
                    toppingsBaseRemocionados: item.toppingsBaseRemocionados || [],
                    precioTotal: item.precioTotal,
                    totalItem: item.precioTotal * item.cantidad,
                    idUnico: item.idUnico,
                    restauranteNombre: item.nombreRestaurante,
                    universidadNombre: item.nombreUniversidad
                })))
            };

            console.log('📋 Enviando mutación createPedido:', {
                numeroOrden,
                restauranteId,
                universidadId,
                total
            });

            const result = await client.graphql({
                query: CREATE_PEDIDO,
                variables: { input }
            });

            const pedido = result.data?.createPedido;
            if (!pedido) {
                return {
                    success: false,
                    error: 'No se pudo crear el pedido'
                };
            }

            console.log('✅ Pedido creado exitosamente:', pedido);

            return {
                success: true,
                numeroOrden: pedido.numeroOrden,
                pedidoId: pedido.id,
                message: 'Pedido enviado al restaurante',
                pedido
            };

        } catch (error: any) {
            console.error('❌ Error creando pedido:', error);

            if (error.message?.includes('autenticación') ||
                error.message?.includes('authentication')) {
                return {
                    success: false,
                    error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            return {
                success: false,
                error: error.message || 'Error interno al procesar el pedido'
            };
        }
    };

    // ✅ OBTENER PEDIDOS usando GraphQL directo
    const obtenerPedidosRestaurante = async (restauranteId: number, estado?: string): Promise<PedidosResult> => {
        try {
            if (!user?.restaurantInfo) {
                return {
                    success: false,
                    error: 'No eres dueño de un restaurante'
                };
            }

            await verificarAutenticacion();

            console.log('📋 Obteniendo pedidos con GraphQL directo:', {
                restauranteId,
                estado: estado || 'todos'
            });

            let filter: any;
            if (estado) {
                filter = {
                    restauranteEstado: { eq: `${restauranteId}#${estado}` }
                };
            } else {
                filter = {
                    restauranteId: { eq: restauranteId.toString() }
                };
            }

            const result = await client.graphql({
                query: LIST_PEDIDOS_BY_RESTAURANTE,
                variables: { filter }
            });

            const pedidos = result.data?.listPedidos?.items || [];

            // Parsear itemsPedido de JSON string a objeto
            const pedidosProcesados = pedidos.map((pedido: any) => ({
                ...pedido,
                itemsPedido: typeof pedido.itemsPedido === 'string'
                    ? JSON.parse(pedido.itemsPedido)
                    : pedido.itemsPedido
            }));

            const pedidosOrdenados = pedidosProcesados.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

            console.log('✅ Pedidos obtenidos:', {
                total: pedidosOrdenados.length,
                estados: pedidosOrdenados.reduce((acc: any, p: any) => {
                    acc[p.estado] = (acc[p.estado] || 0) + 1;
                    return acc;
                }, {})
            });

            return {
                success: true,
                pedidos: pedidosOrdenados,
                restaurantInfo: user.restaurantInfo
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo pedidos:', error);

            if (error.message?.includes('autenticación')) {
                return {
                    success: false,
                    error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            return {
                success: false,
                error: error.message || 'Error obteniendo pedidos del restaurante'
            };
        }
    };

    // ✅ ACTUALIZAR ESTADO usando GraphQL directo
    const actualizarEstadoPedido = async (pedidoId: string, nuevoEstado: string, comentarios?: string): Promise<UpdateResult> => {
        try {
            if (!user?.restaurantInfo) {
                return {
                    success: false,
                    error: 'No autorizado'
                };
            }

            await verificarAutenticacion();

            console.log('🔄 Actualizando pedido con GraphQL directo:', { pedidoId, nuevoEstado });

            // Primero obtener el pedido actual
            const getResult = await client.graphql({
                query: GET_PEDIDO,
                variables: { id: pedidoId }
            });

            const pedidoActual = getResult.data.getPedido;

            const input: any = {
                id: pedidoId,
                estado: nuevoEstado,
                restauranteEstado: `${pedidoActual.restauranteId}#${nuevoEstado}`,
            };

            const now = new Date().toISOString();
            switch (nuevoEstado) {
                case 'aceptado':
                    input.fechaAceptado = now;
                    input.tiempoEstimado = 20;
                    break;
                case 'listo':
                    input.fechaListo = now;
                    break;
                case 'entregado':
                    input.fechaEntregado = now;
                    break;
            }

            if (comentarios) {
                input.comentariosRestaurante = comentarios;
            }

            const updateResult = await client.graphql({
                query: UPDATE_PEDIDO,
                variables: { input }
            });

            if ('data' in updateResult && updateResult.data) {
                console.log('✅ Pedido actualizado:', updateResult.data.updatePedido);

                return {
                    success: true,
                    pedido: updateResult.data.updatePedido
                };
            } else {
                return {
                    success: false,
                    error: 'Error GraphQL: No se pudo actualizar el pedido'
                };
            }

        } catch (error: any) {
            console.error('❌ Error actualizando estado:', error);

            if (error.message?.includes('autenticación')) {
                return {
                    success: false,
                    error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            return {
                success: false,
                error: error.message || 'Error actualizando el pedido'
            };
        }
    };

    // ✅ OBTENER MIS PEDIDOS
    const obtenerMisPedidos = async (): Promise<PedidosResult> => {
        try {
            if (!user?.email) {
                return {
                    success: false,
                    error: 'Usuario no autenticado'
                };
            }

            await verificarAutenticacion();

            const result = await client.graphql({
                query: LIST_PEDIDOS_BY_RESTAURANTE,
                variables: {
                    filter: { usuarioEmail: { eq: user.email } }
                }
            });

            // Type guard to ensure result has 'data'
            if (!('data' in result) || !result.data || !result.data.listPedidos) {
                return {
                    success: false,
                    error: 'Error GraphQL: No se pudo obtener los pedidos'
                };
            }

            const pedidos = result.data.listPedidos.items || [];
            const pedidosOrdenados = pedidos.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

            return {
                success: true,
                pedidos: pedidosOrdenados
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo mis pedidos:', error);
            return {
                success: false,
                error: error.message || 'Error obteniendo pedidos'
            };
        }
    };

    return {
        crearPedido,
        obtenerPedidosRestaurante,
        actualizarEstadoPedido,
        obtenerMisPedidos,
        verificarAutenticacion,
        user,
    };
};

// ✅ Función para generar número de orden corto
function generateShortOrderNumber(): string {
    const timestamp = Date.now();
    const shortTimestamp = timestamp % 1000000;
    const random = Math.floor(Math.random() * 1000);

    const timestampHex = shortTimestamp.toString(16).toUpperCase().padStart(5, '0');
    const randomHex = random.toString(16).toUpperCase().padStart(3, '0');

    const part1 = timestampHex.substring(0, 3);
    const part2 = timestampHex.substring(3, 5);
    const part3 = randomHex;

    return `#${part1}${part2}-${part3}`;
}