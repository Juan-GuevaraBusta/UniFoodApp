// constants/userRoles.ts - Sistema mejorado con IDs de universidad y restaurante
export const ADMIN_EMAILS = [
    'admin@unifood.com',
];

// Mapeo de emails de restaurantes con sus IDs específicos
export const RESTAURANT_EMAIL_MAPPING = [
    // Universidad ICESI (ID: 1)
    {
        email: 'wonka@unifood.com',
        universidadId: 1,
        restauranteId: 1,
        nombreRestaurante: 'Wonka',
        nombreUniversidad: 'Universidad ICESI'
    },
    {
        email: 'bristo@unifood.com',
        universidadId: 1,
        restauranteId: 2,
        nombreRestaurante: 'Bristo',
        nombreUniversidad: 'Universidad ICESI'
    },

    // Universidad Javeriana Cali (ID: 2)

    {
        email: 'bristo@unifood.com',
        universidadId: 2,
        restauranteId: 3,
        nombreRestaurante: 'Bristo',
        nombreUniversidad: 'Universidad Javeriana Cali'
    },

    {
        email: 'neodigital.management@gmail.com',
        universidadId: 2,
        restauranteId: 4,
        nombreRestaurante: 'La Esquina',
        nombreUniversidad: 'Universidad Javeriana Cali'
    },
];

export type UserRole = 'student' | 'restaurant_owner' | 'admin';

export interface RestaurantInfo {
    email: string;
    universidadId: number;
    restauranteId: number;
    nombreRestaurante: string;
    nombreUniversidad: string;
}

export const getUserRoleByEmail = (email: string): UserRole => {
    const normalizedEmail = email.toLowerCase().trim();

    if (ADMIN_EMAILS.includes(normalizedEmail)) {
        return 'admin';
    }

    if (RESTAURANT_EMAIL_MAPPING.some(mapping => mapping.email === normalizedEmail)) {
        return 'restaurant_owner';
    }

    return 'student';
};

export const getRestaurantInfoByEmail = (email: string): RestaurantInfo | null => {
    const normalizedEmail = email.toLowerCase().trim();

    const restaurantMapping = RESTAURANT_EMAIL_MAPPING.find(
        mapping => mapping.email === normalizedEmail
    );

    return restaurantMapping || null;
};

export const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
        case 'student':
            return 'Estudiante';
        case 'restaurant_owner':
            return 'Dueño de Restaurante';
        case 'admin':
            return 'Administrador';
        default:
            return 'Usuario';
    }
};

export const getRoleRedirectPath = (role: UserRole): string => {
    switch (role) {
        case 'student':
            return '/(root)/(tabs)/home';
        case 'restaurant_owner':
            return '/(restaurant)/home'; // ← ACTUALIZADO: Cambié de dashboard a home
        case 'admin':
            return '/(admin)/dashboard'; // Crearemos esta ruta después
        default:
            return '/(root)/(tabs)/home';
    }
};

// Función para validar si un restaurante puede recibir pedidos
export const canReceiveOrders = (email: string, universidadId: number, restauranteId: number): boolean => {
    const restaurantInfo = getRestaurantInfoByEmail(email);

    if (!restaurantInfo) {
        return false;
    }

    return restaurantInfo.universidadId === universidadId &&
        restaurantInfo.restauranteId === restauranteId;
};

// Función para obtener todos los restaurantes de una universidad
export const getRestaurantsByUniversity = (universidadId: number): RestaurantInfo[] => {
    return RESTAURANT_EMAIL_MAPPING.filter(mapping => mapping.universidadId === universidadId);
};

// Función para obtener el email del restaurante por IDs
export const getRestaurantEmailByIds = (universidadId: number, restauranteId: number): string | null => {
    const restaurant = RESTAURANT_EMAIL_MAPPING.find(
        mapping => mapping.universidadId === universidadId && mapping.restauranteId === restauranteId
    );

    return restaurant ? restaurant.email : null;
};