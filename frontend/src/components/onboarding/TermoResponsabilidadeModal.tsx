import React, { useState, useRef } from 'react';
import { CLAUSULAS_TERMO } from './termoResponsabilidadeData.js';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface TermoResponsabilidadeModalProps {
  isOpen: boolean;
  onAceitar: () => void;
  somenteConsulta?: boolean;
  onClose?: () => void;
}

export const TermoResponsabilidadeModal: React.FC<TermoResponsabilidadeModalProps> = ({
  isOpen,
  onAceitar,
  somenteConsulta = false,
  onClose,
}) => {
  const [concordou, setConcordou] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dataAceiteSalva = localStorage.getItem('clickstorm_termo_aceito_data');

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!concordou && !somenteConsulta) return;
    const agora = new Date().toISOString();
    localStorage.setItem('clickstorm_termo_aceito', 'true');
    localStorage.setItem('clickstorm_termo_aceito_data', agora);
    onAceitar();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Header do Termo */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {somenteConsulta ? 'Consulta de Termos' : 'Primeiro Acesso Obrigatório'}
                </span>
                <span className="text-xs text-slate-500 font-mono">v1.0.0</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Termos de Licenciamento, Responsabilidade e Isenção de Danos
              </h2>
            </div>
          </div>
          {somenteConsulta && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Alerta de Abertura */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-300 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {somenteConsulta
              ? `Termo registrado e aceito anteriormente em: ${
                  dataAceiteSalva ? new Date(dataAceiteSalva).toLocaleString('pt-BR') : 'Data não informada'
                }`
              : 'Para configurar e iniciar a utilização do ClickStorm ERP & PDV, leia e aceite integralmente as condições legais abaixo.'}
          </span>
        </div>

        {/* Conteúdo Rolável das Cláusulas */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-slate-300 text-xs sm:text-sm leading-relaxed"
        >
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-xs">
            <p>
              Este documento estabelece as diretrizes legais, os limites de responsabilidade e as obrigações entre a desenvolvedora do sistema (<strong className="text-white">ClickStorm Systems</strong>) e o <strong className="text-white">Lojista / Contratante</strong>.
            </p>
          </div>

          {CLAUSULAS_TERMO.map((clausula) => (
            <div
              key={clausula.numero}
              className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2 hover:border-slate-700/80 transition"
            >
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <span className="text-base">{clausula.icone}</span>
                <span className="text-cyan-400 font-mono">{clausula.numero}.</span>
                <span>{clausula.titulo}</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5 whitespace-pre-line pl-6">
                {clausula.conteudo}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé e Confirmação de Aceite */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 shrink-0 space-y-3">
          {!somenteConsulta ? (
            <>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={concordou}
                  onChange={(e) => setConcordou(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-300">
                  Declaro que li atentamente todas as <strong className="text-white">8 cláusulas</strong> acima, compreendo a arquitetura <strong className="text-cyan-400">Local-First</strong>, assumo total responsabilidade pela parametrização fiscal e guarda de backups, e concordo integralmente com os termos de licenciamento e telemetria.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Aceite com validade jurídica perante o Art. 10 da MP 2.200-2/2001
                </span>
                <button
                  type="button"
                  disabled={!concordou}
                  onClick={handleConfirmar}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aceitar e Iniciar Configuração</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
              >
                Fechar Consulta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
