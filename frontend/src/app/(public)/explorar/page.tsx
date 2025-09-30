import React from 'react';
import { getPrestadores } from '@/services/api';
import PrestadorGrid from '@/components/common/PrestadorGrid';

export default async function ExplorarPage() {
  try {
    const prestadores = await getPrestadores();

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Explorar Oferta Turística</h1>
        <p className="text-gray-600 mb-8">
          Descubre la variedad de servicios que Puerto Gaitán tiene para ofrecer.
        </p>
        <PrestadorGrid prestadores={prestadores} />
      </div>
    );
  } catch (error) {
    console.error("Error al obtener los prestadores de servicios:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error al cargar la oferta turística</h1>
        <p className="text-gray-600">
          No se pudieron obtener los datos de los prestadores de servicios. Por favor, inténtelo de nuevo más tarde.
        </p>
      </div>
    );
  }
}