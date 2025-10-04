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
import FormBuilder from "./FormBuilder";
import { FiCheckCircle, FiClock, FiFilter } from "react-icons/fi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AdminPrestador {
  id: number;
  nombre_negocio: string;
  aprobado: boolean;
  fecha_creacion: string;
  categoria_nombre: string;
  usuario_email: string;
}

type AdminTab =
  | "estadisticas"
  | "prestadores"
  | "artesanos"
  | "publicaciones"
  | "reseñas"
  | "sugerencias"
  | "consejos"
  | "rutas"
  | "formularios"
  | "paginas"
  | "contenido"
  | "historia"
  | "inicio"
  | "menu"
  | "configuracion"
  | "usuarios"
  | "keys"
  | "audit";

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
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          {/* Table content */}
        </table>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user, token } = useAuth();

  const visibleTabs = useMemo(() => {
    if (!user) return [];
    const all: AdminTab[] = ["estadisticas", "prestadores", "artesanos", "publicaciones", "reseñas", "sugerencias", "consejos", "rutas", "formularios", "paginas", "contenido", "historia", "inicio", "usuarios", "menu", "configuracion", "keys", "audit"];
    const funcionario: AdminTab[] = ["estadisticas", "prestadores", "artesanos", "publicaciones", "reseñas", "sugerencias", "consejos", "rutas", "formularios", "contenido", "inicio", "usuarios"];
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
    // Approve logic
  };

 const renderContent = () => {
  switch (activeTab) {
    case "prestadores": return <PrestadoresList onApprove={handleApprovePrestador} />;
    case "artesanos": return <ArtesanosManager />;
    case "reseñas": return <ResenasManager />;
    case "sugerencias": return <FeedbackManager />;
    case "consejos": return <ConsejosManager />;
    case "rutas": return <RutasManager />;
    case "formularios": return <FormBuilder />;
    case "publicaciones": return <PublicacionManager />;
    case "paginas": return <PaginaInstitucionalManager />;
    case "contenido": return <MunicipioContentManager />;
    case "historia": return <HistoriaManager />;
    case "inicio": return <HomePageManager />;
    case "menu": return <MenuManager />;
    case "configuracion": return <SiteConfigManager />;
    case "usuarios": return <UserManager />;
    case "keys": return <LLMKeysManager />;
    case "audit": return <AuditLogViewer />;
    case "estadisticas": return <StatisticsDashboard />;
    default: return null;
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