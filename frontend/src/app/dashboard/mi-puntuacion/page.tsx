"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVerificacionHistory, getVerificacionDetail, VerificacionHistorialItem, VerificacionDetalle } from '@/services/api';
import { FiAward, FiCheckSquare, FiMessageSquare, FiEdit, FiStar, FiEye, FiX } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from '@/components/Modal';
import axios from 'axios';

// --- Interfaces ---
interface Score {
  puntuacion_verificacion?: number;
  puntuacion_capacitacion: number;
  puntuacion_reseñas: number;
  puntuacion_formularios: number;
  puntuacion_total: number;
}

// --- Componentes ---
const ScoreCard = ({ title, score, icon: Icon }: { title: string, score: number, icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="bg-blue-100 p-3 rounded-full">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{score} pts</p>
    </div>
  </div>
);

const LevelIndicator = ({ score }: { score: number }) => {
  let level = { name: 'Bronce', color: 'text-yellow-600', bgColor: 'bg-yellow-100', nextLevel: 100 };
  if (score >= 100) level = { name: 'Plata', color: 'text-gray-500', bgColor: 'bg-gray-200', nextLevel: 250 };
  if (score >= 250) level = { name: 'Oro', color: 'text-yellow-400', bgColor: 'bg-yellow-50', nextLevel: 500 };
  if (score >= 500) level = { name: 'Diamante', color: 'text-blue-400', bgColor: 'bg-blue-50', nextLevel: Infinity };

  const progress = level.nextLevel !== Infinity ? (score / level.nextLevel) * 100 : 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <FiAward className={`mx-auto h-16 w-16 ${level.color}`} />
      <h3 className={`mt-4 text-2xl font-bold ${level.color}`}>{level.name}</h3>
      <p className="text-gray-600">Tu Nivel Actual</p>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full ${level.bgColor.replace('bg-', 'bg-')}`} style={{ width: `${progress}%` }}></div>
        </div>
        {level.nextLevel !== Infinity && (
          <p className="text-sm text-gray-500 mt-2">
            {level.nextLevel - score} puntos para el siguiente nivel
          </p>
        )}
      </div>
    </div>
  );
};

const VerificationDetailModal = ({ verificacion, onClose }: { verificacion: VerificacionDetalle, onClose: () => void }) => (
    <Modal title={`Detalle de Verificación - ${new Date(verificacion.fecha_visita).toLocaleDateString()}`} onClose={onClose}>
        <div className="space-y-4">
            <p><strong>Plantilla:</strong> {verificacion.plantilla_usada_nombre}</p>
            <p><strong>Evaluador:</strong> {verificacion.funcionario_evaluador_nombre}</p>
            <p><strong>Puntaje Obtenido:</strong> <span className="font-bold text-blue-600">{verificacion.puntaje_obtenido}</span></p>

            <div className="mt-4">
                <h4 className="font-semibold text-lg mb-2">Ítems Evaluados</h4>
                <ul className="space-y-2">
                    {verificacion.respuestas_items.map(item => (
                        <li key={item.item_original_texto} className="flex items-start p-2 border-b">
                            {item.cumple ? <FiCheckSquare className="text-green-500 mt-1 mr-2 flex-shrink-0"/> : <FiX className="text-red-500 mt-1 mr-2 flex-shrink-0"/>}
                            <div className="flex-grow">
                                <p>{item.item_original_texto}</p>
                                {item.justificacion && <p className="text-xs text-gray-500 italic mt-1">Justificación: {item.justificacion}</p>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {verificacion.observaciones_generales && (
                <div className="mt-4">
                    <h4 className="font-semibold text-lg">Observaciones Generales</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{verificacion.observaciones_generales}</p>
                </div>
            )}
             {verificacion.recomendaciones && (
                <div className="mt-4">
                    <h4 className="font-semibold text-lg">Recomendaciones</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{verificacion.recomendaciones}</p>
                </div>
            )}
        </div>
    </Modal>
);

const MiPuntuacionPage = () => {
  const { user, token } = useAuth();
  const [score, setScore] = useState<Score | null>(null);
  const [history, setHistory] = useState<VerificacionHistorialItem[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<VerificacionDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScore = useCallback(async () => {
      if (user && token) {
        const endpoint = user.role === 'PRESTADOR' ? '/profile/prestador/' : '/profile/artesano/';
        const apiClient = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
            headers: { 'Authorization': `Token ${token}` },
        });
        return apiClient.get<Score>(endpoint).then(res => res.data);
      }
      return Promise.resolve(null);
  }, [user, token]);

  const fetchHistory = useCallback(async () => {
      if (user?.role === 'PRESTADOR' && token) {
          return getVerificacionHistory();
      }
      return Promise.resolve([]);
  }, [user, token]);

  useEffect(() => {
    Promise.all([fetchScore(), fetchHistory()])
        .then(([scoreData, historyData]) => {
            setScore(scoreData);
            setHistory(historyData);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            toast.error("No se pudo cargar tu información de puntuación.");
        })
        .finally(() => setIsLoading(false));
  }, [fetchScore, fetchHistory]);

  const handleViewDetails = async (id: number) => {
      try {
          const details = await getVerificacionDetail(id);
          setSelectedVerification(details);
      } catch (error) {
          toast.error("No se pudieron cargar los detalles de la verificación.");
      }
  };

  if (isLoading) return <div className="text-center p-8">Cargando tu puntuación...</div>;
  if (!score) return <div className="text-center p-8 text-red-500">No se pudo cargar la información de puntuación.</div>;

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Mi Puntuación</h1>
      <p className="text-gray-600 mb-8">Este es un resumen de tu participación y contribución en la plataforma.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">Desglose de Puntos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user?.role === 'PRESTADOR' && typeof score.puntuacion_verificacion === 'number' && <ScoreCard title="Verificación de Cumplimiento" score={score.puntuacion_verificacion} icon={FiCheckSquare} />}
                <ScoreCard title="Asistencia a Capacitaciones" score={score.puntuacion_capacitacion} icon={FiAward} />
                <ScoreCard title="Reseñas de Turistas" score={score.puntuacion_reseñas} icon={FiStar} />
                <ScoreCard title="Formularios Completados" score={score.puntuacion_formularios} icon={FiEdit} />
            </div>
            {user?.role === 'PRESTADOR' && history.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Historial de Verificaciones</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {history.map(item => (
                                <li key={item.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{item.plantilla_usada_nombre}</p>
                                        <p className="text-sm text-gray-500">Fecha: {new Date(item.fecha_visita).toLocaleDateString()} - Evaluador: {item.funcionario_evaluador_nombre}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-blue-600">{item.puntaje_obtenido} pts</p>
                                        <button onClick={() => handleViewDetails(item.id)} className="text-sm text-indigo-600 hover:underline">Ver Detalles</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">Nivel y Total</h2>
            <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg text-center">
                <p className="text-lg">Puntuación Total</p>
                <p className="text-5xl font-extrabold">{score.puntuacion_total}</p>
            </div>
            <LevelIndicator score={score.puntuacion_total} />
        </div>
      </div>
      {selectedVerification && <VerificationDetailModal verificacion={selectedVerification} onClose={() => setSelectedVerification(null)} />}
    </div>
  );
};

export default MiPuntuacionPage;