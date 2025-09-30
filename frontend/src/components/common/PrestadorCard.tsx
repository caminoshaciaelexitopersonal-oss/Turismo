import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PrestadorPublico } from '@/services/api';

interface PrestadorCardProps {
  prestador: PrestadorPublico;
}

const PrestadorCard: React.FC<PrestadorCardProps> = ({ prestador }) => {
  return (
    <Link href={`/oferta/${prestador.id}`} className="block group">
      <div className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white h-full flex flex-col">
        <div className="relative w-full h-48">
          {prestador.imagen_principal ? (
            <Image
              src={prestador.imagen_principal}
              alt={`Imagen de ${prestador.nombre_negocio}`}
              fill={true}
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="p-4 flex-grow">
          <p className="text-sm text-gray-500">{prestador.categoria_nombre}</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-800 group-hover:text-blue-600">
            {prestador.nombre_negocio}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default PrestadorCard;