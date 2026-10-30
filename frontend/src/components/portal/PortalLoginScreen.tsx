import React, { useState } from 'react';
import {
  ShieldCheck, Server, Key, Lock, ArrowRight, RefreshCw, CheckCircle2,
  AlertCircle, Laptop, Info,
} from 'lucide-react';

interface PortalLoginScreenProps {
  onLoginSuccess: (dados: {
    token: string;
    servidorUrl: string;
    tenant: any;
    usuario: any;
  }) => void;
}

export const PortalLoginScreen: React.FC<PortalLoginScreenProps> = ({ onLoginSuccess }) => {
  const [chaveLicenca, setChaveLicenca] = useState(() => localStorage.getItem('cs_portal_last_key') || '');
  const [senha, setSenha] = useState('');
  const [servidorUrl, setServidorUrl] = useState(() => localStorage.getItem('cs_portal_target_server') || 'http://192.168.3.149:5000');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Status do Teste de Conexão com o Servidor da Loja
  const [testandoPing, setTestandoPing] = useState(false);
  const [pingStatus, setPingStatus] = useState<{
    sucesso?: boolean;
    latenciaMs?: number;
    mensagem?: string;
  } | null>(null);

  const testarConexao = async () => {
    if (!servidorUrl.trim()) {
      setPingStatus({ sucesso: false, mensagem: 'Informe o IP ou endereço do servidor' });
      return;
    }
    setTestandoPing(true);
    setPingStatus(null);
    try {
      const res = await fetch(`/api/portal/ping?servidorUrl=${encodeURIComponent(servidorUrl.trim())}`);
      const data = await res.json();
      if (data && data.success && data.online) {
        setPingStatus({
          sucesso: true,
          latenciaMs: data.latenciaMs,
          mensagem: `Servidor da loja respondeu em ${data.latenciaMs}ms`,
        });
      } else {
        setPingStatus({
          sucesso: false,
          mensagem: data?.error || 'Computador servidor inacessível nesse endereço.',
        });
      }
    } catch (err: any) {
      setPingStatus({
        sucesso: false,
        mensagem: 'Falha ao testar conexão. Verifique se o servidor está ligado.',
      });
    } finally {
      setTestandoPing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const urlAlvo = servidorUrl.trim() || 'http://192.168.3.149:5000';
      localStorage.setItem('cs_portal_last_key', chaveLicenca.trim());
      localStorage.setItem('cs_portal_target_server', urlAlvo);

      const resp = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaveLicenca: chaveLicenca.trim(),
          senha: senha.trim(),
          servidorUrl: urlAlvo,
        }),
      });

      const res = await resp.json();

      if (res && res.success) {
        localStorage.setItem('cs_portal_token', res.token);
        localStorage.setItem('cs_portal_session', JSON.stringify(res.tenant || {}));
        if (res.usuario) {
          localStorage.setItem('clickstorm_usuario', JSON.stringify(res.usuario));
        }
        if (res.tenant?.ramo) {
          localStorage.setItem('clickstorm_business_mode', res.tenant.ramo);
        }
        onLoginSuccess(res);
      } else {
        setErro(res?.error || 'Não foi possível autenticar. Verifique sua chave e senha.');
      }
    } catch (err: any) {
      setErro('Erro de comunicação com o portal. Verifique sua conexão à internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Header Institucional */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-black font-black" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              ClickStorm<span className="text-cyan-400">.</span>
            </span>
            <span className="block text-[10px] tracking-widest uppercase text-slate-400 font-semibold -mt-1">
              Controle Remoto de Loja
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
          >
            ← Voltar ao Site
          </a>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl relative">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-inner">
              <Laptop className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Área do Cliente • ERP Remoto
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Acesse em tempo real os cadastros, produtos, estoque e relatórios do computador servidor da sua loja.
            </p>
          </div>

          {erro && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chave de Licença */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Chave de Licença
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  required
                  value={chaveLicenca}
                  onChange={(e) => setChaveLicenca(e.target.value)}
                  placeholder="Ex: CS-PRO-LOCAL-LICENSE"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-white font-mono text-sm placeholder-slate-600 outline-none transition uppercase"
                />
              </div>
            </div>

            {/* Senha de Administrador */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha de Administrador da Loja
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha de login no sistema"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition"
                />
              </div>
            </div>

            {/* Endereço do Servidor do Cliente */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Endereço do Computador Servidor
                </label>
                <button
                  type="button"
                  onClick={testarConexao}
                  disabled={testandoPing}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${testandoPing ? 'animate-spin' : ''}`} />
                  <span>Testar Conexão</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Server className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  required
                  value={servidorUrl}
                  onChange={(e) => {
                    setServidorUrl(e.target.value);
                    setPingStatus(null);
                  }}
                  placeholder="Ex: http://192.168.3.149:5000"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-white font-mono text-xs placeholder-slate-600 outline-none transition"
                />
              </div>

              {pingStatus && (
                <div
                  className={`mt-2 p-2 rounded-lg text-[11px] font-medium flex items-center gap-2 ${
                    pingStatus.sucesso
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {pingStatus.sucesso ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>{pingStatus.mensagem}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando ao Computador da Loja...</span>
                </>
              ) : (
                <>
                  <span>Conectar ao Sistema da Loja</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Aviso de Privacidade e Segurança */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-start gap-2 text-cyan-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Privacidade Total (Zero Armazenamento Central)</span>
            </div>
            <p className="text-slate-400 text-[10.5px] leading-relaxed">
              O portal web funciona como controle remoto direto da máquina servidora da sua loja. Nenhum produto, venda ou dado financeiro é salvo no servidor central da ClickStorm.
            </p>
            <div className="flex items-center gap-1.5 text-amber-300/90 text-[10.5px] pt-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Emissão de cupom fiscal e fechamento de caixa continuam exclusivos no PDV desktop.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-white/5">
        ClickStorm Systems • Soluções de Alto Desempenho para Varejo
      </footer>
    </div>
  );
};
