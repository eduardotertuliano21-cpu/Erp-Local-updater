import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { updateApi, type UpdateInfo } from '../../services/updateApi.js';
import { UpdateModal } from '../common/UpdateModal.js';

interface ShortcutItem {
  key: string;
  label: string;
  action: () => void;
  variant?: 'primary' | 'danger' | 'warning' | 'default';
}

interface KeyboardShortcutsBarProps {
  shortcuts: ShortcutItem[];
}

export const KeyboardShortcutsBar: React.FC<KeyboardShortcutsBarProps> = ({ shortcuts }) => {
  const [versaoApp, setVersaoApp] = useState<string>('1.0.8');
  const [checandoUpdate, setChecandoUpdate] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  useEffect(() => {
    updateApi.getAppVersion().then((v) => setVersaoApp(v)).catch(() => {});
    updateApi.checarAtualizacao().then((info) => {
      if (info && info.temAtualizacao) setUpdateAvailable(info);
    }).catch(() => {});
  }, []);

  const handleChecarUpdate = async () => {
    setChecandoUpdate(true);
    try {
      const info = await updateApi.checarAtualizacao();
      setUpdateAvailable(info?.temAtualizacao ? info : null);
    } catch {
    } finally {
      setChecandoUpdate(false);
      setShowUpdateModal(true);
    }
  };

  return (
    <>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 shrink-0 z-10 select-none shadow-sm transition-colors flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {shortcuts.map((sc) => {
            let badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600';
            let btnStyle = 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700';

            if (sc.variant === 'primary') {
              badgeStyle = 'bg-emerald-600 text-white border-emerald-600 font-black';
              btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 font-bold';
            } else if (sc.variant === 'danger') {
              badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 group-hover:bg-rose-600 group-hover:text-white border-slate-300 dark:border-slate-600';
              btnStyle = 'group bg-slate-100 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-900 dark:text-slate-100 hover:text-rose-800 dark:hover:text-rose-300 border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800';
            } else if (sc.variant === 'warning') {
              badgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 group-hover:bg-amber-600 group-hover:text-white border-slate-300 dark:border-slate-600';
              btnStyle = 'group bg-slate-100 dark:bg-slate-800/90 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-900 dark:text-slate-100 hover:text-amber-900 dark:hover:text-amber-200 border-slate-300 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800';
            }

            return (
              <button
                key={sc.key}
                onClick={sc.action}
                type="button"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors focus:outline-none shrink-0 cursor-pointer ${btnStyle}`}
              >
                <kbd className={`px-1.5 py-0.5 text-[10px] font-mono font-black rounded border shadow-xs transition-colors ${badgeStyle}`}>
                  {sc.key}
                </kbd>
                <span className="whitespace-nowrap font-bold text-slate-800 dark:text-slate-100">
                  {sc.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Indicador de Versão e Checagem de Atualização */}
        <button
          onClick={handleChecarUpdate}
          disabled={checandoUpdate}
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors shrink-0 cursor-pointer font-medium ${
            updateAvailable
              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 font-bold animate-pulse'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title={updateAvailable ? `Nova versão ${updateAvailable.tag} pronta!` : `ClickStorm v${versaoApp} • Clique para checar atualizações`}
        >
          <RefreshCw className={`w-3 h-3 ${checandoUpdate ? 'animate-spin text-blue-500' : updateAvailable ? 'text-white' : 'text-emerald-500'}`} />
          <span className="font-mono text-[11px] font-bold">v{versaoApp}</span>
          <span className="hidden md:inline text-[10px] text-slate-500 dark:text-slate-400">
            {updateAvailable ? '• Atualizar' : '• Atualizado'}
          </span>
        </button>
      </footer>

      <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
    </>
  );
};

