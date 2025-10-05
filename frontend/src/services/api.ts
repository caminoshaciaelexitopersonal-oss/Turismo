import axios from "axios";

// Define la URL base de tu API de Django
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para añadir el token de autenticación a las peticiones
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// --- Tipos de Datos ---

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "FUNCIONARIO" | "PRESTADOR" | "TURISTA";
  is_active: boolean;
  password?: string;
}

export interface SiteConfiguration {
  id: number;
  nombre_entidad_principal: string;
  nombre_entidad_secundaria: string;
  nombre_secretaria: string;
  nombre_direccion: string;
  logo_url: string | null;
  seccion_publicaciones_activa: boolean;
  seccion_atractivos_activa: boolean;
  seccion_prestadores_activa: boolean;
  google_maps_api_key: string;
}

export interface MenuItem {
  id: number;
  nombre: string;
  url: string;
  orden: number;
  parent: number | null;
  children: MenuItem[];
}

export interface HomePageComponent {
  id: number;
  component_type: "BANNER" | "SLIDER" | "VIDEO";
  title: string;
  subtitle?: string;
  link_url?: string;
  image: string;
  video_url?: string;
  order: number;
  is_active: boolean;
}

export interface AuditLog {
  id: number;
  user: {
    id: number;
    username: string;
  };
  action: string;
  timestamp: string;
  content_type: string;
  object_id: string;
  object_repr: string;
  details: string;
}

export interface ImagenGaleria {
  id: number;
  imagen: string;
  alt_text: string;
}

