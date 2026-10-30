import React, { useState, useEffect } from 'react';
import { KeyRound, Sparkles, Loader2, ExternalLink, ShieldCheck, Server, Lock } from 'lucide-react';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { api, setApiBaseUrl } from '../../services/api.js';

interface OnboardingModeStepProps {
  onChaveValidada: (dados: any, chave: string, senhaPin?: string, jaConfigurado?: boolean) => void;
  onContaCriada: (chave: string, dados: any) => void;
  onServidorLanConectado: (masterConfig: any, masterIp: string) => void;
  onPularParaManual: () => void;
}

const PLANOS_PADRAO = [
  { slug: 'mensal', nome: 'Plano Mensal', valorMensal: 130, periodicidade: 'MENSAL', descricao: 'Incluso até 3 máquinas (+ R$ 25.00/máq extra)', moduloNfe: true },
  { slug: 'anual', nome: 'Plano Anual', valorMensal: 1300, periodicidade: 'ANUAL', descricao: 'Incluso até 3 máquinas (+ R$ 25.00/máq extra)', moduloNfe: true },
];

export const OnboardingModeStep: React.FC<OnboardingModeStepProps> = ({
  onChaveValidada, onContaCriada, onServidorLanConectado, onPularParaManual,
}) => {
  const [modo, setModo] = useState<'ESCOLHA' | 'CHAVE' | 'ASSINAR' | 'SERVIDOR_LAN'>('ESCOLHA');
  const [chave, setChave] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [validandoChave, setValidandoChave] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [planos, setPlanos] = useState<any[]>(PLANOS_PADRAO);
  const [carregandoPlanos, setCarregandoPlanos] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState('mensal');
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTAO'>('PIX');
  const [diasTrial, setDiasTrial] = useState(7);
  const [email, setEmail] = useState('');
  const [senhaNovaConta, setSenhaNovaConta] = useState('1234');
  const [registrando, setRegistrando] = useState(false);
  const [ipServidor, setIpServidor] = useState('');
  const [conectandoLan, setConectandoLan] = useState(false);

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
    if (!chave.trim()) return setErro('Informe sua Chave de Licença.');
    if (!senhaLogin.trim()) return setErro('Informe sua Senha de Primeiro Login.');
    setValidandoChave(true);
    setErro(null);
    try {
      const res = await enterpriseApi.validarChaveLicencaNuvem(chave.trim(), senhaLogin.trim());
      if (res?.valida && res.tenant) {
        onChaveValidada(
          res.tenant,
          chave.trim(),
          senhaLogin.trim(),
          Boolean(res.jaConfigurado || res.tenant?.jaConfigurado)
        );
      } else {
        setErro(res?.erro || 'Chave de licença ou senha de primeiro login inválida.');
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao comunicar com a nuvem ClickStorm.');
    } finally { setValidandoChave(false); }
  };

  const handleConectarServidorLan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = ipServidor.trim().replace(/^https?:\/\//, '').split(':')[0];
    if (!cleanIp) return setErro('Informe o IP do computador Servidor na rede.');
    setConectandoLan(true);
    setErro(null);
    try {
      const res = await api.conectarMasterManual(cleanIp, 5000);
      const masterCfg = (res.data as any)?.masterConfig;
      if (res.success && masterCfg) {
        setApiBaseUrl(`http://${cleanIp}:5000/api`);
        localStorage.setItem('clickstorm_network_role', 'TERMINAL');
        onServidorLanConectado(masterCfg, cleanIp);
      } else {
        setErro('Não foi possível puxar as configurações do servidor neste IP. Verifique se o ERP está aberto no Servidor.');
      }
    } catch (err: any) {
      setErro(err?.message || 'Falha ao conectar no servidor da rede.');
    } finally { setConectandoLan(false); }
  };

  const handleRegistrarStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return setErro('Informe um E-mail Comercial válido.');
    if (senhaNovaConta.trim().length < 4) return setErro('Defina uma senha de 4 dígitos para o primeiro login.');
    setRegistrando(true);
    setErro(null);
    try {
      const res = await enterpriseApi.registrarSelfService({
        email: email.trim(),
        senha: senhaNovaConta.trim().slice(0, 4),
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
        onContaCriada(res.chaveLicenca, { email: email.trim(), senhaPrimeiroAcesso: senhaNovaConta.trim().slice(0, 4), moduloNfe: moduloNfeAtivo, planoSlug: planoSelecionado });
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
        <div className="space-y-3 py-1">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-white">Como deseja iniciar seu ClickStorm ERP?</h3>
            <p className="text-xs text-slate-400">Escolha uma opção para provisionar sua loja ou puxar dados de um servidor existente.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={() => { setModo('CHAVE'); setErro(null); }} className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition flex flex-col justify-between group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition"><KeyRound className="w-4 h-4" /></div>
              <div><div className="text-xs font-bold text-white group-hover:text-cyan-300">Chave de Licença + Senha</div><div className="text-[11px] text-slate-400 mt-1">Conecta com sua Chave e Senha. Se já tiver servidor configurado, puxa tudo automático!</div></div>
            </button>
            <button type="button" onClick={() => { setModo('ASSINAR'); setErro(null); }} className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-left transition flex flex-col justify-between group cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition"><Sparkles className="w-4 h-4" /></div>
              <div><div className="text-xs font-bold text-white group-hover:text-blue-300">Criar Nova Conta / Assinar</div><div className="text-[11px] text-slate-400 mt-1">Escolha seu plano SaaS, defina sua senha e inicie o teste.</div></div>
            </button>
          </div>
          <button type="button" onClick={() => { setModo('SERVIDOR_LAN'); setErro(null); }} className="w-full p-3 bg-emerald-950/25 hover:bg-emerald-900/30 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl text-left transition flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition"><Server className="w-4 h-4" /></div>
            <div>
              <div className="text-xs font-bold text-emerald-300">Já tenho Servidor Instalado na Rede (Adicionar Novo Caixa)</div>
              <div className="text-[11px] text-slate-400">Puxa todas as configurações do servidor automaticamente e pede apenas o Número do Caixa.</div>
            </div>
          </button>
          <div className="text-center pt-1">
            <button type="button" onClick={onPularParaManual} className="text-xs text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer">Continuar com Configuração Manual / Modo Offline</button>
          </div>
        </div>
      )}

      {modo === 'CHAVE' && (
        <form onSubmit={handleValidarChave} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs"><KeyRound className="w-4 h-4 text-cyan-400" /><span>Primeiro Login • Chave de Licença e Senha</span></div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white cursor-pointer">Voltar</button>
          </div>
          <p className="text-[11px] text-slate-400">Insira sua Chave de Licença e a Senha de Primeiro Login. Se sua loja já tiver um servidor configurado, o sistema puxará todas as configurações automaticamente.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Chave de Licença *</label>
              <input type="text" required autoFocus value={chave} onChange={(e) => setChave(e.target.value.toUpperCase())} placeholder="Ex: CS-2026-XXXX" className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-wider uppercase outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Senha (PIN) *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-2.5" />
                <input type="password" required maxLength={6} value={senhaLogin} onChange={(e) => setSenhaLogin(e.target.value)} placeholder="Ex: 1234" className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2 text-amber-300 text-xs font-mono tracking-widest outline-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onPularParaManual} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">Configurar Offline</button>
            <button type="submit" disabled={validandoChave} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              {validandoChave ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{validandoChave ? 'Validando...' : 'Entrar e Sincronizar'}</span>
            </button>
          </div>
        </form>
      )}

      {modo === 'SERVIDOR_LAN' && (
        <form onSubmit={handleConectarServidorLan} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs"><Server className="w-4 h-4 text-emerald-400" /><span>Puxar Configurações do Servidor Local</span></div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white cursor-pointer">Voltar</button>
          </div>
          <p className="text-[11px] text-slate-400">Informe o endereço IP do computador Servidor onde o sistema já está instalado. Todas as configurações serão copiadas e você escolherá apenas o Número do Caixa.</p>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Endereço IP do Servidor Principal *</label>
            <input type="text" required autoFocus value={ipServidor} onChange={(e) => setIpServidor(e.target.value)} placeholder="Ex: 192.168.1.100" className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-white text-xs font-mono outline-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" disabled={conectandoLan} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              {conectandoLan ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              <span>{conectandoLan ? 'Puxando Configurações...' : 'Puxar Configurações do Servidor'}</span>
            </button>
          </div>
        </form>
      )}

      {modo === 'ASSINAR' && (
        <form onSubmit={handleRegistrarStripe} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs"><Sparkles className="w-4 h-4 text-blue-400" /><span>Assinatura SaaS • Selecione seu Plano</span></div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white cursor-pointer">Voltar</button>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs text-blue-200">
            <span>🎁 <strong>{diasTrial} Dias Grátis</strong> para novos clientes sem compromisso</span>
            <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 font-bold uppercase">Avaliação</span>
          </div>
          {carregandoPlanos && planos.length === 0 ? (
            <div className="flex items-center justify-center p-4 text-xs text-slate-400 gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /><span>Carregando planos...</span></div>
          ) : (
            <div className={`grid gap-2 ${planos.length === 2 ? 'grid-cols-2' : planos.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {planos.map((p) => {
                const chavePlano = p.slug || p.id;
                const isSelected = planoSelecionado === chavePlano;
                return (
                  <div key={chavePlano} onClick={() => setPlanoSelecionado(chavePlano)} className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    <div>
                      <div className="flex items-center justify-center gap-1 truncate">
                        <span className="text-[11px] font-bold text-white truncate">{p.nome}</span>
                        {p.moduloNfe && <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded font-bold">NF-e</span>}
                      </div>
                      <div className="text-xs font-black text-cyan-400 mt-0.5">{formatarPreco(p)}</div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-1">{p.descricao || 'PDV Frente de Caixa'}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-300 mb-1">E-mail Comercial *</label>
              <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@loja.com" className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-white text-xs outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Senha (4 dígitos) *</label>
              <input type="text" required maxLength={4} value={senhaNovaConta} onChange={(e) => setSenhaNovaConta(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-amber-300 font-mono text-xs outline-none" />
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition ${metodoPagamento === 'PIX' ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'border-slate-800 text-slate-400'}`}>
                <input type="radio" name="metodoPagamento" checked={metodoPagamento === 'PIX'} onChange={() => setMetodoPagamento('PIX')} />
                <div className="text-[11px] font-bold">⚡ Pix (Após Teste)</div>
              </label>
              <label className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition ${metodoPagamento === 'CARTAO' ? 'bg-blue-950/40 border-blue-500/50 text-white' : 'border-slate-800 text-slate-400'}`}>
                <input type="radio" name="metodoPagamento" checked={metodoPagamento === 'CARTAO'} onChange={() => setMetodoPagamento('CARTAO')} />
                <div className="text-[11px] font-bold">💳 Cartão (Stripe)</div>
              </label>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <button type="button" onClick={onPularParaManual} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">Pular para Offline</button>
            <button type="submit" disabled={registrando} className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              {registrando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{registrando ? 'Ativando...' : metodoPagamento === 'PIX' ? `Iniciar ${diasTrial} Dias Grátis` : 'Assinar com Cartão'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
