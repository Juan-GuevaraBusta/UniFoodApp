/* eslint-disable prettier/prettier */
// components/Checkbox.tsx
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Check } from 'lucide-react-native';

interface CheckboxProps {
    checked: boolean;
    onPress: () => void;
    label: string;
    sublabel?: string | null;
    disabled?: boolean;
    variant?: 'default' | 'small' | 'large';
}

interface ToppingCheckboxProps {
    topping: {
        id: number;
        nombre: string;
        precio?: number;
        removible?: boolean;
    };
    checked: boolean;
    onToggle: (toppingId: number) => void;
    type: 'adicional' | 'base';
    formatearPrecio?: (precio: number) => string;
    variant?: 'default' | 'small' | 'large';
}

// Componente básico de Checkbox
const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onPress,
    label,
    sublabel,
    disabled = false,
    variant = 'default'
}) => {
    // Tamaños según variante
    const getCheckboxSize = () => {
        switch (variant) {
            case 'small': return 'w-5 h-5';
            case 'large': return 'w-7 h-7';
            default: return 'w-6 h-6';
        }
    };

    const getCheckSize = () => {
        switch (variant) {
            case 'small': return 14;
            case 'large': return 18;
            default: return 16;
        }
    };

    const getPadding = () => {
        switch (variant) {
            case 'small': return 'py-2 px-3';
            case 'large': return 'py-4 px-5';
            default: return 'py-3 px-4';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            className={`flex-row items-center mb-2 bg-white rounded-xl border border-gray-200 ${getPadding()} ${disabled ? 'opacity-50' : ''
                }`}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
            }}
        >
            {/* Contenido - AHORA A LA IZQUIERDA */}
            <View className="flex-1">
                <Text className={`font-JakartaBold text-base ${disabled
                        ? 'text-gray-400'
                        : checked
                            ? 'text-[#132e3c]'
                            : 'text-gray-700'
                    }`}>
                    {label}
                </Text>

                {sublabel && (
                    <Text className={`font-JakartaMedium text-sm mt-1 ${disabled
                            ? 'text-gray-300'
                            : sublabel.includes('Removido')
                                ? 'text-red-500'
                                : sublabel.includes('Incluido')
                                    ? 'text-gray-500'
                                    : 'text-green-600' // Para precios
                        }`}>
                        {sublabel}
                    </Text>
                )}
            </View>

            {/* Checkbox - AHORA A LA DERECHA */}
            <View
                className={`${getCheckboxSize()} rounded-md border-2 ml-4 items-center justify-center ${checked
                        ? 'bg-[#132e3c] border-[#132e3c]'
                        : 'bg-white border-gray-300'
                    }`}
            >
                {checked && <Check size={getCheckSize()} color="white" />}
            </View>
        </TouchableOpacity>
    );
};

// Componente especializado para Toppings
export const ToppingCheckbox: React.FC<ToppingCheckboxProps> = ({
    topping,
    checked,
    onToggle,
    type,
    formatearPrecio = (precio) => `$${precio.toLocaleString('es-CO')}`,
    variant = 'default'
}) => {
    const getSublabel = () => {
        if (type === 'base') {
            // Para toppings base: checked = incluido, unchecked = removido
            return checked ? 'Incluido' : 'Removido';
        } else {
            // Para toppings adicionales: mostrar precio si existe
            return topping.precio ? `+${formatearPrecio(topping.precio)}` : null;
        }
    };

    return (
        <Checkbox
            checked={checked}
            onPress={() => onToggle(topping.id)}
            label={topping.nombre}
            sublabel={getSublabel()}
            variant={variant}
        />
    );
};

export default Checkbox;