import React, { useState, useEffect } from 'react';
import { KeyRound, Sparkles, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { enterpriseApi } from '../../services/enterpriseApi.js';

interface OnboardingModeStepProps {
  onChaveValidada: (dados: any, chave: string) => void;
  onContaCriada: (chave: string, dados: any) => void;
  onPularParaManual: () => void;
}

export const OnboardingModeStep: React.FC<OnboardingModeStepProps> = ({
  onChaveValidada,
  onContaCriada,
  onPularParaManual,
}) => {
  const [modo, setModo] = useState<'ESCOLHA' | 'CHAVE' | 'ASSINAR'>('ESCOLHA');
  const [chave, setChave] = useState('');
  const [validandoChave, setValidandoChave] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [planos, setPlanos] = useState<any[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState('varejo');
  const [ramoAtuacao, setRamoAtuacao] = useState('mercado');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    if (modo === 'ASSINAR' && planos.length === 0) {
      enterpriseApi.obterPlanosPublicos()
        .then((res) => {
          if (res?.planos?.length) setPlanos(res.planos);
        });
    }
  }, [modo]);

  const handleValidarChave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chave.trim()) {
      setErro('Informe sua Chave de Ativação.');
      return;
    }
    setValidandoChave(true);
    setErro(null);
    try {
      const res = await enterpriseApi.validarChaveLicencaNuvem(chave.trim());
      if (res?.valida && res.tenant) {
        onChaveValidada(res.tenant, chave.trim());
      } else {
        setErro(res?.erro || 'Chave de licença inválida ou expirada no servidor.');
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao comunicar com a nuvem ClickStorm.');
    } finally {
      setValidandoChave(false);
    }
  };

  const handleRegistrarStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha ao menos seu E-mail e crie uma Senha.');
      return;
    }
    setRegistrando(true);
    setErro(null);
    try {
      const res = await enterpriseApi.registrarSelfService({
        email: email.trim(),
        telefone: telefone.trim(),
        senha: senha.trim(),
        planoSlug: planoSelecionado,
        nomeLoja: nomeLoja.trim(),
        ramoAtuacao,
      });

      if (res?.sucesso && res.chaveLicenca) {
        if (res.checkoutUrl) {
          if (typeof window !== 'undefined' && (window as any).desktopBridge?.openExternal) {
            (window as any).desktopBridge.openExternal(res.checkoutUrl);
          } else if (typeof window !== 'undefined') {
            window.open(res.checkoutUrl, '_blank');
          }
        }
        onContaCriada(res.chaveLicenca, {
          email,
          telefone,
          nomeLoja: nomeLoja || 'Nova Loja',
          adminSenha: senha,
          ramo_atuacao: ramoAtuacao,
        });
      } else {
        setErro(res?.erro || 'Falha ao registrar conta no servidor.');
      }
    } catch (err: any) {
      setErro(err?.message || 'Erro ao processar assinatura.');
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <div className="space-y-4">
      {erro && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium animate-shake">
          {erro}
        </div>
      )}

      {modo === 'ESCOLHA' && (
        <div className="space-y-4 py-2">
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold text-white">Como deseja iniciar seu ClickStorm ERP?</h3>
            <p className="text-xs text-slate-400">Escolha uma opção para provisionar sua loja automaticamente.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setModo('CHAVE'); setErro(null); }}
              className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition flex flex-col justify-between group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Já tenho uma Chave de Ativação</div>
                <div className="text-[11px] text-slate-400 mt-1">Conecta à sua nuvem e preenche os dados da empresa.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setModo('ASSINAR'); setErro(null); }}
              className="p-3.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-left transition flex flex-col justify-between group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300">Criar Nova Conta / Assinar</div>
                <div className="text-[11px] text-slate-400 mt-1">Escolha seu plano SaaS e ative em modo teste.</div>
              </div>
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onPularParaManual}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Continuar com Configuração Manual / Modo Offline
            </button>
          </div>
        </div>
      )}

      {modo === 'CHAVE' && (
        <form onSubmit={handleValidarChave} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Validar Chave de Ativação Nuvem</span>
            </div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white">Voltar</button>
          </div>
          <p className="text-[11px] text-slate-400">Insira a chave fornecida no seu painel ou enviada pelo suporte comercial.</p>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Chave de Licença (Token) *</label>
            <input
              type="text"
              required
              autoFocus
              value={chave}
              onChange={(e) => setChave(e.target.value.toUpperCase())}
              placeholder="Ex: CS-2026-XXXX ou CS-TRIAL-XXXX"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-wider uppercase outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onPularParaManual} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Configurar Offline</button>
            <button
              type="submit"
              disabled={validandoChave}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {validandoChave ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{validandoChave ? 'Verificando...' : 'Ativar e Carregar Dados'}</span>
            </button>
          </div>
        </form>
      )}

      {modo === 'ASSINAR' && (
        <form onSubmit={handleRegistrarStripe} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Assinatura SaaS • Selecione seu Plano</span>
            </div>
            <button type="button" onClick={() => setModo('ESCOLHA')} className="text-xs text-slate-400 hover:text-white">Voltar</button>
          </div>

          {/* Cards de Planos */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { slug: 'varejo', nome: 'Varejo Express', preco: 'R$ 99,90/mês', desc: '1 Caixa PDV + NFC-e' },
              { slug: 'restaurante', nome: 'Restaurantes', preco: 'R$ 169,90/mês', desc: 'Mesas, Comandas & KDS' },
              { slug: 'premium', nome: 'Enterprise', preco: 'R$ 249,90/mês', desc: 'Multi-caixas em Rede' },
            ].map((p) => (
              <div
                key={p.slug}
                onClick={() => setPlanoSelecionado(p.slug)}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  planoSelecionado === p.slug
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-bold truncate">{p.nome}</div>
                <div className="text-xs font-black text-cyan-400 mt-0.5">{p.preco}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-tight">{p.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="col-span-2">
              <label className="block text-[10px] text-amber-400 mb-0.5 font-bold">Ramo de Atuação do Estabelecimento *</label>
              <select value={ramoAtuacao} onChange={(e) => setRamoAtuacao(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none">
                <option value="mercado">🛒 Supermercado / Mercearia / Varejo</option>
                <option value="restaurante">🍽️ Restaurante / Bar / Cafeteria</option>
                <option value="acougue">🥩 Açougue / Peixaria / Balança</option>
                <option value="autopecas">🚗 Autopeças / Motopeças</option>
                <option value="assistencia">🔧 Assistência Técnica / OS</option>
                <option value="roupas">👕 Vestuário / Roupas / Calçados</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-400 mb-0.5">Nome Fantasia / Nome da Loja</label>
              <input type="text" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} placeholder="Ex: Mercado Central" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">E-mail Comercial *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@loja.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">WhatsApp / Telefone *</label>
              <input type="text" required value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs font-mono outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-400 mb-0.5">Senha do Administrador *</label>
              <input type="password" required minLength={4} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 4 caracteres ou dígitos" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs outline-none" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={onPularParaManual} className="text-[11px] text-slate-400 hover:text-white">Pular para Offline</button>
            <button
              type="submit"
              disabled={registrando}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
            >
              {registrando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{registrando ? 'Criando Conta...' : 'Assinar & Abrir Checkout'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
