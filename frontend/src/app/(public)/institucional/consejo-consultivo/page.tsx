import { ConsejoConsultivo, getConsejoConsultivoPublicaciones } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import { FiDownload } from 'react-icons/fi';

// Componente para una única publicación del consejo
const PublicacionConsejo = ({ publicacion }: { publicacion: ConsejoConsultivo }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
      <h2 className="text-2xl font-bold text-gray-800">{publicacion.titulo}</h2>
      <p className="text-sm text-gray-500 mb-4">
        Publicado el: {new Date(publicacion.fecha_publicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <div className="prose prose-lg max-w-none mb-4">
        <ReactMarkdown>{publicacion.contenido}</ReactMarkdown>
      </div>
      {publicacion.documento_adjunto && (
        <a
          href={publicacion.documento_adjunto}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiDownload className="mr-2" />
          Descargar Documento Adjunto
        </a>
      )}
    </div>
  );
};


export default async function ConsejoConsultivoPage() {
  try {
    const publicaciones = await getConsejoConsultivoPublicaciones();

    return (
      <div className="font-sans bg-gray-50">
        {/* --- Encabezado --- */}
        <div className="bg-gray-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-extrabold">Consejo Consultivo de Turismo</h1>
            <p className="mt-4 text-xl text-gray-300">
              Actas, sesiones e información relevante del órgano consultivo.
            </p>
          </div>
        </div>

        {/* --- Contenido de la Página --- */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {publicaciones.length > 0 ? (
            publicaciones.map((pub) => <PublicacionConsejo key={pub.id} publicacion={pub} />)
          ) : (
            <div className="text-center py-20 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800">No hay publicaciones</h2>
              <p className="mt-2 text-gray-600">
                Actualmente no hay actas o noticias disponibles del Consejo Consultivo.
              </p>
            </div>
          )}
        </main>
      </div>
    );
  } catch {
    // Manejo de error si la API falla
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-600">Error al cargar las publicaciones</h1>
        <p className="mt-4 text-gray-600">
          No se pudo obtener la información del Consejo Consultivo en este momento.
        </p>
      </div>
    );
  }
}