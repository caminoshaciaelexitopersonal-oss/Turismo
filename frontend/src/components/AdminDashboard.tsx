"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import MunicipioContentManager from "./MunicipioContentManager";
import PaginaInstitucionalManager from "./PaginaInstitucionalManager";
import ArtesanosManager from "./ArtesanosManager";
import LLMKeysManager from "./LLMKeysManager";
import MenuManager from "./MenuManager";
import HistoriaManager from "./HistoriaManager";
import SiteConfigManager from "./SiteConfigManager";
import UserManager from "./UserManager";
import HomePageManager from "./HomePageManager";
import AuditLogViewer from "./AuditLogViewer";
import StatisticsDashboard from "./StatisticsDashboard";
import PublicacionManager from "./PublicacionManager";
import ResenasManager from "./ResenasManager";
import FeedbackManager from "./FeedbackManager";
import ConsejosManager from "./ConsejosManager";
import RutasManager from "./RutasManager";
import { FiCheckCircle, FiClock, FiFilter } from "react-icons/fi";

const API_BASE_URL = "http://localhost:8000/api";

interface AdminPrestador {
  id: number;
  nombre_negocio: string;
  aprobado: boolean;
  fecha_creacion: string;
  categoria_nombre: string;
  usuario_email: string;
}

type AdminTab =
  | "prestadores"
  | "artesanos"
  | "publicaciones"
  | "reseñas"
  | "sugerencias"
  | "consejos"
  | "rutas"
  | "paginas"
  | "contenido"
  | "historia"
  | "inicio"
  | "menu"
  | "configuracion"
  | "usuarios"
  | "keys"
  | "audit"
  | "estadisticas";

// --- Lista de Prestadores ---
const PrestadoresList = ({ onApprove }: { onApprove: (id: number) => void }) => {
  const { user, token } = useAuth();
  const [prestadores, setPrestadores] = useState<AdminPrestador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("pending");

  const fetchPrestadores = useCallback(async () => {
    if (!token || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("aprobado", (filter === "approved").toString());
      }
      const response = await axios.get(`${API_BASE_URL}/admin/prestadores/`, {
        headers: { Authorization: `Token ${token}` },
        params,
      });
      setPrestadores(response.data.results);
    } catch (err) {
      setError("No se pudo cargar la lista de prestadores.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, filter]);

  useEffect(() => {
    fetchPrestadores();
  }, [fetchPrestadores]);

  if (isLoading) return <p className="text-center py-8 text-gray-500">Cargando prestadores...</p>;
  if (error) return <p className="text-center py-8 text-red-500">{error}</p>;
  if (prestadores.length === 0)
    return <p className="text-center py-8 text-gray-500">No hay prestadores en esta categoría.</p>;

  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Prestadores</h2>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "approved" | "pending")}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {/* Móvil */}
      <div className="md:hidden space-y-4">
        {prestadores.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800">{p.nombre_negocio}</h3>
              {p.aprobado ? (
                <span className="flex items-center px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                  <FiCheckCircle className="mr-1" /> Aprobado
                </span>
              ) : (
                <span className="flex items-center px-2.5 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                  <FiClock className="mr-1" /> Pendiente
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">{p.usuario_email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Registrado: {new Date(p.fecha_creacion).toLocaleDateString()}
            </p>
            {!p.aprobado && (
              <div className="mt-4 text-right">
                <button
                  onClick={() => onApprove(p.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                >
                  Aprobar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Escritorio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Negocio
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Contacto
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Registro
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {prestadores.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {p.nombre_negocio}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-600">{p.usuario_email}</td>
                <td className="py-4 px-6 whitespace-nowrap text-gray-600">
                  {new Date(p.fecha_creacion).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {p.aprobado ? (
                    <span className="flex items-center px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                      <FiCheckCircle className="mr-1" /> Aprobado
                    </span>
                  ) : (
                    <span className="flex items-center px-2.5 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                      <FiClock className="mr-1" /> Pendiente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!p.aprobado && (
                    <button
                      onClick={() => onApprove(p.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                    >
                      Aprobar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Dashboard Principal ---
export default function AdminDashboard() {
  const { user, token } = useAuth();

  const visibleTabs = useMemo(() => {
    if (!user) return [];

    const all: AdminTab[] = [
      "estadisticas",
      "prestadores",
      "artesanos",
      "publicaciones",
      "reseñas",
      "sugerencias",
      "consejos",
      "rutas",
      "paginas",
      "contenido",
      "historia",
      "inicio",
      "usuarios",
      "menu",
      "configuracion",
      "keys",
      "audit",
    ];

    const funcionario: AdminTab[] = [
      "estadisticas",
      "prestadores",
      "artesanos",
      "publicaciones",
      "reseñas",
      "sugerencias",
      "consejos",
      "rutas",
      "contenido",
      "inicio",
      "usuarios",
    ];

    if (user.role === "ADMIN") return all;
    if (user.role === "FUNCIONARIO_DIRECTIVO" || user.role === "FUNCIONARIO_PROFESIONAL") return funcionario;
    return [];
  }, [user]);

  const [activeTab, setActiveTab] = useState<AdminTab>("estadisticas");

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  const handleApprovePrestador = async (id: number) => {
    if (!token || !window.confirm("¿Está seguro de que desea aprobar a este prestador?")) return;
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/prestadores/${id}/approve/`,
        {},
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
    } catch (err) {
      alert("Error al aprobar el prestador.");
      console.error(err);
    }
  };
 const renderContent = () => {
  switch (activeTab) {
    case "prestadores":
      return <PrestadoresList onApprove={handleApprovePrestador} />;
    case "artesanos":
      return <ArtesanosManager />;
    case "reseñas":
      return <ResenasManager />;
    case "sugerencias":
      return <FeedbackManager />;
    case "consejos":
      return <ConsejosManager />;
    case "rutas":
      return <RutasManager />;
    case "publicaciones":
      return <PublicacionManager />;
    case "paginas":
      return <PaginaInstitucionalManager />;
    case "contenido":
      return <MunicipioContentManager />;
    case "historia":
      return <HistoriaManager />;
    case "inicio":
      return <HomePageManager />;
    case "menu":
      return <MenuManager />;
    case "configuracion":
      return <SiteConfigManager />;
    case "usuarios":
      return <UserManager />;
    case "keys":
      return <LLMKeysManager />;
    case "audit":
      return <AuditLogViewer />;
    case "estadisticas":
      return <StatisticsDashboard />;
    default:
      return null;
  }
};

  if (!user) {
    return <div className="text-center py-20">Cargando panel de administración...</div>;
  }

  if (visibleTabs.length === 0) {
    return <div className="text-center py-20 text-red-600">No tiene permisos para acceder a esta sección.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans">
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">{renderContent()}</div>
    </div>
  );
}
