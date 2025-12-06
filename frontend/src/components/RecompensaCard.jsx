// src/components/RecompensaCard.jsx
import React from 'react';
import { Award, Trophy, Target, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const iconoPorTipo = {
  puntos: <Zap size={18} />,
  tecnica: <Target size={18} />,
  personalizacion: <Trophy size={18} />
};

const colorPorTipo = {
  puntos: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  tecnica: 'border-blue-400 bg-blue-50 text-blue-800',
  personalizacion: 'border-purple-400 bg-purple-50 text-purple-800'
};

export default function RecompensaCard({ recompensa, esObtenida = false }) {
  const { t } = useTranslation();

  const tipoColor = colorPorTipo[recompensa.tipo] || 'border-gray-300';
  const icono = iconoPorTipo[recompensa.tipo] || <Award size={18} />;

  return (
    <div
      className={`border-l-4 rounded-lg p-4 shadow-sm transition-all ${tipoColor} ${
        esObtenida ? 'opacity-100' : 'opacity-80'
      }`}
      style={{ borderLeftWidth: '4px' }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-yellow-500">{icono}</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{recompensa.nombre}</h3>
          <p className="text-sm mt-1 text-gray-700">{recompensa.descripcion}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-white border rounded font-medium">
              +{recompensa.valor} pts
            </span>
            {esObtenida && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                ✅ Obtenida
              </span>
            )}
          </div>

          {/* Mostrar progreso si está disponible */}
          {recompensa.progreso_requisitos && !esObtenida && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Progreso:</div>
              {Object.entries(recompensa.progreso_requisitos).map(([key, prog]) => (
                <div key={key} className="mb-1">
                  <div className="flex justify-between text-xs">
                    <span>{key.replace('_', ' ')}</span>
                    <span>{prog.actual} / {prog.requerido}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full"
                      style={{ width: `${prog.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}