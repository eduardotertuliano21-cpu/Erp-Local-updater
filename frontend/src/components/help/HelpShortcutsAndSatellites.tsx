import React from 'react';
import { ChefHat, QrCode, ScanBarcode } from 'lucide-react';
import { MAPA_ATALHOS_COMPLETO } from './helpSearchEngine.js';

export const HelpShortcutsGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {MAPA_ATALHOS_COMPLETO.map((item) => (
      <div
        key={item.tecla}
        className="p-3.5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
            {item.grupo}
          </div>
          <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
            {item.funcao}
          </div>
        </div>
        <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-sky-500/40 text-slate-800 dark:text-sky-300 font-mono text-xs font-black shrink-0">
          {item.tecla}
        </kbd>
      </div>
    ))}
  </div>
);

export const HelpSatellitesGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
        <QrCode className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white">
        1. Comanda Mobile do Garçom & Cardápio Digital
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Acesse <code className="text-amber-400 font-mono">http://IP_DO_SERVIDOR:5000/?mobile=1</code> no celular conectado ao mesmo Wi-Fi (ou escaneie o QR Code no botão F6 do PDV). O garçom entra com seu PIN de 4 dígitos, abre mesas e envia pedidos direto para a cozinha.
      </p>
    </div>

    <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
        <ChefHat className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white">
        2. Monitor de Cozinha KDS em Tempo Real
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Acesse <code className="text-emerald-400 font-mono">http://IP_DO_SERVIDOR:5000/?kds=1</code> em um tablet, monitor ou Smart TV na cozinha. Exibe fila em tempo real com alerta sonoro, cronômetro de atraso e botões de status (Iniciar Preparo, Pronto e Entregue).
      </p>
    </div>

    <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 space-y-3">
      <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
        <ScanBarcode className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white">
        3. Coletor de Dados & Inventário com Câmera
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Acesse <code className="text-sky-400 font-mono">http://IP_DO_SERVIDOR:5000/?coletor=1</code> pelo celular para escanear códigos de barras nas gôndolas usando a câmera traseira e ajustar o estoque da Loja ou Depósito instantaneamente.
      </p>
    </div>
  </div>
);
