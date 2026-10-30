import React, { useState } from 'react';
import { FileCheck2, FileBarChart, FolderTree, HelpCircle } from 'lucide-react';
import { NfeEmissaoForm } from './NfeEmissaoForm.js';
import { NfeRelatoriosTab } from './NfeRelatoriosTab.js';
import { NfeDanfePreviewModal } from './NfeDanfePreviewModal.js';

export const NfeDanfeView: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'EMITIR' | 'RELATORIOS' | 'PASTAS'>('EMITIR');
  const [notaVisualizando, setNotaVisualizando] = useState<any | null>(null);
  const [mostrarGuia, setMostrarGuia] = useState(false);

  return (
    <div className="space-y-4">
      {/* Cabeçalho do Módulo NF-e & DANFE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Central de Emissão NF-e & DANFE (Modelo 55)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                100% LOCAL EMBARCADO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Emissão de Nota Fiscal Eletrônica A4, relatórios dedicados e arquivamento automático por <b>Ano / Mês / Data / Nº_Cliente</b>
            </p>
          </div>
        </div>

        {/* Navegação de Abas Internas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAbaAtiva('EMITIR')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              abaAtiva === 'EMITIR'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Nova Emissão NF-e / DANFE</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('RELATORIOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              abaAtiva === 'RELATORIOS'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FileBarChart className="w-3.5 h-3.5" />
            <span>Relatórios DANFE</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('PASTAS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              abaAtiva === 'PASTAS'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Pastas (Ano / Mês / Data)</span>
          </button>

          <button
            type="button"
            onClick={() => setMostrarGuia((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-sky-400 transition cursor-pointer"
            title="Como funciona a emissão e salvamento em pastas"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guia rápido retrátil */}
      {mostrarGuia && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-2xl p-4 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
          <div className="font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">Como funciona o Módulo NF-e & DANFE Local:</div>
          <p>1. <b>Emissão Embarcada:</b> Preencha o destinatário (ou busque um cliente cadastrado), inclua os produtos do catálogo, defina o frete/pagamento e clique em <b>"Emitir NF-e e Gerar DANFE A4"</b>.</p>
          <p>2. <b>Organização Automática em Pastas:</b> Cada nota emitida cria automaticamente a estrutura <code>notas_nfe / ANO / MÊS / DATA (AAAA-MM-DD)</code> e salva os arquivos com o padrão <code>NUMERO_DA_NOTA_NOME_DO_CLIENTE.xml</code> e <code>NUMERO_DA_NOTA_NOME_DO_CLIENTE_DANFE.html</code>.</p>
          <p>3. <b>Relatórios Separados:</b> Na aba <b>"Relatórios DANFE"</b> ficam apenas as notas Modelo 55 emitidas nesta tela, totalmente separadas dos cupons do Caixa PDV.</p>
        </div>
      )}

      {/* Conteúdo da Aba Selecionada */}
      {abaAtiva === 'EMITIR' && (
        <NfeEmissaoForm
          onNotaEmitida={(nota) => {
            setNotaVisualizando(nota);
          }}
        />
      )}

      {(abaAtiva === 'RELATORIOS' || abaAtiva === 'PASTAS') && (
        <NfeRelatoriosTab
          modoExibicao={abaAtiva}
          onVisualizarNota={(nota) => setNotaVisualizando(nota)}
        />
      )}

      {/* Modal de Visualização / Impressão A4 do DANFE */}
      <NfeDanfePreviewModal
        nota={notaVisualizando}
        onClose={() => setNotaVisualizando(null)}
      />
    </div>
  );
};
