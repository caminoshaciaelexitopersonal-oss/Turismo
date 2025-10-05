import { getPaginaInstitucional, PaginaInstitucional } from '@/services/api';
import Image from 'next/image';
import { FiFileText, FiTarget, FiBriefcase } from 'react-icons/fi';

// Componente para renderizar una sección de contenido
const ContentSection = ({
  title,
  content,
  icon,
}: {
  title: string;
  content: string;
  icon: React.ReactNode;
}) => {
  if (!content) return null;

  // Procesar saltos de línea como párrafos
  const paragraphs = content.split('\n').filter((p) => p.trim() !== '');

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="text-blue-600 mr-3">{icon}</span>
        {title}
      </h2>
      <div className="prose max-w-none text-gray-700">
        {paragraphs.map((p, index) => (
          <p key={index}>{p}</p>
        ))}
      </div>
    </div>
  );
};

// Página principal
export default async function DireccionTurismoPage() {
  let pageData: PaginaInstitucional | null = null;
  let error: string | null = null;

  try {
    // El slug 'direccion-turismo' debe coincidir con el que se configuró en el backend
    pageData = await getPaginaInstitucional('direccion-turismo');
  } catch (e) {
    error =
      'No se pudo cargar el contenido de la página. Es posible que aún no se haya creado en el panel de administración.';
  }

  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-gray-50 p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Dirección de Turismo
        </h1>
        <p className="text-lg text-gray-600">
          {error ||
            'Aquí encontrarás información sobre los objetivos, funciones, políticas, convenios e informes de la Dirección de Turismo.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      {/* Sección del Banner */}
      <div className="relative h-96 w-full">
        <Image
          src={pageData.banner_url}
          alt={pageData.titulo_banner}
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold">
              {pageData.titulo_banner}
            </h1>
            {pageData.subtitulo_banner && (
              <p className="text-xl md:text-2xl mt-2">
                {pageData.subtitulo_banner}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de la Página */}
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <ContentSection
            title="Objetivos y Funciones"
            content={pageData.contenido_principal || ''}
            icon={<FiTarget size={24} />}
          />
          <ContentSection
            title="Políticas y Convenios"
            content={pageData.programas_proyectos || ''}
            icon={<FiBriefcase size={24} />}
          />
          <ContentSection
            title="Informes y Recursos"
            content={pageData.estrategias_apoyo || ''}
            icon={<FiFileText size={24} />}
          />
        </div>
      </div>
    </div>
  );
}