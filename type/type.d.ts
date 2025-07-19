import { TextInputProps, TouchableOpacityProps } from "react-native";

// =============== COMPONENTES UI ===============
declare interface ButtonProps extends TouchableOpacityProps {
    title: string;
    bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success";
    textVariant?: "primary" | "default" | "secondary" | "danger" | "success";
    IconLeft?: React.ComponentType<any>;
    IconRight?: React.ComponentType<any>;
    className?: string;
}

declare interface InputFieldProps extends TextInputProps {
    label: string;
    icon?: any;
    secureTextEntry?: boolean;
    labelStyle?: string;
    containerStyle?: string;
    inputStyle?: string;
    iconStyle?: string;
    className?: string;
}

// =============== DATOS UNIFOOD ===============
declare interface Universidad {
    id: number;
    nombre: string;
    ciudad: string;
    imagen: any;
}

declare interface Restaurante {
    idRestaurante: number;
    idUniversidad: number;
    nombreRestaurante: string;
    imagen: any;
    categorias: string[];
    calificacionRestaurante: number;
    tiempoEntrega: number;
    menu: Plato[];
}

declare interface Plato {
    idPlato: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    imagen: any;
    disponible: boolean; // ← Nueva propiedad
    tipoPlato: 'simple' | 'fijo' | 'mixto' | 'personalizable';
    toppingsBase: Topping[];
    toppingsDisponibles: Topping[];
}

declare interface Topping {
    id: number;
    nombre: string;
    precio?: number;
    removible?: boolean;
    categoria?: string;
}

declare interface PlatoCarrito {
    idRestaurante: number;
    nombreRestaurante: string;
    nombreUniversidad: string;
    universidadId: number; // ← Asegurándonos de que esté incluido
    plato: Plato;
    cantidad: number;
    comentarios: string;
    toppingsSeleccionados: Topping[];
    toppingsBaseRemocionados: number[];
    precioTotal: number;
    idUnico: string;
    fechaAgregado: Date;
}

declare interface Pedido {
    id: string;
    usuarioEmail: string;
    restauranteId: string;
    total: number;
    estado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
    comentarios?: string;
    fechaPedido: string;
    numeroOrden: string;
    itemsPedido: ItemPedido[];
}

declare interface ItemPedido {
    platoId: number;
    platoNombre: string;
    platoDescripcion?: string;
    precioUnitario: number;
    cantidad: number;
    comentarios?: string;
    toppingsSeleccionados: ToppingSeleccionado[];
    toppingsBaseRemocionados: number[];
    precioTotal: number;
    totalItem: number;
    idUnico: string;
}

declare interface ToppingSeleccionado {
    id: number;
    nombre: string;
    precio: number;
}

// =============== AUTENTICACIÓN ===============
declare interface UserData {
    email: string;
    role: 'student' | 'restaurant_owner' | 'admin';
    isAuthenticated: boolean;
    userId?: string;
}

declare interface AuthResult {
    success: boolean;
    message?: string;
    error?: string;
    role?: 'student' | 'restaurant_owner' | 'admin';
    needsConfirmation?: boolean;
    userId?: string;
}

// =============== GESTIÓN DE DISPONIBILIDAD ===============
declare interface DisponibilidadUpdate {
    restauranteId: number;
    platoId: number;
    disponible: boolean;
    timestamp: Date;
}

declare interface DisponibilidadState {
    [platoId: number]: boolean;
}