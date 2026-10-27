import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, X, Sparkles } from 'lucide-react';
import { updateApi, type UpdateInfo, type DownloadProgress } from '../../services/updateApi.js';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInfo?: UpdateInfo | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, initialInfo }) => {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(initialInfo || null);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [installing, setInstalling] = useState(false);

  const checar = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await updateApi.checarAtualizacao();
      setUpdateInfo(info);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao GitHub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checar();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = updateApi.onUpdateDownloaded(() => {
      setDownloadProgress({
        baixando: false,
        concluido: true,
        progresso: 100,
        bytesBaixados: 0,
        totalBytes: 0,
        erro: null,
        caminhoArquivo: null,
        versaoBaixada: null,
      });
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const iniciarDownload = async () => {
    if (!updateInfo?.urlDownload) return;
    try {
      setError(null);
      const prog = await updateApi.baixarAtualizacao(updateInfo.urlDownload, updateInfo.versaoMaisRecente);
      setDownloadProgress(prog);

      const interval = setInterval(async () => {
        try {
          const p = await updateApi.obterProgresso();
          setDownloadProgress(p);
          if (p.concluido || p.erro) clearInterval(interval);
        } catch {
          clearInterval(interval);
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Falha ao baixar arquivo');
    }
  };

  const executarReinicio = async () => {
    try {
      setInstalling(true);
      await updateApi.reiniciarEInstalar(downloadProgress?.caminhoArquivo || undefined);
    } catch (err: any) {
      setError(err.message || 'Falha ao reiniciar aplicação');
      setInstalling(false);
    }
  };

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isDownloaded = downloadProgress?.concluido === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                ClickStorm Auto-Update
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualização Automática em Segundo Plano
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Consultando versões no GitHub...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Erro na verificação</span>
              </div>
              <p className="text-xs opacity-90">{error}</p>
              <button
                onClick={checar}
                className="mt-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl transition"
              >
                Tentar Novamente
              </button>
            </div>
          ) : updateInfo ? (
            <>
              {/* Versão Atual vs Versão Remota */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Versão Atual</div>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-200">v{updateInfo.versaoAtual}</div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  updateInfo.temAtualizacao
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider">
                    {updateInfo.temAtualizacao ? (
                      <span className="text-amber-600 dark:text-amber-400">Nova Versão</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Mais Recente</span>
                    )}
                  </div>
                  <div className={`text-lg font-black ${
                    updateInfo.temAtualizacao ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {updateInfo.tag || `v${updateInfo.versaoMaisRecente}`}
                  </div>
                </div>
              </div>

              {/* Status de Bloqueio se o Sistema Já Estiver Atualizado */}
              {!updateInfo.temAtualizacao ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                      ✅ O sistema já está na versão mais recente.
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Nenhuma ação necessária. As atualizações serão buscadas silenciosamente a cada 4 horas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Changelog */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Novidades da Versão:</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        {formatSize(updateInfo.tamanhoBytes)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line max-h-24 overflow-y-auto pr-1">
                      {updateInfo.notas}
                    </p>
                  </div>

                  {/* Barra de Progresso de Download Manual */}
                  {downloadProgress?.baixando && (
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 animate-bounce text-indigo-600" />
                          Baixando atualização...
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400">{downloadProgress.progresso}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${downloadProgress.progresso}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Banner de Download Concluído */}
                  {isDownloaded && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Atualização Pronta! Clique abaixo para reiniciar e aplicar.</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={checar}
            disabled={loading || downloadProgress?.baixando}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Verificar</span>
          </button>

          {/* Se houver update e ainda não foi baixado: Exibe botão de download */}
          {updateInfo?.temAtualizacao && !isDownloaded && (
            <button
              onClick={iniciarDownload}
              disabled={downloadProgress?.baixando || !updateInfo.urlDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadProgress?.baixando ? 'Baixando...' : 'Baixar Atualização'}</span>
            </button>
          )}

          {/* Se o update já estiver baixado: Exibe o botão de reiniciar */}
          {updateInfo?.temAtualizacao && isDownloaded && (
            <button
              onClick={executarReinicio}
              disabled={installing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{installing ? 'Reiniciando...' : 'Atualização Pronta - Reiniciar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
