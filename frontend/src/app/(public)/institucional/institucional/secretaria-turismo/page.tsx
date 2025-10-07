import { getPaginaInstitucional } from '@/services/api';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

// Componente para renderizar una sección de contenido si existe
const ContentSection = ({ title, content }: { title: string; content?: string }) => {
  if (!content) return null;
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
        {title}
      </h2>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default async function SecretariaPage() {
  try {
    // El 'slug' debe coincidir con el creado en el panel de administración
    const pagina = await getPaginaInstitucional('secretaria-de-turismo-y-desarrollo-economico');

    return (
      <div className="font-sans">
        {/* --- Banner --- */}
        <div className="relative h-96 w-full">
          <Image
            src={pagina.banner_url}
            alt={pagina.titulo_banner}
            layout="fill"
            objectFit="cover"
            className="brightness-75"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black bg-opacity-40 p-4">
            <h1 className="text-5xl font-extrabold text-center">{pagina.titulo_banner}</h1>
            {pagina.subtitulo_banner && (
              <p className="mt-4 text-xl text-center max-w-3xl">{pagina.subtitulo_banner}</p>
            )}
          </div>
        </div>

        {/* --- Contenido de la Página --- */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ContentSection title="Objetivos y Funciones" content={pagina.contenido_principal} />
          <ContentSection title="Programas y Proyectos en Curso" content={pagina.programas_proyectos} />
          <ContentSection title="Estrategias de Apoyo a Empresarios" content={pagina.estrategias_apoyo} />
        </main>
      </div>
    );
  } catch {
    // Manejo de error si la página no se encuentra o la API falla
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-600">Error al cargar la página</h1>
        <p className="mt-4 text-gray-600">
          No se pudo encontrar el contenido para esta sección. Por favor, asegúrese de que la página con el slug
          <code className="bg-red-100 text-red-800 p-1 rounded mx-1">secretaria-de-turismo-y-desarrollo-economico</code>
          haya sido creada en el panel de administración.
        </p>
      </div>
    );
  }
}