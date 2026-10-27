import React, { useState, useEffect } from 'react';
import type { CaixaStatus } from '../../types/pdv.js';
import { api } from '../../services/api.js';
import { User, Settings, UtensilsCrossed, Monitor, Sun, Moon, Sparkles, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { useBusinessMode } from '../../context/BusinessModeContext.js';
import { UpdateModal } from '../common/UpdateModal.js';
import { updateApi, type UpdateInfo } from '../../services/updateApi.js';

interface HeaderBarProps {
  caixa: CaixaStatus | null;
  operadorId: string;
  onAbrirErp?: () => void;
  onAbrirConfigOperacao?: () => void;
  onAbrirMesas?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  caixa,
  operadorId,
  onAbrirErp,
  onAbrirConfigOperacao,
  onAbrirMesas,
}) => {
  const { config, isDark, toggleTheme } = useTheme();
  const { isRestaurante } = useBusinessMode();
  const [horaAtual, setHoraAtual] = useState(new Date().toLocaleTimeString('pt-BR'));
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isUpdateReady, setIsUpdateReady] = useState(false);

  useEffect(() => {
    updateApi.checarAtualizacao().then((info) => {
      if (info && info.temAtualizacao) {
        setUpdateAvailable(info);
      } else {
        setUpdateAvailable(null);
      }
    }).catch(() => {});

    const unsub = updateApi.onUpdateDownloaded(() => {
      setIsUpdateReady(true);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checarStatus = async () => {
    try {
      const res = await api.obterStatusSync();
      setIsOnline(res.success);
    } catch {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checarStatus();
    const interval = setInterval(checarStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shadow-sm relative z-20 shrink-0 gap-4 w-full select-none transition-colors duration-200">
      {/* Esquerda: Identidade & Branding Premium da Loja */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center gap-3">
          {config.logo_url ? (
            <img
              src={config.logo_url}
              alt="Logo"
              className="w-9 h-9 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-blue-600/30">
              ⚡
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white uppercase truncate max-w-[220px] sm:max-w-[280px]">
              {config.nome_loja || 'ClickStorm PDV'}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
              {config.slogan || (isRestaurante ? 'Módulo Restaurante & Comandas' : 'Frente de Caixa Varejo Pro')}
            </span>
          </div>
        </div>

        <span className="text-slate-300 dark:text-slate-700">|</span>

        {/* Botão Acessar Retaguarda ERP */}
        {onAbrirErp && (
          <button
            onClick={onAbrirErp}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Acessar Retaguarda ERP (F11)"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Retaguarda</span>
            <kbd className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-500 font-mono">F11</kbd>
          </button>
        )}
      </div>

      {/* Centro: Relógio Minimalista */}
      <div className="hidden md:flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
          {horaAtual}
        </span>
      </div>

      {/* Direita: Ações, Tema, Operador e Status */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        {/* Gestão de Mesas estritamente para nicho Restaurante */}
        {isRestaurante && onAbrirMesas && (
          <button
            onClick={onAbrirMesas}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl font-bold text-xs border border-amber-200 dark:border-amber-800/60 transition shadow-sm"
            title="Gestão de Mesas e Comandas (F6)"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Mesas</span>
          </button>
        )}

        {/* Botão de Atualização do Sistema */}
        {updateAvailable && (
          <button
            onClick={() => setShowUpdateModal(true)}
            type="button"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-white font-black text-xs shadow-md transition cursor-pointer ${
              isUpdateReady
                ? 'bg-emerald-600 hover:bg-emerald-500 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 animate-pulse hover:opacity-90'
            }`}
            title={isUpdateReady ? 'Atualização Pronta - Reiniciar' : `Nova versão ${updateAvailable.tag} disponível!`}
          >
            {isUpdateReady ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isUpdateReady ? 'Atualização Pronta - Reiniciar' : `Update ${updateAvailable.tag}`}
            </span>
          </button>
        )}

        {/* Seletor de Tema Claro / Escuro Minimalista */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Caixa / Terminal */}
        <div className="hidden sm:block text-slate-500 dark:text-slate-400 text-xs font-medium">
          Caixa <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">#0{caixa?.numero || 1}</span>
        </div>

        {/* Operador de Caixa */}
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="max-w-[110px] truncate">{operadorId || 'Operador'}</span>
        </div>

        {/* Status Servidor */}
        <div className="flex items-center gap-1.5 px-1 py-1 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full transition-colors ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'}`} />
          <span className="hidden xl:inline text-slate-500 dark:text-slate-400 font-medium text-[11px]">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Configurações Unificadas */}
        {onAbrirConfigOperacao && (
          <button
            onClick={onAbrirConfigOperacao}
            type="button"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
            title="Configurações e Regras de Operação (F3)"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        initialInfo={updateAvailable}
      />
    </header>
  );
};
