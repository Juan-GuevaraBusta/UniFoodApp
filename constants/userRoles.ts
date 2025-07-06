// constants/userRoles.ts
export const RESTAURANT_EMAILS = [
    'wonka@unifood.com',
    'bristo@unifood.com',
    'laesquina@unifood.com',
    'restaurante1@icesi.edu.co',
    'restaurante2@javeriana.edu.co',
];

export const ADMIN_EMAILS = [
    'neodigital.management@gmail.com',
];

export type UserRole = 'student' | 'restaurant_owner' | 'admin';

export const getUserRoleByEmail = (email: string): UserRole => {
    const normalizedEmail = email.toLowerCase().trim();

    if (ADMIN_EMAILS.includes(normalizedEmail)) {
        return 'admin';
    }

    if (RESTAURANT_EMAILS.includes(normalizedEmail)) {
        return 'restaurant_owner';
    }

    return 'student';
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
            return '/(restaurant)/dashboard'; // Crearemos esta ruta después
        case 'admin':
            return '/(admin)/dashboard'; // Crearemos esta ruta después
        default:
            return '/(root)/(tabs)/home';
    }
  };