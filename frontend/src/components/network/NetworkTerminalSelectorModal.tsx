import React, { useState, useEffect } from 'react';
import { Server, Monitor, Wifi, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { setApiBaseUrl } from '../../services/api.js';

interface NetworkTerminalSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkTerminalSelectorModal: React.FC<NetworkTerminalSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [modo, setModo] = useState<'MASTER' | 'TERMINAL'>('MASTER');
  const [ipMaster, setIpMaster] = useState('');
  const [portaMaster, setPortaMaster] = useState('5000');
  const [numeroCaixaFisico, setNumeroCaixaFisico] = useState('02');
  const [testando, setTestando] = useState(false);
  const [statusConexao, setStatusConexao] = useState<{
    sucesso?: boolean;
    mensagem?: string;
    latenciaMs?: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('clickstorm_network_role') as 'MASTER' | 'TERMINAL' | null;
      const savedUrl = localStorage.getItem('clickstorm_master_url');
      const savedCaixa = localStorage.getItem('clickstorm_numero_caixa_fisico');

      if (savedMode) setModo(savedMode);
      if (savedCaixa) setNumeroCaixaFisico(savedCaixa);
      if (savedUrl) {
        try {
          const parsed = new URL(savedUrl);
          setIpMaster(parsed.hostname);
          setPortaMaster(parsed.port || '5000');
        } catch {
          setIpMaster('');
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testarConexao = async () => {
    setTestando(true);
    setStatusConexao(null);

    const host = modo === 'MASTER' ? 'localhost' : ipMaster.trim();
    if (!host) {
      setStatusConexao({ sucesso: false, mensagem: 'Informe o endereço IP do Servidor Master.' });
      setTestando(false);
      return;
    }

    const testUrl = `http://${host}:${portaMaster}/health`;
    const inicio = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(testUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      const fim = performance.now();
      const latencia = Math.round(fim - inicio);

      if (res.ok) {
        setStatusConexao({
          sucesso: true,
          mensagem: `Conexão LAN estabelecida com sucesso! (${latencia}ms)`,
          latenciaMs: latencia,
        });
      } else {
        setStatusConexao({
          sucesso: false,
          mensagem: `Servidor respondeu com status ${res.status}. Verifique o serviço.`,
        });
      }
    } catch (err: any) {
      setStatusConexao({
        sucesso: false,
        mensagem: 'Não foi possível alcançar o Servidor Master. Verifique o IP e o Firewall.',
      });
    } finally {
      setTestando(false);
    }
  };

  const handleSalvar = async () => {
    if (modo === 'MASTER') {
      localStorage.setItem('clickstorm_network_role', 'MASTER');
      localStorage.setItem('clickstorm_numero_caixa_fisico', '01');
      localStorage.removeItem('clickstorm_master_url');
      setApiBaseUrl('http://localhost:5000/api');
    } else {
      const host = ipMaster.trim() || 'localhost';
      const baseUrl = `http://${host}:${portaMaster}`;
      const url = `${baseUrl}/api`;
      const numCaixa = numeroCaixaFisico.trim() || '02';
      localStorage.setItem('clickstorm_network_role', 'TERMINAL');
      localStorage.setItem('clickstorm_master_url', url);
      localStorage.setItem('clickstorm_numero_caixa_fisico', numCaixa);
      setApiBaseUrl(url);

      try {
        const res = await fetch(`${baseUrl}/api/settings`);
        if (res.ok) {
          const dados = await res.json();
          if (dados?.data || dados) {
            localStorage.setItem('clickstorm_master_settings', JSON.stringify(dados.data || dados));
          }
        }
      } catch (_e) {}
    }
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Topologia de Rede (Multi-Terminal)</h2>
              <p className="text-xs text-slate-400">Configure este dispositivo como Servidor ou Terminal LAN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção do Papel */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setModo('MASTER'); setStatusConexao(null); }}
            className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
              modo === 'MASTER'
                ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Server className={`w-6 h-6 ${modo === 'MASTER' ? 'text-blue-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-sm font-bold">Servidor (Master)</div>
              <div className="text-[11px] opacity-75">Hospeda o banco SQLite e atende outros caixas</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setModo('TERMINAL'); setStatusConexao(null); }}
            className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
              modo === 'TERMINAL'
                ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Monitor className={`w-6 h-6 ${modo === 'TERMINAL' ? 'text-blue-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-sm font-bold">Terminal Adicional</div>
              <div className="text-[11px] opacity-75">Caixa secundário conectado via rede local (LAN)</div>
            </div>
          </button>
        </div>

        {/* Configuração de IP caso seja Terminal */}
        {modo === 'TERMINAL' && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-semibold text-slate-300">Endereço IP do Computador Master</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: 192.168.1.50"
                value={ipMaster}
                onChange={(e) => setIpMaster(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <input
                type="text"
                placeholder="5000"
                value={portaMaster}
                onChange={(e) => setPortaMaster(e.target.value)}
                className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Número deste Caixa Físico (Ex: 02, 03)</label>
              <input
                type="text"
                placeholder="Ex: 02"
                maxLength={4}
                value={numeroCaixaFisico}
                onChange={(e) => setNumeroCaixaFisico(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono mt-1"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Certifique-se de que ambos os computadores estão na mesma rede Wi-Fi ou cabo Ethernet.
            </p>
          </div>
        )}

        {/* Feedback do Teste */}
        {statusConexao && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
              statusConexao.sucesso
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusConexao.sucesso ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{statusConexao.mensagem}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={testarConexao}
            disabled={testando}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testando ? 'animate-spin' : ''}`} />
            <span>{testando ? 'Testando...' : 'Testar Conexão LAN'}</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-800/50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              Salvar e Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
