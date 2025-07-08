// hooks/useAmplifyData.ts
import { useEffect, useState } from 'react';

export const useAmplifyData = () => {
    // Comentar temporalmente la línea problemática
    // const client = generateClient<Schema>();

    const crearPedido = async (carritoItems: any[], total: number) => {
        console.log('Función temporal - crearPedido');
        return { success: false, error: 'En desarrollo' };
    };

    return {
        crearPedido,
    };
};