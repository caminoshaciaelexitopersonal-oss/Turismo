import { getPublicaciones, Publicacion } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiArrowRight } from 'react-icons/fi';
import PlaceholderContent from '@/components/common/PlaceholderContent';

// Función para formatear la fecha
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Componente para una tarjeta de evento
const EventCard = ({ event }: { event: Publicacion }) => (
  <div className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
    <Link href={`/publicaciones/${event.slug}`} className="block">
      <div className="relative h-48">
        <Image
          src={event.imagen_principal || '/images/placeholder-event.jpg'}
          alt={`Imagen de ${event.titulo}`}
          fill
          style={{ objectFit: 'cover' }}
          className="bg-gray-200"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <FiCalendar className="mr-2" />
          <span>{formatDate(event.fecha_evento_inicio)}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 h-20 overflow-hidden">
          {event.titulo}
        </h3>
        <p className="text-blue-600 font-semibold mt-4 inline-flex items-center">
          Ver más <FiArrowRight className="ml-2" />
        </p>
      </div>
    </Link>
  </div>
);

// Página principal de Eventos Destacados
export default async function EventosDestacadosPage() {
  let featuredEvents: Publicacion[] = [];
  let error: string | null = null;

  try {
    featuredEvents = await getPublicaciones({ destacados: true, limit: 5 });
  } catch (e) {
    error = 'No se pudieron cargar los eventos destacados en este momento.';
  }

  if (!error && featuredEvents.length === 0) {
    return (
      <PlaceholderContent
        title="Eventos Destacados"
        description="Aquí se mostrará un listado con los próximos eventos principales del municipio."
      />
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Eventos Destacados
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Descubre los próximos grandes eventos que no te puedes perder en Puerto Gaitán.
          </p>
        </div>

        {error && (
          <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {!error && featuredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <Link
            href="/agenda-cultural"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Ver Agenda Completa
          </Link>
        </div>
      </div>
    </div>
  );
}