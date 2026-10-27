import React, { useState } from 'react';
import { HelpCircle, Keyboard, BookOpen, X } from 'lucide-react';
import { HelpCenterView } from '../../help/HelpCenterView.js';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS_HELP = [
  { key: 'F1', desc: 'Abre esta Central de Ajuda, Tutoriais e Atalhos' },
  { key: 'F2', desc: 'Consulta produtos por descrição, marca, cor ou tamanho' },
  { key: 'F3', desc: 'Políticas de Caixa (Segurança, Balança, Pix e Visual)' },
  { key: 'F4 / Del', desc: 'Cancela o item atualmente selecionado no cupom' },
  { key: 'F5', desc: 'Sangria de Caixa (retirada de dinheiro para cofre)' },
  { key: 'F6', desc: 'Suprimento (Varejo) | Mapa Mesas (Restaurante) | Painel OS (Assistência)' },
  { key: 'F7', desc: 'Status e conferência do saldo em gaveta atual' },
  { key: 'F8', desc: 'Fechamento de Turno do Caixa' },
  { key: 'F9', desc: 'Cancela toda a venda atual (com auditoria)' },
  { key: 'F10', desc: 'Abre a tela de Finalização de Pagamento' },
  { key: 'F11', desc: 'Alterna entre Frente de Caixa (PDV) e Retaguarda (ERP)' },
  { key: 'F12', desc: 'Sair / Trocar Operador (Logout)' },
  { key: 'PageUp / Down', desc: 'PageUp ativa NFC-e Fiscal (Vermelho) | PageDown modo Recibo' },
  { key: 'Ctrl+1 a 5', desc: 'No F10: 1 Dinheiro | 2 PIX | 3 Débito | 4 Crédito | 5 Convênio/Fiado' },
  { key: 'QTD*CÓDIGO', desc: 'Multiplicador rápido (Ex: 3*7891000100103 ou 6*COCA)' },
  { key: 'ESC', desc: 'Fecha qualquer janela e devolve o foco para o leitor' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [aba, setAba] = useState<'TUTORIAIS' | 'ATALHOS'>('TUTORIAIS');

  if (!isOpen) return null;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Cabeçalho do Modal F1 */}
        <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                Central de Ajuda & Pesquisa Inteligente (F1)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Encontre tutoriais passo a passo ou consulte todos os atalhos de teclado do caixa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAba('TUTORIAIS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                aba === 'TUTORIAIS'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pesquisar Tutoriais</span>
            </button>

            <button
              type="button"
              onClick={() => setAba('ATALHOS')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                aba === 'ATALHOS'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Atalhos Rápidos PDV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition cursor-pointer ml-1"
              title="Fechar [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo Rolável */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {aba === 'TUTORIAIS' ? (
            <HelpCenterView compactMode={true} onVoltarPdv={onClose} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              {SHORTCUTS_HELP.map((s) => (
                <div
                  key={s.key}
                  className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3"
                >
                  <kbd className="px-2.5 py-1 bg-sky-950 border border-sky-600 text-sky-300 font-bold rounded-lg shadow-xs shrink-0">
                    {s.key}
                  </kbd>
                  <span className="text-slate-700 dark:text-slate-200 font-sans text-xs font-medium">
                    {s.desc}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Dica: Na Retaguarda ERP (<kbd className="font-mono font-bold">F11</kbd>), acesse também o menu <strong>Ajuda & Tutoriais</strong>.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            [ESC] Voltar ao Caixa PDV
          </button>
        </div>
      </div>
    </div>
  );
};
