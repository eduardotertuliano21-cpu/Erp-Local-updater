import React, { useState, useEffect } from 'react';
import { HardDrive, Server, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { backupApi } from '../../services/backupApi.js';
import { api } from '../../services/api.js';

export const FailoverBackupTab: React.FC = () => {
  const [unidades, setUnidades] = useState<string[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [executandoBackup, setExecutandoBackup] = useState(false);
  const [promovendo, setPromovendo] = useState(false);
  const [resultadoBackup, setResultadoBackup] = useState<any | null>(null);
  const [statusDiscovery, setStatusDiscovery] = useState<any | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const carregarStatus = async () => {
    setLoadingUnidades(true);
    const [resUnidades, resDiscovery] = await Promise.all([
      backupApi.listarUnidades(),
      api.obterDiscoveryStatus(),
    ]);
    if (resUnidades.success && resUnidades.data) {
      setUnidades(resUnidades.data.unidades || []);
    }
    if (resDiscovery.success && resDiscovery.data) {
      setStatusDiscovery(resDiscovery.data);
    }
    setLoadingUnidades(false);
  };

  useEffect(() => {
    carregarStatus();
  }, []);

  const handleBackupUsb = async () => {
    setExecutandoBackup(true);
    setResultadoBackup(null);
    const res = await backupApi.executarBackupUsb();
    setExecutandoBackup(false);
    if (res.success && res.data) {
      setResultadoBackup(res.data);
      setMensagemSucesso('✓ Backup concluído com sucesso na unidade USB!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } else {
      setResultadoBackup({ sucesso: false, mensagem: res.error || 'Falha ao executar backup USB.' });
    }
  };

  const handlePromoverMaster = async () => {
    setPromovendo(true);
    const res = await backupApi.promoverMaster();
    setPromovendo(false);
    if (res.success) {
      setMensagemSucesso('✓ Terminal promovido com sucesso para Servidor Master!');
      carregarStatus();
      setTimeout(() => setMensagemSucesso(null), 4000);
    }
  };

  return (
    <div className="space-y-5 text-xs font-sans">
      {mensagemSucesso && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Failover / Master Server Promotion */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Topologia de Rede & Promoção a Master (Failover)</span>
          </div>
          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {statusDiscovery?.role || 'MASTER'}
          </span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Se o computador principal falhar ou desligar, qualquer terminal caixa (Slave) pode ser elevado imediatamente a Servidor Master, assumindo o controle das vendas e das comandas locais.
        </p>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px] text-slate-300">
          <div>• Papel Atual: <strong className="text-white">{statusDiscovery?.role || 'MASTER'}</strong></div>
          <div>• IP Master Atual: <strong className="text-white">{statusDiscovery?.masterIp || '127.0.0.1'}</strong></div>
          <div>• Porta de Operação: <strong className="text-white">{statusDiscovery?.localPort || 5000}</strong></div>
        </div>

        <button
          onClick={handlePromoverMaster}
          disabled={promovendo}
          className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 text-white font-black rounded-xl text-xs transition shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-40"
        >
          <Server className="w-4 h-4" />
          <span>{promovendo ? 'Promovendo...' : 'Elevar este Terminal a Servidor Master'}</span>
        </button>
      </div>

      {/* USB Pendrive Backup */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Cópia de Segurança Automática em Pendrive (USB Dump)</span>
          </div>
          <button
            onClick={carregarStatus}
            disabled={loadingUnidades}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            title="Atualizar unidades detectadas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUnidades ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          O serviço local ClickStorm monitora portas USB em background e realiza o espelhamento das bases SQLite (catálogo e operações de venda) na pasta <strong>ClickStorm_Backups/</strong> do pendrive.
        </p>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="text-[11px] font-bold text-slate-300">Unidades Removíveis Detectadas:</div>
          {unidades.length === 0 ? (
            <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Nenhum pendrive USB plugado no momento. Insira o pendrive e clique em Atualizar.</span>
            </div>
          ) : (
            <div className="flex gap-2">
              {unidades.map((u) => (
                <span key={u} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-xs flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  <span>Unidade {u}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleBackupUsb}
          disabled={executandoBackup}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-40"
        >
          <HardDrive className="w-4 h-4" />
          <span>{executandoBackup ? 'Gravando no Pendrive...' : 'Fazer Backup Agora no Pendrive'}</span>
        </button>

        {resultadoBackup && (
          <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-1 ${
            resultadoBackup.sucesso ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/80 border-rose-800 text-rose-300'
          }`}>
            <div className="font-bold">{resultadoBackup.mensagem}</div>
            {resultadoBackup.pastaDestino && <div>Destino: {resultadoBackup.pastaDestino}</div>}
            {resultadoBackup.arquivosCopiados?.length > 0 && (
              <div>Arquivos: {resultadoBackup.arquivosCopiados.join(', ')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
