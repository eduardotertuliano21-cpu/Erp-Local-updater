import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, KeyRound, Sparkles, CheckCircle2, CreditCard, AlertTriangle, Clock } from 'lucide-react';
import { licencaApi, type LicencaStatusDTO } from '../../services/licencaApi.js';
import { SubscriptionPaymentModal } from '../subscription/SubscriptionPaymentModal.js';
import { normalizeBusinessMode } from '../../context/BusinessModeContext.js';

interface LockScreenProps {
  children: React.ReactNode;
}

export const LockScreen: React.FC<LockScreenProps> = ({ children }) => {
  const [licenca, setLicenca] = useState<LicencaStatusDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [senhaMestre, setSenhaMestre] = useState<string>('');
  const [chaveAtivacao, setChaveAtivacao] = useState<string>('');
  const [showAtivacaoModal, setShowAtivacaoModal] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [erroOverride, setErroOverride] = useState<string | null>(null);

  const checarLicenca = useCallback(async () => {
    const res = await licencaApi.obterStatus();
    if (res.success && res.data) {
      setLicenca(res.data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('clickstorm:config-sync', { detail: { moduloNfe: res.data.moduloNfe } }));
      }
      if (res.data.ramo_atuacao) {
        const atual = normalizeBusinessMode(localStorage.getItem('clickstorm_business_mode'));
        const novo = normalizeBusinessMode(res.data.ramo_atuacao);
        if (novo !== atual) {
          localStorage.setItem('clickstorm_business_mode', novo);
          try {
            const { api } = await import('../../services/api.js');
            await api.switchTenant(novo);
          } catch {}
          window.location.reload();
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checarLicenca();
    const interval = setInterval(checarLicenca, 10 * 1000);
    return () => clearInterval(interval);
  }, [checarLicenca]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'F12' || e.code === 'F12')) {
        e.preventDefault();
        setShowOverrideModal(true);
        setErroOverride(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExecutarOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroOverride(null);
    const res = await licencaApi.emergencyOverride(senhaMestre);
    if (res.success && res.data) {
      setLicenca(res.data.novoStatus);
      setShowOverrideModal(false);
      setSenhaMestre('');
      setMensagemSucesso(`✓ Carência ativada! +${res.data.diasAdicionados} dias offline liberados.`);
      setTimeout(() => setMensagemSucesso(null), 5000);
    } else {
      setErroOverride(res.error || 'Senha mestre inválida');
    }
  };

  const handleAtivarChave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await licencaApi.ativar(chaveAtivacao);
    if (res.success && res.data) {
      setLicenca(res.data.novoStatus);
      setShowAtivacaoModal(false);
      setChaveAtivacao('');
      setMensagemSucesso('✓ Licença ativada com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 5000);
    } else {
      setErroOverride(res.error || 'Chave inválida');
    }
  };

  if (loading) return <>{children}</>;

  const isTrialAtivo = Boolean(licenca && (licenca.status === 'TESTE' || licenca.isTrial) && licenca.diasRestantes > 0);
  const bloqueado = Boolean(
    licenca && (!licenca.valida || licenca.status === 'BLOQUEADA' || licenca.status === 'VENCIDA' || (!isTrialAtivo && licenca.diasRestantes <= 0 && licenca.status === 'TESTE'))
  );

  return (
    <>
      {mensagemSucesso && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-emerald-600 border border-emerald-400 text-white font-black text-xs rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {bloqueado ? (
        <div className="fixed inset-0 z-[9998] bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="w-full max-w-lg bg-slate-900 border border-rose-900/60 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto shadow-xl">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {licenca?.fraudeDetectada ? 'BLOQUEIO DE SEGURANÇA' : licenca?.status === 'TESTE' ? 'PERÍODO DE TESTE ENCERRADO' : 'ACESSO BLOQUEADO'}
              </h1>
              <p className="text-xs text-rose-400 font-mono mt-1 uppercase tracking-wider font-bold">
                {licenca?.fraudeDetectada ? 'Tentativa de alteração do relógio do sistema' : licenca?.status === 'TESTE' ? '7 Dias de Avaliação Concluídos' : 'Inadimplência / Licença Expirada'}
              </p>
            </div>

            {licenca?.fraudeDetectada ? (
              <p className="text-xs text-slate-300">
                O relógio deste computador foi atrasado em relação ao último registro do sistema. Para continuar, acerte a data e a hora do Windows.
              </p>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-400"><span>Empresa:</span><span className="text-white font-bold">{licenca?.razaoSocial || 'Loja Local'}</span></div>
                <div className="flex justify-between text-slate-400"><span>CNPJ:</span><span className="text-slate-300">{licenca?.cnpj || '00.000.000/0001-91'}</span></div>
                <div className="flex justify-between text-slate-400"><span>Vencimento do Plano:</span><span className="text-rose-400 font-bold">{licenca?.dataVencimento}</span></div>
                <div className="flex justify-between text-slate-400"><span>Status Licença:</span><span className="text-amber-400 font-bold">{licenca?.status}</span></div>
              </div>
            )}

            {/* Aviso de Bloqueio Imediato com Suporte */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="font-bold">⚠️ Regularize sua Assinatura para Liberar o Caixa</div>
              <p className="text-[11px] text-slate-300">
                Pagando com Pix ou Cartão, a liberação ocorre de forma automática e imediata em segundo plano.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-2xl text-xs shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar Assinatura com Pix ou Cartão</span>
              </button>

              <button
                onClick={() => setShowAtivacaoModal(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Inserir Chave de Licença Anual</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Banner do Período de Teste Grátis (7 Dias) */}
          {isTrialAtivo && (
            <div
              onClick={() => setShowPaymentModal(true)}
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:brightness-110 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer transition shadow-lg z-40 select-none border-b border-indigo-400/30"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                <span>⏳ Faltam {licenca?.diasTrialRestantes || licenca?.diasRestantes} dias de teste. Assine para não perder acesso.</span>
              </div>
              <span className="px-2.5 py-1 bg-white text-indigo-950 rounded-lg font-black text-[10px] uppercase shadow tracking-wider shrink-0 hover:scale-105 transition-transform">
                ASSINAR AGORA
              </span>
            </div>
          )}

          {/* Banner de Aviso de Vencimento Normal */}
          {!isTrialAtivo && licenca && licenca.diasRestantes <= 5 && (
            <div
              onClick={() => setShowPaymentModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between cursor-pointer transition shadow-md z-40 select-none"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-slate-950 animate-bounce shrink-0" />
                <span>Aviso de Licença: Sua assinatura vence em {licenca.diasRestantes} dia(s) ({licenca.dataVencimento}). Clique aqui para renovar.</span>
              </div>
              <span className="px-2 py-0.5 bg-slate-950 text-white rounded font-mono text-[10px] font-black uppercase shrink-0">RENOVAR AGORA</span>
            </div>
          )}

          {licenca?.alertaRelogio && (
            <div className="bg-sky-950 border-b border-sky-800 text-sky-200 px-4 py-1 text-[11px] font-mono flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{licenca.alertaRelogio}</span>
            </div>
          )}
          {children}
        </>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-black text-white">EMERGENCY OVERRIDE</h3>
            </div>
            <p className="text-xs text-slate-300">Digite a senha mestre para injetar <strong>+5 dias de carência offline</strong>.</p>
            <form onSubmit={handleExecutarOverride} className="space-y-3">
              <input
                type="password"
                autoFocus
                placeholder="Senha mestre de emergência..."
                value={senhaMestre}
                onChange={(e) => setSenhaMestre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              {erroOverride && <div className="text-xs text-rose-400 font-bold">{erroOverride}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowOverrideModal(false)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400">Injetar +5 Dias</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAtivacaoModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-indigo-400"><KeyRound className="w-5 h-5" /><h3 className="text-sm font-black text-white">Ativar Licença</h3></div>
            <form onSubmit={handleAtivarChave} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Insira a chave (ex: CS-PRO-...)"
                value={chaveAtivacao}
                onChange={(e) => setChaveAtivacao(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAtivacaoModal(false)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-500">Ativar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SubscriptionPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={() => { setShowPaymentModal(false); checarLicenca(); }}
      />
    </>
  );
};