export interface PrestadorPublico {
  id: number;
  nombre_negocio: string;
  categoria_nombre: string;
  imagen_principal: string | null;
  descripcion?: string;
  telefono?: string;
  email_contacto?: string;
  red_social_facebook?: string;
  red_social_instagram?: string;
  red_social_tiktok?: string;
  red_social_whatsapp?: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface RubroArtesano {
  id: number;
  nombre: string;
  slug: string;
}

export interface ArtesanoPublico {
  id: number;
  nombre_taller: string;
  nombre_artesano: string;
  rubro_nombre: string;
  foto_url: string | null;
  descripcion?: string;
  telefono?: string;
  email_contacto?: string;
  red_social_facebook?: string;
  red_social_instagram?: string;
  red_social_tiktok?: string;
  red_social_whatsapp?: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface ImagenArtesano {
  id: number;
  imagen: string;
  alt_text: string;
}

export interface ArtesanoPublicoDetalle {
  id: number;
  nombre_taller: string;
  nombre_artesano: string;
  descripcion: string;
  telefono: string;
  email_contacto: string;
  red_social_facebook: string;
  red_social_instagram: string;
  red_social_tiktok: string;
  red_social_whatsapp: string;
  ubicacion_taller: string;
  rubro: RubroArtesano;
  foto_url: string | null;
  galeria_imagenes: ImagenArtesano[];
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
}

export interface PrestadorPublicoDetalle {
  id: number;
  nombre_negocio: string;
  descripcion: string;
  telefono: string;
  email_contacto: string;
  red_social_facebook: string;
  red_social_instagram: string;
  red_social_tiktok: string;
  red_social_whatsapp: string;
  ubicacion_mapa: string;
  promociones_ofertas: string;
  categoria: Categoria;
  galeria_imagenes: ImagenGaleria[];
}

export interface Publicacion {
  id: number;
  tipo: string;
  subcategoria_evento?: string;
  titulo: string;
  slug: string;
  imagen_principal: string | null;
  fecha_evento_inicio?: string;
  fecha_evento_fin?: string;
  fecha_publicacion: string;
}

export interface RutaTuristica {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  imagen_principal_url: string | null;
}

export interface RutaTuristicaDetalle extends RutaTuristica {
  imagenes: ImagenGaleria[];
  atractivos: PrestadorPublico[]; // Reutilizamos el tipo para la tarjeta
  prestadores: PrestadorPublico[]; // Reutilizamos el tipo para la tarjeta
}

// --- Tipos para respuestas paginadas ---
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- Funciones de la API ---

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await api.get<Categoria[]>(
    "/prestadores/categorias/"
  );
  return response.data;
};

export const getPublicaciones = async (options: {
  tipo?: string;
  destacados?: boolean;
  limit?: number;
  start_date?: string;
  end_date?: string;
}): Promise<Publicacion[]> => {
  const params = new URLSearchParams();
  if (options.tipo) params.append("tipo", options.tipo);
  if (options.destacados) params.append("destacados", "true");
  if (options.limit) params.append("limit", String(options.limit));
  if (options.start_date) params.append("start_date", options.start_date);
  if (options.end_date) params.append("end_date", options.end_date);

  const response = await api.get<
    PaginatedResponse<Publicacion>
  >("/publicaciones/", { params });

  return response.data.results;
};

export const getRutasTuristicas = async (): Promise<RutaTuristica[]> => {
  const response = await api.get<PaginatedResponse<RutaTuristica>>("/rutas-turisticas/");
  return response.data.results;
};

export const getRutaTuristicaBySlug = async (slug: string): Promise<RutaTuristicaDetalle> => {
  const response = await api.get<RutaTuristicaDetalle>(`/rutas-turisticas/${slug}/`);
  return response.data;
};

export const getPrestadores = async (
  categoriaSlug?: string,
  searchTerm?: string
): Promise<PrestadorPublico[]> => {
  const params = new URLSearchParams();
  if (categoriaSlug) params.append("categoria", categoriaSlug);
  if (searchTerm) params.append("search", searchTerm);

  const response = await api.get<
    PaginatedResponse<PrestadorPublico>
  >("/prestadores/", { params });

  return response.data.results;
};

export const getPrestadorById = async (
  id: number
): Promise<PrestadorPublicoDetalle> => {
  const response = await api.get<PrestadorPublicoDetalle>(
    `/prestadores/${id}/`
  );
  return response.data;
};

// --- API de Artesanos ---

export const getRubrosArtesano = async (): Promise<RubroArtesano[]> => {
    const response = await api.get<RubroArtesano[]>('/artesanos/rubros/');
    return response.data;
};

export const getArtesanos = async (rubroSlug?: string, searchTerm?: string): Promise<ArtesanoPublico[]> => {
    const params = new URLSearchParams();
    if (rubroSlug) params.append('rubro', rubroSlug);
    if (searchTerm) params.append('search', searchTerm);

    const response = await api.get<PaginatedResponse<ArtesanoPublico>>('/artesanos/', { params });
    return response.data.results;
};

export const getArtesanoById = async (id: number): Promise<ArtesanoPublicoDetalle> => {
    const response = await api.get<ArtesanoPublicoDetalle>(`/artesanos/${id}/`);
    return response.data;
};

// --- API de Reseñas ---

export interface Resena {
  id: number;
  usuario_nombre: string;
  calificacion: number;
  comentario: string;
  fecha_creacion: string;
}

export interface CreateResenaPayload {
  calificacion: number;
  comentario: string;
  content_type: 'prestadorservicio' | 'artesano';
  object_id: number;
}

export const getResenas = async (contentType: string, objectId: number): Promise<Resena[]> => {
  const params = new URLSearchParams({
    content_type: contentType,
    object_id: String(objectId),
  });
  const response = await api.get<PaginatedResponse<Resena>>(`/resenas/`, { params });
  return response.data.results;
};

export const createResena = async (payload: CreateResenaPayload): Promise<Resena> => {
  const response = await api.post<Resena>('/resenas/', payload);
  return response.data;
};

// --- API de Moderación de Reseñas (Admin) ---

export interface AdminResena extends Resena {
  aprobada: boolean;
  content_object_repr: string;
}

export const getAdminResenas = async (aprobada?: boolean): Promise<PaginatedResponse<AdminResena>> => {
  const params = new URLSearchParams();
  if (aprobada !== undefined) {
    params.append('aprobada', String(aprobada));
  }
  const response = await api.get<PaginatedResponse<AdminResena>>(`/resenas/`, { params });
  return response.data;
};

export const approveResena = async (resenaId: number): Promise<void> => {
  await api.post(`/resenas/${resenaId}/approve/`);
};

export const deleteResena = async (resenaId: number): Promise<void> => {
  await api.delete(`/resenas/${resenaId}/`);
};

// --- API de Feedback para Proveedores ---

export interface FeedbackProveedor {
  id: number;
  tipo_mensaje: string;
  mensaje: string;
  fecha_envio: string;
  estado: string;
}

export const getFeedbackProveedor = async (): Promise<PaginatedResponse<FeedbackProveedor>> => {
  const response = await api.get<PaginatedResponse<FeedbackProveedor>>('/profile/feedback/');
  return response.data;
};

// --- API de Buzón de Sugerencias Público ---

export interface CreateSugerenciaPayload {
  nombre_remitente?: string;
  email_remitente?: string;
  tipo_mensaje: 'SUGERENCIA' | 'QUEJA' | 'FELICITACION';
  mensaje: string;
}

export const createSugerencia = async (payload: CreateSugerenciaPayload): Promise<void> => {
  await api.post('/sugerencias/', payload);
};

// --- API de Gestión de Sugerencias (Admin) ---

export interface AdminSugerencia {
  id: number;
  nombre_remitente: string;
  email_remitente: string;
  usuario: { username: string } | null;
  tipo_mensaje: string;
  mensaje: string;
  estado: string;
  fecha_envio: string;
  es_publico: boolean;
  content_object_repr: string;
}

export const getAdminSugerencias = async (estado?: string): Promise<PaginatedResponse<AdminSugerencia>> => {
  const params = new URLSearchParams();
  if (estado) params.append('estado', estado);
  const response = await api.get<PaginatedResponse<AdminSugerencia>>('/admin/sugerencias/', { params });
  return response.data;
};

export const updateSugerencia = async (
  sugerenciaId: number,
  data: Partial<{ estado: string; es_publico: boolean }>
): Promise<AdminSugerencia> => {
  const response = await api.patch<AdminSugerencia>(`/admin/sugerencias/${sugerenciaId}/`, data);
  return response.data;
};

export const deleteSugerencia = async (sugerenciaId: number): Promise<void> => {
  await api.delete(`/admin/sugerencias/${sugerenciaId}/`);
};

export interface PublicFelicitacion {
  id: number;
  mensaje: string;
  remitente: string;
}

export const getPublicasFelicitaciones = async (): Promise<PublicFelicitacion[]> => {
  const response = await api.get<PublicFelicitacion[]>('/sugerencias/felicitaciones-publicas/');
  return response.data;
};
// --- API del Consejo Consultivo ---

export interface ConsejoConsultivo {
  id: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  documento_adjunto: string | null;
}
export const getConsejoConsultivoPublicaciones = async (): Promise<ConsejoConsultivo[]> => {
  const response = await api.get<ConsejoConsultivo[]>('/consejo-consultivo/');
  // La API no pagina esta respuesta, devuelve un array directamente
  return response.data;
};

// --- API de Ubicaciones para el Mapa ---
export interface Location {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    tipo: string;
    url_detalle: string | null;
}

export const getLocations = async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/locations/');
    return response.data;
}


