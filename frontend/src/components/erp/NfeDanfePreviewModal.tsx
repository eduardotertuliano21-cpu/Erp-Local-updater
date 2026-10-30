import React, { useRef } from 'react';
import { Printer, Download, FolderOpen, X, CheckCircle2, FileCode2 } from 'lucide-react';
import { nfeDanfeApi } from '../../services/nfeDanfeApi.js';

interface NfeDanfePreviewModalProps {
  nota: any | null;
  onClose: () => void;
}

export const NfeDanfePreviewModal: React.FC<NfeDanfePreviewModalProps> = ({ nota, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!nota) return null;

  const handleImprimirDanfe = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
      return;
    }
    const win = window.open('', '_blank', 'width=900,height=800');
    if (win) {
      win.document.write(nota.danfe_html || '');
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  const handleBaixarXml = () => {
    const blob = new Blob([nota.xml_conteudo || ''], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nota.nome_arquivo_base || `NFe_${nota.numero}`}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBaixarHtml = () => {
    const blob = new Blob([nota.danfe_html || ''], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nota.nome_arquivo_base || `NFe_${nota.numero}`}_DANFE.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAbrirPastaLocal = async () => {
    await nfeDanfeApi.abrirPasta(nota.caminho_pasta);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Topo */}
        <div className="px-5 py-3.5 bg-slate-950 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                <span>DANFE NF-e Nº {String(nota.numero).padStart(6, '0')} (Série {nota.serie || 1})</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${nota.status === 'CANCELADA' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                  {nota.status}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-xl" title={nota.caminho_xml}>
                Salvo em: {nota.caminho_pasta} \ <b>{nota.nome_arquivo_base}.xml</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAbrirPastaLocal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              title="Abrir a pasta Ano/Mês/Data no Windows Explorer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Abrir Pasta Local</span>
            </button>
            <button
              type="button"
              onClick={handleBaixarXml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Baixar XML</span>
            </button>
            <button
              type="button"
              onClick={handleBaixarHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Salvar DANFE</span>
            </button>
            <button
              type="button"
              onClick={handleImprimirDanfe}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir DANFE A4 / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visualizador Folha A4 */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-4 overflow-auto flex justify-center">
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden w-full max-w-[210mm] min-h-[297mm] border border-slate-300">
            <iframe
              ref={iframeRef}
              title={`DANFE-${nota.numero}`}
              srcDoc={nota.danfe_html || '<p>DANFE não disponível</p>'}
              className="w-full h-full min-h-[297mm] border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
