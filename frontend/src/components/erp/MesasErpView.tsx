import React, { useState, useEffect } from 'react';
import { subscribeToMesas } from '../../services/restaurantSocket.js';
import { RestaurantTablesGrid } from '../restaurant/RestaurantTablesGrid.js';
import type { Mesa } from '../restaurant/RestaurantTablesBar.js';
import { RefreshCw } from 'lucide-react';
import { useBusinessMode } from '../../context/BusinessModeContext.js';

export const MesasErpView: React.FC = () => {
  const { isRestaurante } = useBusinessMode();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaAtiva, setMesaAtiva] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  if (!isRestaurante) return null;

  useEffect(() => {
    const unsub = subscribeToMesas(
      (todasMesas) => {
        setMesas(todasMesas);
        setLoading(false);
      },
      (mesaAtualizada) => {
        setMesas((prev) =>
          prev.map((m) => (m.numero === mesaAtualizada.numero ? mesaAtualizada : m))
        );
      }
    );
    return () => unsub();
  }, []);

  if (loading && mesas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Conectando ao Mapa de Mesas...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <RestaurantTablesGrid
        mesas={mesas}
        mesaAtiva={mesaAtiva}
        onSelectMesa={(num) => setMesaAtiva(num)}
        onClose={() => setMesaAtiva(null)}
      />
    </div>
  );
};
