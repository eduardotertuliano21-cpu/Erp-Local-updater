import React, { useState, useEffect } from 'react';
import { KeyRound, Sparkles, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { enterpriseApi } from '../../services/enterpriseApi.js';

interface OnboardingModeStepProps {
  onChaveValidada: (dados: any, chave: string) => void;
  onContaCriada: (chave: string, dados: any) => void;
  onPularParaManual: () => void;
}

const PLANOS_PADRAO = [
  { slug: 'mensal', nome: 'Plano Mensal', valorMensal: 130, periodicidade: 'MENSAL', descricao: 'Incluso até 3 máquinas (+ R$ 25.00/máq extra)', moduloNfe: true },
  { slug: 'anual', nome: 'Plano Anual', valorMensal: 1300, periodicidade: 'ANUAL', descricao: 'Incluso até 3 máquinas (+ R$ 25.00/máq extra)', moduloNfe: true },
];

export const OnboardingModeStep: React.FC<OnboardingModeStepProps> = ({
  onChaveValidada, onContaCriada, onPularParaManual,
}) => {
  const [modo, setModo] = useState<'ESCOLHA' | 'CHAVE' | 'ASSINAR'>('ESCOLHA');
  const [chave, setChave] = useState('');
  const [validandoChave, setValidandoChave] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [planos, setPlanos] = useState<any[]>(PLANOS_PADRAO);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState('mensal');
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTAO'>('PIX');
  const [diasTrial, setDiasTrial] = useState(7);
  const [email, setEmail] = useState('');
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    setCarregandoPlanos(true);
    enterpriseApi.obterPlanosPublicos()
      .then((res) => {
        if (!ativo) return;
        if (res?.diasTrial) setDiasTrial(Number(res.diasTrial));
        if (!res?.planos?.length) return;
        setPlanos(res.planos);
        setPlanoSelecionado((prev) => res.planos.some((p: any) => (p.slug || p.id) === prev) ? prev : (res.planos[0].slug || res.planos[0].id));
      })
      .catch(() => {})
      .finally(() => { if (ativo) setCarregandoPlanos(false); });
    return () => { ativo = false; };
  }, []);

  const formatarPreco = (p: any) => {
    const v = p.valorMensal ?? p.preco ?? 0;
    const isAnual = (p.periodicidade || '').toUpperCase() === 'ANUAL' || p.slug === 'anual';
    return `R$ ${Number(v).toFixed(2).replace('.', ',')}/${isAnual ? 'ano' : 'mês'}`;
  };

  const handleValidarChave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chave.trim()) return setErro('Informe sua Chave de Ativação.');
    setValidandoChave(true);
    setErro(null);
    try {
      const res = await enterpriseApi.validarChaveLicencaNuvem(chave.trim());
      if (res?.valida && res.tenant) onChaveValidada(res.tenant, chave.trim());
      else setErro(res?.erro || 'Chave de licença inválida ou expirada no servidor.');
    } catch (err: any) {
      setErro(err?.message || 'Erro ao comunicar com a nuvem ClickStorm.');
    } finally { setValidandoChave(false); }
  };

  const handleRegistrarStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return setErro('Informe um E-mail Comercial válido.');
    setRegistrando(true);
    setErro(null);
    try {
      const res = await enterpriseApi.registrarSelfService({
        email: email.trim(),
        planoSlug: planoSelecionado,
        metodoPagamento,
      });
      if (res?.sucesso && res.chaveLicenca) {
        if (metodoPagamento === 'CARTAO' && res.checkoutUrl) {
          const b = typeof window !== 'undefined' && (window as any).desktopBridge;
          if (b?.openExternal) b.openExternal(res.checkoutUrl);
          else if (typeof window !== 'undefined') window.open(res.checkoutUrl, '_blank');
        }
        const planoEscolhido = planos.find((p) => (p.slug || p.id) === planoSelecionado);
        const moduloNfeAtivo = res.tenant?.moduloNfe !== undefined ? Boolean(res.tenant.moduloNfe) : Boolean(planoEscolhido?.moduloNfe);
        onContaCriada(res.chaveLicenca, { email: email.trim(), moduloNfe: moduloNfeAtivo, planoSlug: planoSelecionado });
      } else {
        setErro(res?.erro || 'Falha ao registrar conta no servidor.');
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao processar assinatura.');
    } finally { setRegistrando(false); }
  };

  return (
    <div className="space-y-4">
      {erro && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium animate-shake">{erro}</div>}

      {modo === 'ESCOLHA' && (
        <div className="space-y-4 py-2">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-white">Como deseja iniciar seu ClickStorm ERP?</h3>
            <p className="text-xs text-slate-400">Escolha uma opção para provisionar sua loja automaticamente.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={() => { setModo('CHAVE'); setErro(null); }} className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition flex flex-col justify-between group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition"><KeyRound className="w-4 h-4" /></div>
              <div><div className="text-xs font-bold text-white group-hover:text-cyan-300">Já tenho uma Chave de Ativação</div><div className="text-[11px] text-slate-400 mt-1">Conecta à sua nuvem e preenche os dados da empresa.</div></div>
            </button>
            <button type="button" onClick={() => { setModo('ASSINAR'); setErro(null); }} className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-left transition flex flex-col justify-between group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition"><Sparkles className="w-4 h-4" /></div>
              <div><div className="text-xs font-bold text-white group-hover:text-blue-300">Criar Nova Conta / Assinar</div><div className="text-[11px] text-slate-400 mt-1">Escolha seu plano SaaS e inicie o período de teste.</div></div>
            </button>
          </div>
          <div className="text-center pt-2">
            <button type="button" onClick={onPularParaManual} className="text-xs text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer">Continuar com Configuração Manual / Modo Offline</button>
          </div>
        </div>
      )}

      {modo === 'CHAVE' && (
        <form onSubmit={handleValidarChave} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs"><KeyRound className="w-4 h-4 text-cyan-400" /><span>Validar Chave de Ativação Nuvem</span></div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white cursor-pointer">Voltar</button>
          </div>
          <p className="text-[11px] text-slate-400">Insira a chave fornecida no seu painel ou enviada pelo suporte comercial.</p>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Chave de Licença (Token) *</label>
            <input type="text" required autoFocus value={chave} onChange={(e) => setChave(e.target.value.toUpperCase())} placeholder="Ex: CS-2026-XXXX ou CS-TRIAL-XXXX" className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-wider uppercase outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onPularParaManual} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">Configurar Offline</button>
            <button type="submit" disabled={validandoChave} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              {validandoChave ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{validandoChave ? 'Verificando...' : 'Ativar e Carregar Dados'}</span>
            </button>
          </div>
        </form>
      )}

      {modo === 'ASSINAR' && (
        <form onSubmit={handleRegistrarStripe} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs"><Sparkles className="w-4 h-4 text-blue-400" /><span>Assinatura SaaS • Selecione seu Plano</span></div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white cursor-pointer">Voltar</button>
          </div>

          <div className="px-3 py-1.5 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs text-blue-200">
            <span>🎁 <strong>{diasTrial} Dias Grátis</strong> para novos clientes sem compromisso</span>
            <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 font-bold uppercase">Avaliação</span>
          </div>

          {carregandoPlanos && planos.length === 0 ? (
            <div className="flex items-center justify-center p-4 text-xs text-slate-400 gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /><span>Carregando planos do portal...</span></div>
          ) : (
            <div className={`grid gap-2 ${planos.length === 2 ? 'grid-cols-2' : planos.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {planos.map((p) => {
                const chavePlano = p.slug || p.id;
                const isSelected = planoSelecionado === chavePlano;
                return (
                  <div key={chavePlano} onClick={() => setPlanoSelecionado(chavePlano)} className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    <div>
                      <div className="flex items-center justify-center gap-1.5 truncate">
                        <span className="text-[11px] font-bold text-white truncate">{p.nome}</span>
                        {p.moduloNfe && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-bold">NF-e</span>}
                      </div>
                      <div className="text-xs font-black text-cyan-400 mt-0.5">{formatarPreco(p)}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">{p.descricao || (p.recursos && p.recursos[0]) || 'PDV Frente de Caixa'}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">E-mail Comercial para Ativação da Conta *</label>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@loja.com" className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white text-xs outline-none" />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-300">Método de Pagamento para Assinatura:</div>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${metodoPagamento === 'PIX' ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'border-slate-800 text-slate-400'}`}>
                  <input type="radio" name="metodoPagamento" checked={metodoPagamento === 'PIX'} onChange={() => setMetodoPagamento('PIX')} className="text-emerald-500" />
                  <div className="text-[11px] font-bold">⚡ Pix (Após Teste)</div>
                </label>
                <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${metodoPagamento === 'CARTAO' ? 'bg-blue-950/40 border-blue-500/50 text-white' : 'border-slate-800 text-slate-400'}`}>
                  <input type="radio" name="metodoPagamento" checked={metodoPagamento === 'CARTAO'} onChange={() => setMetodoPagamento('CARTAO')} className="text-blue-500" />
                  <div className="text-[11px] font-bold">💳 Cartão (Stripe)</div>
                </label>
              </div>
              <div className="text-[10px] text-slate-400">
                {metodoPagamento === 'PIX'
                  ? `Inicie imediatamente com ${diasTrial} dias grátis! Ao expirar, a renovação é feita via Pix no sistema.`
                  : 'Cobrança do plano no cartão via Stripe com renovação mensal recorrente.'}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={onPularParaManual} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">Pular para Offline</button>
            <button type="submit" disabled={registrando} className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20">
              {registrando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{registrando ? 'Ativando Licença...' : metodoPagamento === 'PIX' ? `Iniciar ${diasTrial} Dias Grátis` : 'Assinar com Cartão'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
