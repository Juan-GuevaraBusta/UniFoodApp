// hooks/useAmplifyData.ts - Versión corregida para Gen 2 - COMPLETA
import type { Schema } from '@/amplify/data/resource';
import { getRestaurantInfoByEmail } from '@/constants/userRoles';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { useAuth } from './useAuth';

// ✅ Cliente tipado de Gen 2 - usa el schema definido
const client = generateClient<Schema>({
    authMode: 'userPool', // Especificar modo de auth explícitamente
});

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
            // ✅ Verificar sesión directamente con AWS Amplify
            const session = await fetchAuthSession();
            if (!session.tokens?.accessToken) {
                throw new Error('No hay tokens de acceso válidos');
            }

            // ✅ Verificar usuario actual
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                throw new Error('No hay usuario actual');
            }

            const email = currentUser.signInDetails?.loginId || '';
            if (!email) {
                throw new Error('No se pudo obtener el email del usuario');
            }

            console.log('✅ Usuario autenticado verificado:', {
                email: email,
                hasAccessToken: !!session.tokens?.accessToken,
                hasIdToken: !!session.tokens?.idToken
            });

            return true;

        } catch (error) {
            console.error('❌ Error de autenticación:', error);
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
    };

    // ✅ CREAR PEDIDO usando Gen 2 client - CORREGIDO
    const crearPedido = async (carritoItems: any[], total: number): Promise<PedidoResult> => {
        try {
            console.log('📝 Creando pedido con Gen 2 client...');

            if (!carritoItems || carritoItems.length === 0) {
                return {
                    success: false,
                    error: 'El carrito está vacío'
                };
            }

            // ✅ Verificar autenticación ANTES de hacer la llamada
            await verificarAutenticacion();

            // ✅ Obtener email del usuario autenticado
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';

            if (!userEmail) {
                return {
                    success: false,
                    error: 'No se pudo obtener el email del usuario'
                };
            }

            const primerItem = carritoItems[0];
            const restauranteId = primerItem.idRestaurante.toString();
            const universidadId = primerItem.universidadId;
            const subtotal = total - Math.round(total * 0.05);
            const tarifaServicio = Math.round(total * 0.05);
            const numeroOrden = generateShortOrderNumber();

            // ✅ CRÍTICO: Preparar itemsPedido como JSON string
            const itemsPedidoArray = carritoItems.map(item => ({
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
            }));

            const pedidoData = {
                numeroOrden,
                usuarioEmail: userEmail,
                restauranteId,
                subtotal,
                tarifaServicio,
                total,
                estado: 'pendiente' as const,
                fechaPedido: new Date().toISOString(),
                comentariosCliente: carritoItems
                    .filter(item => item.comentarios?.trim())
                    .map(item => `${item.plato.nombre}: ${item.comentarios}`)
                    .join('; ') || undefined,
                universidadId,
                restauranteEstado: `${restauranteId}#pendiente`,
                // ✅ CORREGIDO: Serializar itemsPedido como JSON string
                itemsPedido: JSON.stringify(itemsPedidoArray)
            };

            console.log('📋 Creando pedido con Gen 2:', {
                numeroOrden,
                restauranteId,
                universidadId,
                total,
                userEmail: userEmail,
                itemsCount: itemsPedidoArray.length,
                itemsPedidoType: typeof pedidoData.itemsPedido
            });

            // ✅ Usar client.models.Pedido.create en lugar de GraphQL manual
            const { data: pedido, errors } = await client.models.Pedido.create(pedidoData);

            if (errors && errors.length > 0) {
                console.error('❌ Errores en creación:', errors);

                // ✅ Detectar errores de autenticación específicos
                const authError = errors.find(err =>
                    err.message?.includes('Unauthorized') ||
                    err.message?.includes('Not Authorized') ||
                    err.message?.includes('authentication')
                );

                if (authError) {
                    return {
                        success: false,
                        error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                        needsReauth: true
                    };
                }

                return {
                    success: false,
                    error: errors[0].message || 'Error creando pedido'
                };
            }

            if (!pedido) {
                return {
                    success: false,
                    error: 'No se pudo crear el pedido'
                };
            }

            console.log('✅ Pedido creado exitosamente con Gen 2:', pedido);

            return {
                success: true,
                numeroOrden: pedido.numeroOrden,
                pedidoId: pedido.id,
                message: 'Pedido enviado al restaurante',
                pedido
            };

        } catch (error: any) {
            console.error('❌ Error creando pedido:', error);

            // ✅ Manejo mejorado de errores de autenticación
            if (error.message?.includes('autenticación') ||
                error.message?.includes('authentication') ||
                error.message?.includes('Unauthorized') ||
                error.message?.includes('Not Authorized') ||
                error.name?.includes('NotAuthorizedException') ||
                error.name?.includes('UnauthorizedException')) {
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

    // ✅ OBTENER PEDIDOS - Adaptado para Gen 2 con parsing JSON
    const obtenerPedidosRestaurante = async (restauranteId: number, estado?: string): Promise<PedidosResult> => {
        try {
            // ✅ Verificar autenticación primero
            await verificarAutenticacion();

            // ✅ Obtener información del restaurante del usuario autenticado
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';
            const restaurantInfo = getRestaurantInfoByEmail(userEmail);

            if (!restaurantInfo) {
                return {
                    success: false,
                    error: 'No eres dueño de un restaurante'
                };
            }

            console.log('📋 Obteniendo pedidos con Gen 2:', {
                restauranteId,
                estado: estado || 'todos'
            });

            let result;

            if (estado) {
                // ✅ Filtrar por restauranteEstado usando Gen 2
                const { data: pedidos, errors } = await client.models.Pedido.list({
                    filter: {
                        restauranteEstado: {
                            eq: `${restauranteId}#${estado}`
                        }
                    }
                });

                result = { data: pedidos, errors };
            } else {
                // ✅ Filtrar solo por restauranteId usando Gen 2
                const { data: pedidos, errors } = await client.models.Pedido.list({
                    filter: {
                        restauranteId: {
                            eq: restauranteId.toString()
                        }
                    }
                });

                result = { data: pedidos, errors };
            }

            if (result.errors && result.errors.length > 0) {
                console.error('❌ Errores obteniendo pedidos:', result.errors);

                // ✅ Detectar errores de autenticación
                const authError = result.errors.find((err: any) =>
                    err.message?.includes('Unauthorized') ||
                    err.message?.includes('Not Authorized')
                );

                if (authError) {
                    return {
                        success: false,
                        error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                        needsReauth: true
                    };
                }

                return {
                    success: false,
                    error: result.errors[0].message || 'Error obteniendo pedidos'
                };
            }

            const pedidos = result.data || [];

            // ✅ CRÍTICO: Procesar itemsPedido (viene como string JSON)
            const pedidosProcesados = pedidos.map((pedido: any) => ({
                ...pedido,
                itemsPedido: typeof pedido.itemsPedido === 'string'
                    ? JSON.parse(pedido.itemsPedido)
                    : pedido.itemsPedido || []
            }));

            // ✅ Ordenar por fecha más reciente
            const pedidosOrdenados = pedidosProcesados.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

            console.log('✅ Pedidos obtenidos con Gen 2:', {
                total: pedidosOrdenados.length,
                estados: pedidosOrdenados.reduce((acc: any, p: any) => {
                    acc[p.estado] = (acc[p.estado] || 0) + 1;
                    return acc;
                }, {})
            });

            return {
                success: true,
                pedidos: pedidosOrdenados,
                restaurantInfo: restaurantInfo
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo pedidos:', error);

            if (error.message?.includes('autenticación') ||
                error.name?.includes('NotAuthorizedException')) {
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

    // ✅ ACTUALIZAR ESTADO - Adaptado para Gen 2
    const actualizarEstadoPedido = async (pedidoId: string, nuevoEstado: string, comentarios?: string): Promise<UpdateResult> => {
        try {
            // ✅ Verificar autenticación primero
            await verificarAutenticacion();

            // ✅ Obtener información del restaurante del usuario autenticado
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';
            const restaurantInfo = getRestaurantInfoByEmail(userEmail);

            if (!restaurantInfo) {
                return {
                    success: false,
                    error: 'No autorizado'
                };
            }

            console.log('🔄 Actualizando pedido con Gen 2:', { pedidoId, nuevoEstado });

            // ✅ Primero obtener el pedido actual usando Gen 2
            const { data: pedidoActual, errors: getErrors } = await client.models.Pedido.get({
                id: pedidoId
            });

            if (getErrors && getErrors.length > 0) {
                console.error('❌ Errores obteniendo pedido:', getErrors);
                return {
                    success: false,
                    error: getErrors[0].message || 'Error obteniendo pedido actual'
                };
            }

            if (!pedidoActual) {
                return {
                    success: false,
                    error: 'Pedido no encontrado'
                };
            }

            // ✅ Preparar datos de actualización
            const updateData: any = {
                id: pedidoId,
                estado: nuevoEstado,
                restauranteEstado: `${pedidoActual.restauranteId}#${nuevoEstado}`,
            };

            const now = new Date().toISOString();
            switch (nuevoEstado) {
                case 'aceptado':
                    updateData.fechaAceptado = now;
                    updateData.tiempoEstimado = 20;
                    break;
                case 'listo':
                    updateData.fechaListo = now;
                    break;
                case 'entregado':
                    updateData.fechaEntregado = now;
                    break;
            }

            if (comentarios) {
                updateData.comentariosRestaurante = comentarios;
            }

            // ✅ Actualizar usando Gen 2
            const { data: pedidoActualizado, errors: updateErrors } = await client.models.Pedido.update(updateData);

            if (updateErrors && updateErrors.length > 0) {
                console.error('❌ Errores actualizando pedido:', updateErrors);
                return {
                    success: false,
                    error: updateErrors[0].message || 'Error actualizando pedido'
                };
            }

            if (pedidoActualizado) {
                console.log('✅ Pedido actualizado con Gen 2:', pedidoActualizado);

                return {
                    success: true,
                    pedido: pedidoActualizado
                };
            } else {
                return {
                    success: false,
                    error: 'Error: No se pudo actualizar el pedido'
                };
            }

        } catch (error: any) {
            console.error('❌ Error actualizando estado:', error);

            if (error.message?.includes('autenticación') ||
                error.name?.includes('NotAuthorizedException')) {
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

    // ✅ OBTENER MIS PEDIDOS - Adaptado para Gen 2 con parsing JSON
    const obtenerMisPedidos = async (): Promise<PedidosResult> => {
        try {
            // ✅ Verificar autenticación primero
            await verificarAutenticacion();

            // ✅ Obtener email del usuario autenticado
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';

            if (!userEmail) {
                return {
                    success: false,
                    error: 'No se pudo obtener el email del usuario'
                };
            }

            // ✅ Obtener pedidos del usuario usando Gen 2
            const { data: pedidos, errors } = await client.models.Pedido.list({
                filter: {
                    usuarioEmail: {
                        eq: userEmail
                    }
                }
            });

            if (errors && errors.length > 0) {
                console.error('❌ Errores obteniendo mis pedidos:', errors);
                return {
                    success: false,
                    error: errors[0].message || 'Error obteniendo mis pedidos'
                };
            }

            if (!pedidos) {
                return {
                    success: false,
                    error: 'No se pudieron obtener los pedidos'
                };
            }

            // ✅ CRÍTICO: Procesar itemsPedido (viene como string JSON)
            const pedidosProcesados = pedidos.map((pedido: any) => ({
                ...pedido,
                itemsPedido: typeof pedido.itemsPedido === 'string'
                    ? JSON.parse(pedido.itemsPedido)
                    : pedido.itemsPedido || []
            }));

            // ✅ Ordenar por fecha más reciente
            const pedidosOrdenados = pedidosProcesados.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

            return {
                success: true,
                pedidos: pedidosOrdenados
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo mis pedidos:', error);

            if (error.name?.includes('NotAuthorizedException')) {
                return {
                    success: false,
                    error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            return {
                success: false,
                error: error.message || 'Error obteniendo pedidos'
            };
        }
    };

    // ✅ ACTUALIZAR DISPONIBILIDAD PLATO - Usando el mismo patrón que pedidos
    const actualizarDisponibilidadPlato = async (
        platoId: string,
        restauranteId: string,
        disponible: boolean,
        comentario?: string
    ): Promise<{ success: boolean; error?: string; needsReauth?: boolean }> => {
        try {
            console.log(`🔄 Actualizando disponibilidad - Plato: ${platoId}, Restaurante: ${restauranteId}, Disponible: ${disponible}`);

            // ✅ Verificar autenticación
            await verificarAutenticacion();

            // ✅ Verificar que el usuario es dueño del restaurante
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';
            const restaurantInfo = getRestaurantInfoByEmail(userEmail);

            if (!restaurantInfo || restaurantInfo.restauranteId.toString() !== restauranteId) {
                return {
                    success: false,
                    error: 'No tienes permisos para actualizar este restaurante'
                };
            }

            // ✅ Buscar disponibilidad existente
            const { data: disponibilidadExistente, errors: errorsList } = await client.models.DisponibilidadPlato.list({
                filter: {
                    restaurantePlato: { eq: `${restauranteId}#${platoId}` }
                }
            });

            if (errorsList && errorsList.length > 0) {
                console.error('❌ Error buscando disponibilidad existente:', errorsList);
                return {
                    success: false,
                    error: errorsList[0].message || 'Error buscando disponibilidad existente'
                };
            }

            const disponibilidadData = {
                platoId,
                restauranteId,
                disponible,
                comentario: comentario || undefined,
                fechaActualizacion: new Date().toISOString(),
                restaurantePlato: `${restauranteId}#${platoId}`
            };

            let result;

            if (disponibilidadExistente && disponibilidadExistente.length > 0) {
                // ✅ Actualizar registro existente
                const { data, errors } = await client.models.DisponibilidadPlato.update({
                    id: disponibilidadExistente[0].id,
                    ...disponibilidadData
                });

                if (errors && errors.length > 0) {
                    console.error('❌ Error actualizando disponibilidad:', errors);
                    return {
                        success: false,
                        error: errors[0].message || 'Error actualizando disponibilidad'
                    };
                }

                result = { data, errors };
            } else {
                // ✅ Crear nuevo registro
                const { data, errors } = await client.models.DisponibilidadPlato.create(disponibilidadData);

                if (errors && errors.length > 0) {
                    console.error('❌ Error creando disponibilidad:', errors);
                    return {
                        success: false,
                        error: errors[0].message || 'Error creando disponibilidad'
                    };
                }

                result = { data, errors };
            }

            if (result.data) {
                console.log('✅ Disponibilidad actualizada exitosamente:', result.data);
                return {
                    success: true
                };
            }

            return {
                success: false,
                error: 'No se pudo actualizar la disponibilidad'
            };

        } catch (error: any) {
            console.error('❌ Error actualizando disponibilidad:', error);

            if (error.message?.includes('autenticación') ||
                error.message?.includes('authentication') ||
                error.message?.includes('Unauthorized') ||
                error.message?.includes('Not Authorized') ||
                error.name?.includes('NotAuthorizedException')) {
                return {
                    success: false,
                    error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            return {
                success: false,
                error: error.message || 'Error actualizando disponibilidad'
            };
        }
    };

    // ✅ OBTENER DISPONIBILIDAD RESTAURANTE - Usando el mismo patrón que pedidos
    const obtenerDisponibilidadRestaurante = async (
        restauranteId: string
    ): Promise<{ success: boolean; error?: string; disponibilidad?: { [platoId: string]: boolean }; needsReauth?: boolean }> => {
        try {
            console.log(`🔄 Obteniendo disponibilidad para restaurante ${restauranteId}...`);

            // ✅ Obtener desde backend
            const { data: disponibilidadPlatos, errors } = await client.models.DisponibilidadPlato.list({
                filter: {
                    restauranteId: { eq: restauranteId }
                }
            });

            if (errors && errors.length > 0) {
                console.error('❌ Error obteniendo disponibilidad:', errors);
                return {
                    success: false,
                    error: errors[0].message || 'Error obteniendo disponibilidad'
                };
            }

            // ✅ Procesar datos
            const disponibilidad: { [platoId: string]: boolean } = {};
            if (disponibilidadPlatos) {
                disponibilidadPlatos.forEach((item: any) => {
                    disponibilidad[item.platoId] = item.disponible;
                });
            }

            console.log(`✅ Disponibilidad obtenida para restaurante ${restauranteId}:`, disponibilidad);

            return {
                success: true,
                disponibilidad
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo disponibilidad:', error);
            return {
                success: false,
                error: error.message || 'Error obteniendo disponibilidad'
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

        // ✅ NUEVAS: Funciones de disponibilidad
        actualizarDisponibilidadPlato,
        obtenerDisponibilidadRestaurante,
    };
};

// ✅ Función para generar número de orden corto - sin cambios
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