// --- API de Hechos Históricos ---

export interface HechoHistorico {
  id: number;
  ano: number;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  es_publicado: boolean;
}

export const getHechosHistoricos = async (): Promise<HechoHistorico[]> => {
  const response = await api.get<HechoHistorico[]>('/hechos-historicos/');
  return response.data;
};

export const createHechoHistorico = async (data: FormData): Promise<HechoHistorico> => {
  const response = await api.post('/hechos-historicos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// --- API de Caracterización de Agroturismo ---

export interface CaracterizacionAgroturismo {
    id: number;
    prestador: number;
    razon_social: string;
    camara_comercio_nit: string;
    rnt_numero: string;
    ruta_turistica: string;
    pagina_web: string;
    email_contacto: string;
    telefono_fax: string;
    tiene_normas_sectoriales: boolean;
    certificacion_recibida: string;
    sello_ambiental_colombiano: boolean;
    otras_certificaciones: string;
    pertenece_gremio_turismo: boolean;
    nombre_gremio: string;
    servicios_ofrecidos: Record<string, unknown>;
    caracteristicas_agroturismo: Record<string, unknown>;
    especialidad_agricola: Record<string, unknown>;
    especialidad_pecuaria: Record<string, unknown>;
    especialidad_avicola: Record<string, unknown>;
    especialidad_agroindustrial: Record<string, unknown>;
    actividades_agricolas: Record<string, unknown>;
    actividades_avicolas: Record<string, unknown>;
    actividades_agroindustriales: Record<string, unknown>;
    actividades_pecuarias: Record<string, unknown>;
    actividades_piscicultura: Record<string, unknown>;
    actividades_ecoturismo: Record<string, unknown>;
    actividades_turismo_aventura: Record<string, unknown>;
    otras_actividades_turismo: Record<string, unknown>;
    caracteristicas_a_potencializar: Record<string, unknown>;
    otras_actividades_a_potencializar: string;
    formacion_asesoria_deseada: Record<string, unknown>;
    protocolos_seguridad: boolean;
    protocolos_bioseguridad: boolean;
    cumple_lineamientos_escnna: boolean;
    tiene_polizas: boolean;
    nombre_polizas: string;
    espacios_salvaguarda_cultura: boolean;
    realiza_actividades_culturales: boolean;
    descripcion_actividades_culturales: string;
    realiza_actividades_llaneridad: boolean;
    descripcion_actividades_llaneridad: string;
    medios_promocion: Record<string, unknown>;
    datos_encuestado: Record<string, unknown>;
}

export const getAgroturismoCaracterizacionByPrestadorId = async (prestadorId: number): Promise<CaracterizacionAgroturismo | null> => {
    try {
        const response = await api.get<CaracterizacionAgroturismo[]>(`/caracterizacion/agroturismo/?prestador_id=${prestadorId}`);
        return response.data[0] || null;
    } catch {
        return null;
    }
};

export const createAgroturismoCaracterizacion = async (data: Partial<CaracterizacionAgroturismo>): Promise<CaracterizacionAgroturismo> => {
    const response = await api.post<CaracterizacionAgroturismo>('/caracterizacion/agroturismo/', data);
    return response.data;
};

export const updateAgroturismoCaracterizacion = async (id: number, data: Partial<CaracterizacionAgroturismo>): Promise<CaracterizacionAgroturismo> => {
    const response = await api.patch<CaracterizacionAgroturismo>(`/caracterizacion/agroturismo/${id}/`, data);
    return response.data;
};

// --- API de Caracterización de Guías Turísticos ---

export interface CaracterizacionGuiaTuristico {
    id: number;
    prestador: number;
    nombres_apellidos: string;
    documento_identidad: string;
    direccion_ubicacion: string;
    municipio: string;
    vereda_localidad: string;
    telefono_fijo: string;
    celular: string;
    email: string;
    pagina_web: string;
    foto: string | null;
    tipo_guia: string;
    tiene_rnt: boolean;
    sexo: string;
    pertenece_lgtbi: boolean;
    discapacidad: string;
    grupo_atencion_especial: string;
    especialidades: Record<string, unknown>;
    forma_prestacion_servicio: string;
    forma_prestacion_servicio_otro: string;
    pertenece_gremio: boolean;
    nombre_gremio: string;
    presta_servicios_empresa: boolean;
    nombre_empresa_servicio: string;
    rutas_servicio: string;
    atractivos_por_municipio: Record<string, unknown>;
    tecnologia_guianza_sena: boolean;
    numero_tarjeta_profesional: string;
    fecha_tarjeta: string | null;
    tiene_rnt_guia: boolean;
    numero_rnt_guia: string;
    fecha_actualizacion_rnt_guia: string | null;
    experiencia_independiente_anos: number;
    experiencia_independiente_meses: number;
    experiencia_sector_privado_anos: number;
    experiencia_sector_privado_meses: number;
    idiomas: Record<string, unknown>;
    capacitaciones_recibidas: Record<string, unknown>[];
    realiza_evaluacion_servicio: boolean;
    cual_evaluacion: string;
    temas_profundizar: string;
}

export const getGuiaCaracterizacionByPrestadorId = async (prestadorId: number): Promise<CaracterizacionGuiaTuristico | null> => {
    try {
        const response = await api.get<CaracterizacionGuiaTuristico[]>(`/caracterizacion/guias/?prestador_id=${prestadorId}`);
        return response.data[0] || null;
    } catch {
        return null;
    }
};

export const createGuiaCaracterizacion = async (data: FormData): Promise<CaracterizacionGuiaTuristico> => {
    const response = await api.post<CaracterizacionGuiaTuristico>('/caracterizacion/guias/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateGuiaCaracterizacion = async (id: number, data: FormData): Promise<CaracterizacionGuiaTuristico> => {
    const response = await api.patch<CaracterizacionGuiaTuristico>(`/caracterizacion/guias/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// --- API de Caracterización de Artesanos ---

export interface CaracterizacionArtesano {
    id: number;
    artesano: number;
    documento_identidad: string;
    direccion_ubicacion: string;
    municipio: string;
    vereda_localidad: string;
    telefono_fijo: string;
    celular: string;
    email: string;
    pagina_web: string;
    tiene_registro_artesano: boolean;
    foto: string | null;
    sexo: string;
    pertenece_lgtbi: boolean;
    discapacidad: string;
    grupo_atencion_especial: string;
    tipo_artesania: string;
    tipo_artesania_otra: string;
    origen_produccion: string;
    origen_produccion_otro: string;
    oficios_artesanales: Record<string, unknown>;
    producto_principal: string;
    materia_prima_principal: string;
    tecnica_utilizada: string;
    descripcion_proceso: string;
    pertenece_gremio: boolean;
    nombre_gremio: string;
    forma_comercializacion: string;
    forma_comercializacion_otra: string;
    ofrece_productos_empresa: boolean;
    nombre_empresa_comercializa: string;
    certificado_aptitud_sena: boolean;
    nombre_certificado_sena: string;
    numero_tarjeta_sena: string;
    fecha_tarjeta_sena: string | null;
    tiene_registro_nacional_artesano: boolean;
    numero_registro_nacional: string;
    fecha_actualizacion_registro: string | null;
    idiomas: Record<string, unknown>;
    capacitaciones_recibidas: Record<string, unknown>[];
    temas_profundizar: string;
    elementos_maquinaria_necesaria: string;
}

export const getArtesanoCaracterizacionByArtesanoId = async (artesanoId: number): Promise<CaracterizacionArtesano | null> => {
    try {
        const response = await api.get<CaracterizacionArtesano[]>(`/caracterizacion/artesanos/?artesano_id=${artesanoId}`);
        return response.data[0] || null;
    } catch {
        return null;
    }
};

export const createArtesanoCaracterizacion = async (data: FormData): Promise<CaracterizacionArtesano> => {
    const response = await api.post<CaracterizacionArtesano>('/caracterizacion/artesanos/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateArtesanoCaracterizacion = async (id: number, data: FormData): Promise<CaracterizacionArtesano> => {
    const response = await api.patch<CaracterizacionArtesano>(`/caracterizacion/artesanos/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// --- API de Consejos Locales ---

export interface IntegranteConsejo {
    id?: number;
    nombre_completo: string;
    celular: string;
    correo: string;
    sector_representa: string;
    genero: string;
    grupo_atencion_especial: string;
    tipo_discapacidad: string;
}

export interface ConsejoLocal {
    id: number;
    municipio: string;
    acto_administrativo: string;
    frecuencia_reunion: string;
    frecuencia_reunion_otro: string;
    tiene_matriz_compromisos: boolean;
    tiene_plan_accion: boolean;
    plan_accion_adjunto: string | null;
    integrantes: IntegranteConsejo[];
}

export const getConsejosLocales = async (): Promise<ConsejoLocal[]> => {
    const response = await api.get('/consejos-locales/');
    return response.data.results || response.data;
};

export const createConsejoLocal = async (data: FormData): Promise<ConsejoLocal> => {
    const response = await api.post('/consejos-locales/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateConsejoLocal = async (id: number, data: FormData): Promise<ConsejoLocal> => {
    const response = await api.patch(`/consejos-locales/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteConsejoLocal = async (id: number): Promise<void> => {
    await api.delete(`/consejos-locales/${id}/`);
};

// --- API de Diagnóstico de Rutas Turísticas ---

export interface DiagnosticoRutaTuristica {
    id: number;
    nombre_ruta: string;
    descripcion_general: string;
    actores_cadena_valor: Record<string, unknown>[];
    entidades_responsables: Record<string, unknown>[];
    eventos_turisticos: Record<string, unknown>[];
    atractivos_turisticos: Record<string, unknown>[];
    vias_acceso: string;
    transporte: string;
    senalizacion: string;
    energia: string;
    comunicaciones: string;
    distancia_desde_villavicencio: string;
    actividades_situr: string;
    actividades_escnna: string;
    actividades_rnt: string;
    actividades_formacion: string;
    actividades_promocion: string;
    actividades_nts: string;
    actividades_asociatividad: string;
    actividades_cat: string;
    elaborado_por_username: string;
    fecha_elaboracion: string;
}

export const getDiagnosticosRuta = async (): Promise<DiagnosticoRutaTuristica[]> => {
    const response = await api.get('/diagnostico-rutas/');
    return response.data.results || response.data;
};

export const createDiagnosticoRuta = async (data: Partial<DiagnosticoRutaTuristica>): Promise<DiagnosticoRutaTuristica> => {
    const response = await api.post('/diagnostico-rutas/', data);
    return response.data;
};

export const updateDiagnosticoRuta = async (id: number, data: Partial<DiagnosticoRutaTuristica>): Promise<DiagnosticoRutaTuristica> => {
    const response = await api.patch(`/diagnostico-rutas/${id}/`, data);
    return response.data;
};

export const deleteDiagnosticoRuta = async (id: number): Promise<void> => {
    await api.delete(`/diagnostico-rutas/${id}/`);
};

// --- API de Verificaciones de Cumplimiento (para Prestadores) ---

export interface RespuestaItemVerificacionDetalle {
    item_original_texto: string;
    cumple: boolean;
    justificacion: string;
}

export interface VerificacionDetalle {
    id: number;
    plantilla_usada_nombre: string;
    funcionario_evaluador_nombre: string;
    fecha_visita: string;
    puntaje_obtenido: number;
    observaciones_generales: string;
    recomendaciones: string;
    respuestas_items: RespuestaItemVerificacionDetalle[];
}

export interface VerificacionHistorialItem {
    id: number;
    fecha_visita: string;
    puntaje_obtenido: number;
    plantilla_usada_nombre: string;
    funcionario_evaluador_nombre: string;
}

export const getVerificacionHistory = async (): Promise<VerificacionHistorialItem[]> => {
    const response = await api.get('/verificaciones/');
    // La API de VerificacionViewSet devuelve una lista paginada, accedemos a results
    return response.data.results || response.data;
};

export const getVerificacionDetail = async (id: number): Promise<VerificacionDetalle> => {
    const response = await api.get(`/verificaciones/${id}/`);
    return response.data;
};


export const updateHechoHistorico = async (id: number, data: FormData): Promise<HechoHistorico> => {
  const response = await api.patch(`/hechos-historicos/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteHechoHistorico = async (id: number): Promise<void> => {
  await api.delete(`/hechos-historicos/${id}/`);
};


// --- API de Administración de Usuarios ---

export const getUsers = async (): Promise<
  PaginatedResponse<AdminUser>
> => {
  const response = await api.get("/admin/users/");
  return response.data;
};

export const createUser = async (
  userData: Omit<AdminUser, "id">
): Promise<AdminUser> => {
  const response = await api.post("/admin/users/", userData);
  return response.data;
};

export const updateUser = async (
  id: number,
  userData: Partial<AdminUser>
): Promise<AdminUser> => {
  const response = await api.patch(
    `/admin/users/${id}/`,
    userData
  );
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/admin/users/${id}/`);
};

// --- API de Configuración del Sitio ---

export const getSiteConfig = async (): Promise<SiteConfiguration> => {
  const response = await api.get("/admin/site-config/");
  return response.data;
};

export const updateSiteConfig = async (
  configData: Partial<SiteConfiguration>
): Promise<SiteConfiguration> => {
  const response = await api.patch(
    "/admin/site-config/",
    configData
  );
  return response.data;
};

// --- API de Gestión de Menús ---

export const getMenuItems = async (): Promise<
  PaginatedResponse<MenuItem>
> => {
  const response = await api.get("/admin/menu-items/");
  return response.data;
};

export interface CreateMenuItemPayload {
  nombre: string;
  url: string;
  parent?: number | null;
}

export const createMenuItem = async (
  itemData: CreateMenuItemPayload
): Promise<MenuItem> => {
  const response = await api.post("/admin/menu-items/", itemData);
  return response.data;
};

export const updateMenuItem = async (
  id: number,
  itemData: Partial<Omit<MenuItem, "id" | "children">>
): Promise<MenuItem> => {
  const response = await api.patch(
    `/admin/menu-items/${id}/`,
    itemData
  );
  return response.data;
};

export const deleteMenuItem = async (id: number): Promise<void> => {
  await api.delete(`/admin/menu-items/${id}/`);
};

export interface ReorderMenuItem {
  id: number;
  children: ReorderMenuItem[];
}

export const reorderMenuItems = async (
  menuData: ReorderMenuItem[]
): Promise<void> => {
  await api.post("/admin/menu-items/reorder/", menuData);
};

// --- API de Páginas Institucionales ---

export interface PaginaInstitucional {
  id: number;
  nombre: string;
  slug: string;
  titulo_banner: string;
  subtitulo_banner?: string;
  banner_url: string;
  contenido_principal?: string;
  programas_proyectos?: string;
  estrategias_apoyo?: string;
  politicas_locales?: string;
  convenios_asociaciones?: string;
  informes_resultados?: string;
  fecha_actualizacion: string;
  actualizado_por_username?: string;
}

export const getPaginaInstitucional = async (
  slug: string
): Promise<PaginaInstitucional> => {
  const response = await api.get(
    `/paginas-institucionales/${slug}/`
  );
  return response.data;
};

export const getPaginasInstitucionalesAdmin = async (): Promise<
  PaginatedResponse<PaginaInstitucional>
> => {
  const response = await api.get("/paginas-institucionales/");
  return response.data;
};

export const createPaginaInstitucional = async (
  data: FormData
): Promise<PaginaInstitucional> => {
  const response = await api.post(
    "/paginas-institucionales/",
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const updatePaginaInstitucional = async (
  slug: string,
  data: FormData
): Promise<PaginaInstitucional> => {
  const response = await api.patch(
    `/paginas-institucionales/${slug}/`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const deletePaginaInstitucional = async (
  slug: string
): Promise<void> => {
  await api.delete(`/paginas-institucionales/${slug}/`);
};

// --- API de Contenido del Municipio ---

export interface ContenidoMunicipio {
  id: number;
  seccion: string;
  titulo: string;
  contenido: string;
  orden: number;
}

export const getContenidoPorSeccion = async (
  seccion?: string
): Promise<ContenidoMunicipio[]> => {
  const params = new URLSearchParams();
  if (seccion) params.append("seccion", seccion);

  const response = await api.get<
    PaginatedResponse<ContenidoMunicipio>
  >("/contenido-municipio/", { params });

  return response.data.results;
};

// --- API de Gestión de Componentes de la Página Principal ---

export interface GaleriaItem {
  id: string;
  tipo: "imagen" | "video";
  url: string;
  thumbnail_url: string;
  titulo: string;
  descripcion?: string;
}

export const getGaleriaMedia = async (): Promise<GaleriaItem[]> => {
  const response = await api.get("/galeria-media/");
  return response.data;
};

export const getHomePageComponents = async (): Promise<
  PaginatedResponse<HomePageComponent>
> => {
  const response = await api.get("/admin/homepage-components/");
  return response.data;
};

export const createHomePageComponent = async (
  componentData: FormData
): Promise<HomePageComponent> => {
  const response = await api.post(
    "/admin/homepage-components/",
    componentData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const updateHomePageComponent = async (
  id: number,
  componentData: FormData
): Promise<HomePageComponent> => {
  const response = await api.patch(
    `/admin/homepage-components/${id}/`,
    componentData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const deleteHomePageComponent = async (
  id: number
): Promise<void> => {
  await api.delete(`/admin/homepage-components/${id}/`);
};

export const reorderHomePageComponents = async (
  orderedIds: number[]
): Promise<void> => {
  await api.post("/admin/homepage-components/reorder/", {
    ordered_ids: orderedIds,
  });
};

// --- API de Gestión de Publicaciones (Admin) ---

export interface AdminPublicacion {
  id: number;
  tipo: string;
  titulo: string;
  slug: string;
  contenido: string;
  imagen_principal: string;
  autor: number;
  autor_nombre: string;
  es_publicado: boolean;
  fecha_evento_inicio?: string;
  fecha_evento_fin?: string;
  fecha_publicacion: string;
  subcategoria_evento?: string;
}

export const getAdminPublicaciones = async (
  page?: number,
  esPublicado?: boolean,
  searchTerm?: string
): Promise<PaginatedResponse<AdminPublicacion>> => {
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (esPublicado !== undefined)
    params.append("es_publicado", String(esPublicado));
  if (searchTerm) params.append("search", searchTerm);

  const response = await api.get("/admin/publicaciones/", {
    params,
  });
  return response.data;
};

export const createAdminPublicacion = async (
  data: FormData
): Promise<AdminPublicacion> => {
  const response = await api.post("/admin/publicaciones/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateAdminPublicacion = async (
  id: number,
  data: FormData
): Promise<AdminPublicacion> => {
  const response = await api.patch(
    `/admin/publicaciones/${id}/`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const deleteAdminPublicacion = async (
  id: number
): Promise<void> => {
  await api.delete(`/admin/publicaciones/${id}/`);
};

export const approvePublicacion = async (id: number): Promise<void> => {
  await api.post(`/admin/publicaciones/${id}/approve/`);
};

// --- API de Logs de Auditoría ---

export const getAuditLogs = async (
  searchTerm?: string,
  page?: number,
  userId?: string,
  action?: string
): Promise<PaginatedResponse<AuditLog>> => {
  const params = new URLSearchParams();
  if (searchTerm) params.append("search", searchTerm);
  if (page) params.append("page", String(page));
  if (userId) params.append("user", userId);
  if (action) params.append("action", action);

  const response = await api.get("/admin/audit-logs/", { params });
  return response.data;
};

export const getAuditLogActionChoices = async (): Promise<
  { value: string; label: string }[]
> => {
  try {
    const response = await api.options("/admin/audit-logs/");
    const choices = response.data?.actions?.action?.choices;
    if (Array.isArray(choices)) return choices;
    return [];
  } catch {
    return [];
  }
};

// --- API de Estadísticas ---

export interface StatisticsData {
  summary: {
    usuarios: { total: number; por_rol: { [key: string]: number } };
    prestadores: { total: number };
    artesanos: { total: number };
    publicaciones: { total: number };
    atractivos: { total: number };
  };
  form_participation: {
    formulario_nombre: string;
    total_respuestas: number;
    total_objetivo: number;
    tasa_participacion: number;
  } | null;
  compliance_analysis: {
    item_texto: string;
    distribucion_actual: { cumplen: number; no_cumplen: number };
    evolucion_temporal: { ano: number; total_cumplen: number; total_no_cumplen: number }[];
  } | null;
}

export const getStatistics = async (params?: {
  form_id?: number;
  item_id?: number;
}): Promise<StatisticsData> => {
  const searchParams = new URLSearchParams();
  if (params?.form_id) searchParams.append('form_id', String(params.form_id));
  if (params?.item_id) searchParams.append('item_id', String(params.item_id));

  const response = await api.get("/admin/statistics/detailed/", { params: searchParams });
  return response.data;
};

// --- API de Caracterización de Empresas de Eventos ---

export interface CaracterizacionEmpresaEventos {
  id: number;
  prestador: number;
  nombre_representante_legal: string;
  nit: string;
  municipio: string;
  direccion_oficina: string;
  nombre_administrador: string;
  celular_contacto: string;
  pagina_web: string;
  tiene_rnt: boolean;
  numero_rnt: string;
  logo: string | null; // URL del logo
  empleados_hombres_menor_25: number;
  empleados_hombres_25_40: number;
  empleados_hombres_mayor_40: number;
  empleados_mujeres_menor_25: number;
  empleados_mujeres_25_40: number;
  empleados_mujeres_mayor_40: number;
  empleados_lgtbi: number;
  contratacion_empleados: Record<string, unknown>; // JSON
  grupos_especiales_empleados: Record<string, unknown>; // JSON
  tiempo_funcionamiento: string;
  servicios_ofrecidos: Record<string, unknown>; // JSON
  forma_prestacion_servicios: string;
  forma_prestacion_servicios_otro: string;
  pertenece_gremio: boolean;
  nombre_gremio: string;
  rutas_servicios: string;
  nivel_academico_empleados: Record<string, unknown>; // JSON
  capacitaciones_recibidas: Record<string, unknown>[]; // JSON
  tiene_certificacion_norma: boolean;
  nombre_certificacion_norma: string;
  ha_participado_ferias: boolean;
  nombre_ferias: string;
  necesidades_fortalecimiento: string;
}

export const getCaracterizacionByPrestadorId = async (prestadorId: number): Promise<CaracterizacionEmpresaEventos | null> => {
  try {
    // Asumimos que la API devuelve una lista filtrada, y tomamos el primer elemento.
    const response = await api.get<CaracterizacionEmpresaEventos[]>(`/caracterizacion/eventos/?prestador=${prestadorId}`);
    return response.data[0] || null;
  } catch {
    // Si da 404 u otro error, devolvemos null.
    return null;
  }
};

export const createCaracterizacion = async (data: FormData): Promise<CaracterizacionEmpresaEventos> => {
  const response = await api.post<CaracterizacionEmpresaEventos>('/caracterizacion/eventos/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateCaracterizacion = async (caracterizacionId: number, data: FormData): Promise<CaracterizacionEmpresaEventos> => {
  const response = await api.patch<CaracterizacionEmpresaEventos>(`/caracterizacion/eventos/${caracterizacionId}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};