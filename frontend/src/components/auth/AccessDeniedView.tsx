import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface AccessDeniedViewProps {
  onVoltarPdv: () => void;
  motivo?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  onVoltarPdv,
  motivo = 'Você não possui permissão para acessar esta área gerencial da Retaguarda.',
}) => {
  const { usuario } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[500px] p-6 font-sans select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-500 dark:text-rose-400">
            Acesso Restrito
          </span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            Acesso Não Autorizado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {motivo}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Usuário Conectado:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-mono">{usuario?.nome || 'Operador'}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Nível Hierárquico:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {usuario?.hierarquia || 'OPERADOR'}
            </span>
          </div>
        </div>

        <button
          onClick={onVoltarPdv}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Frente de Caixa (PDV)</span>
        </button>
      </div>
    </div>
  );
};
