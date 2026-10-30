import React, { useState, useEffect, useCallback } from 'react';
import {
  Headset,
  Lightbulb,
  Wrench,
  MessageSquareText,
  X,
  Send,
  CheckCircle2,
  ArrowLeft,
  BellRing,
  Store,
  User,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';

interface MensagemChamado {
  id: string;
  autor: 'LOJA' | 'ADMIN';
  autorNome: string;
  texto: string;
  criadoEm: string;
  lidoPelaLoja?: boolean;
}

interface ChamadoSuporte {
  id: string;
  protocolo: string;
  tipo: 'SUPORTE' | 'SUGESTAO';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESPONDIDO' | 'RESOLVIDO' | 'FECHADO';
  prioridade: 'NORMAL' | 'ALTA' | 'URGENTE';
  nomeLoja: string;
  cnpjLoja: string;
  solicitanteNome: string;
  solicitanteContato: string;
  assunto: string;
  descricao: string;
  mensagens: MensagemChamado[];
  temRespostaNaoLidaLoja?: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

const STATUS_BADGE: Record<string, { label: string; classe: string }> = {
  ABERTO: {
    label: 'Aberto • Aguardando Suporte',
    classe: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  EM_ANDAMENTO: {
    label: 'Em Atendimento pela Equipe',
    classe: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  RESPONDIDO: {
    label: 'Respondido • Veja a Mensagem!',
    classe: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  RESOLVIDO: {
    label: 'Resolvido / Concluído',
    classe: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  FECHADO: {
    label: 'Encerrado',
    classe: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  },
};

export const FloatingSupportButton: React.FC = () => {
  const { usuario } = useAuth();
  const { config } = useTheme();

  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState<'ESCOLHA' | 'SUPORTE' | 'SUGESTAO' | 'HISTORICO' | 'CONVERSA'>('ESCOLHA');
  const [chamados, setChamados] = useState<ChamadoSuporte[]>([]);
  const [naoLidos, setNaoLidos] = useState(0);
  const [chamadoAtivo, setChamadoAtivo] = useState<ChamadoSuporte | null>(null);
  const [alertaNovaResposta, setAlertaNovaResposta] = useState<ChamadoSuporte | null>(null);

  // Campos do formulário de Suporte (Incidente)
  const [nomeSolicitante, setNomeSolicitante] = useState('');
  const [contatoSolicitante, setContatoSolicitante] = useState('');
  const [assuntoIncidente, setAssuntoIncidente] = useState('');
  const [prioridadeIncidente, setPrioridadeIncidente] = useState<'NORMAL' | 'ALTA' | 'URGENTE'>('NORMAL');
  const [descricaoIncidente, setDescricaoIncidente] = useState('');

  // Campo único de Sugestão
  const [textoSugestao, setTextoSugestao] = useState('');

  // Campo de réplica dentro de um chamado existente
  const [novaReplica, setNovaReplica] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // Preenche automaticamente nome e contato padrão da loja/usuário
  useEffect(() => {
    const salvoNome = localStorage.getItem('cs_suporte_nome') || '';
    const salvoContato = localStorage.getItem('cs_suporte_contato') || '';
    const telConfig = (config as any)?.telefone || '';
    setNomeSolicitante(usuario?.nome || salvoNome || '');
    setContatoSolicitante(salvoContato || telConfig || '');
  }, [usuario?.nome, config]);

  const CLOUD_URL = 'https://clickstormsystems.com.br/api/suporte/loja';

  const obterDadosLojaContexto = useCallback(() => {
    const cfgAny = (config as any) || {};
    return {
      nomeLoja: cfgAny.nome_loja || cfgAny.razao_social || 'Loja ClickStorm',
      cnpjLoja: cfgAny.cnpj || 'Não informado',
      ramoLoja: cfgAny.ramo_atuacao || localStorage.getItem('clickstorm_business_mode') || 'mercado',
      chaveLicenca: cfgAny.chave_licenca || 'CS-PRO-LOCAL-LICENSE',
      telefoneLoja: cfgAny.telefone || '',
    };
  }, [config]);

  const carregarChamados = useCallback(async () => {
    try {
      let json: any = null;
      try {
        const res = await fetch('/api/suporte/chamados');
        if (res.ok) json = await res.json();
      } catch {}

      if (!json || !json.success) {
        const ctx = obterDadosLojaContexto();
        const params = new URLSearchParams({
          chaveLicenca: ctx.chaveLicenca,
          cnpj: ctx.cnpjLoja,
          nomeLoja: ctx.nomeLoja,
        });
        const resCloud = await fetch(`${CLOUD_URL}/listar?${params.toString()}`);
        if (resCloud.ok) json = await resCloud.json();
      }

      if (json && json.success && Array.isArray(json.data)) {
        const lista: ChamadoSuporte[] = json.data;
        setChamados(lista);
        const qtdNaoLidos = lista.filter((c) => c.temRespostaNaoLidaLoja).length;
        setNaoLidos(qtdNaoLidos);
        if (json.lojaInfo?.telefone) {
          setContatoSolicitante((prev) => prev || json.lojaInfo.telefone);
        }

        // Atualiza chamado aberto em tela se estiver visualizando a conversa
        setChamadoAtivo((atual) => {
          if (!atual) return null;
          return lista.find((c) => c.id === atual.id) || atual;
        });

        // Se chegou resposta nova e o modal está fechado, mostra aviso discreto
        const primeiroNaoLido = lista.find((c) => c.temRespostaNaoLidaLoja);
        if (primeiroNaoLido && !aberto) {
          setAlertaNovaResposta(primeiroNaoLido);
        }
      }
    } catch {
      // Silencioso em background
    }
  }, [aberto, obterDadosLojaContexto]);

  useEffect(() => {
    carregarChamados();
    const timer = setInterval(carregarChamados, 10000);
    return () => clearInterval(timer);
  }, [carregarChamados]);

  const abrirConversa = async (chamado: ChamadoSuporte) => {
    setChamadoAtivo(chamado);
    setEtapa('CONVERSA');
    setAlertaNovaResposta(null);
    if (chamado.temRespostaNaoLidaLoja) {
      try {
        const r = await fetch(`/api/suporte/chamados/${chamado.id}/lido`, { method: 'POST' });
        if (!r.ok) {
          await fetch(`${CLOUD_URL}/${chamado.id}/marcar-lido`, { method: 'POST' });
        }
        carregarChamados();
      } catch {
        try {
          await fetch(`${CLOUD_URL}/${chamado.id}/marcar-lido`, { method: 'POST' });
          carregarChamados();
        } catch {}
      }
    }
  };

  const enviarChamadoOuSugestao = async (payload: any) => {
    const ctx = obterDadosLojaContexto();
    const bodyCompleto = {
      ...ctx,
      ...payload,
    };
    try {
      const res = await fetch('/api/suporte/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyCompleto),
      });
      if (res.ok) {
        const j = await res.json();
        if (j && j.success) return j;
      }
    } catch {}

    const resCloud = await fetch(`${CLOUD_URL}/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyCompleto),
    });
    return resCloud.json();
  };

  const handleEnviarSuporte = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg(null);
    if (!nomeSolicitante.trim()) {
      setErroMsg('Informe seu nome para sabermos com quem falar.');
      return;
    }
    if (!contatoSolicitante.trim()) {
      setErroMsg('Informe um telefone/WhatsApp de contato.');
      return;
    }
    if (!descricaoIncidente.trim()) {
      setErroMsg('Descreva o problema (incidente) que está acontecendo.');
      return;
    }

    setEnviando(true);
    try {
      localStorage.setItem('cs_suporte_nome', nomeSolicitante.trim());
      localStorage.setItem('cs_suporte_contato', contatoSolicitante.trim());

      const json = await enviarChamadoOuSugestao({
        tipo: 'SUPORTE',
        prioridade: prioridadeIncidente,
        solicitanteNome: nomeSolicitante.trim(),
        solicitanteContato: contatoSolicitante.trim(),
        solicitanteCargo: usuario?.hierarquia || 'Operador',
        assunto: assuntoIncidente.trim() || `Incidente: ${descricaoIncidente.trim().slice(0, 45)}`,
        descricao: descricaoIncidente.trim(),
      });
      if (json && json.success) {
        setAssuntoIncidente('');
        setDescricaoIncidente('');
        setSucessoMsg(`Chamado ${json.data?.protocolo || ''} enviado! Você receberá a resposta aqui mesmo no sistema.`);
        await carregarChamados();
        setTimeout(() => {
          setSucessoMsg(null);
          if (json.data) abrirConversa(json.data);
          else setEtapa('HISTORICO');
        }, 1800);
      } else {
        setErroMsg(json?.error || 'Não foi possível enviar o chamado.');
      }
    } catch {
      setErroMsg('Erro de comunicação ao registrar o chamado.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarSugestao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg(null);
    if (!textoSugestao.trim()) {
      setErroMsg('Escreva sua sugestão no campo abaixo antes de enviar.');
      return;
    }

    setEnviando(true);
    try {
      const nomeEnvio =
        usuario?.nome ||
        nomeSolicitante.trim() ||
        localStorage.getItem('cs_suporte_nome') ||
        'Cliente da Loja';
      const contatoEnvio =
        contatoSolicitante.trim() ||
        localStorage.getItem('cs_suporte_contato') ||
        (config as any)?.telefone ||
        'Contato da Loja';

      const json = await enviarChamadoOuSugestao({
        tipo: 'SUGESTAO',
        prioridade: 'NORMAL',
        solicitanteNome: nomeEnvio,
        solicitanteContato: contatoEnvio,
        solicitanteCargo: usuario?.hierarquia || 'Operador',
        assunto: `Sugestão: ${textoSugestao.trim().slice(0, 50)}`,
        descricao: textoSugestao.trim(),
      });
      if (json && json.success) {
        setTextoSugestao('');
        setSucessoMsg('Muito obrigado! Sua sugestão foi enviada diretamente para nossa equipe.');
        await carregarChamados();
        setTimeout(() => {
          setSucessoMsg(null);
          setEtapa('ESCOLHA');
        }, 2000);
      } else {
        setErroMsg(json?.error || 'Não foi possível enviar a sugestão.');
      }
    } catch {
      setErroMsg('Erro ao enviar sugestão.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarReplica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamadoAtivo || !novaReplica.trim()) return;
    setEnviando(true);
    try {
      const payload = {
        texto: novaReplica.trim(),
        autorNome: usuario?.nome || nomeSolicitante || chamadoAtivo.solicitanteNome,
      };
      let json: any = null;
      try {
        const res = await fetch(`/api/suporte/chamados/${chamadoAtivo.id}/mensagem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) json = await res.json();
      } catch {}

      if (!json || !json.success) {
        const resCloud = await fetch(`${CLOUD_URL}/${chamadoAtivo.id}/mensagem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        json = await resCloud.json();
      }

      if (json && json.success) {
        setNovaReplica('');
        setChamadoAtivo(json.data);
        carregarChamados();
      }
    } catch {} finally {
      setEnviando(false);
    }
  };

  const formatarHora = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      {/* Alerta Flutuante quando o Admin responde um chamado */}
      {alertaNovaResposta && !aberto && (
        <div
          onClick={() => {
            setAberto(true);
            abrirConversa(alertaNovaResposta);
          }}
          className="fixed bottom-28 right-4 z-[9990] max-w-xs bg-slate-900 border-2 border-emerald-500 text-white p-3.5 rounded-2xl shadow-2xl cursor-pointer animate-bounce space-y-1"
        >
          <div className="flex items-center justify-between gap-2 text-xs font-black text-emerald-400">
            <span className="flex items-center gap-1.5">
              <BellRing className="w-4 h-4" />
              <span>Nova Resposta do Suporte!</span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAlertaNovaResposta(null);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-200 line-clamp-2">
            Chamado <strong>{alertaNovaResposta.protocolo}</strong> ({alertaNovaResposta.assunto}) foi respondido. Clique para ler!
          </p>
        </div>
      )}

      {/* BOTÃO FLUTUANTE SEMPRE VISÍVEL NO SISTEMA */}
      <button
        type="button"
        onClick={() => {
          setAberto((prev) => !prev);
          setErroMsg(null);
          setSucessoMsg(null);
          if (!aberto && naoLidos > 0) {
            const primeiro = chamados.find((c) => c.temRespostaNaoLidaLoja);
            if (primeiro) {
              abrirConversa(primeiro);
              return;
            }
          }
        }}
        title="Abrir Suporte Técnico ou Enviar Sugestão"
        className="fixed bottom-14 right-4 z-[9990] flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-sky-500/25 border border-sky-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
      >
        <Headset className="w-4 h-4 shrink-0" />
        <span>Suporte</span>
        {naoLidos > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
            {naoLidos}
          </span>
        )}
      </button>

      {/* MODAL / PAINEL DO SUPORTE & SUGESTÕES */}
      {aberto && (
        <div
          className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:justify-end p-2 sm:p-6"
          onClick={() => setAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh]"
          >
            {/* Cabeçalho */}
            <div className="p-4 sm:px-5 bg-gradient-to-r from-slate-900 via-[#0f1d36] to-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {etapa !== 'ESCOLHA' && (
                  <button
                    type="button"
                    onClick={() => {
                      setErroMsg(null);
                      setSucessoMsg(null);
                      setEtapa(etapa === 'CONVERSA' ? 'HISTORICO' : 'ESCOLHA');
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer shrink-0"
                    title="Voltar"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white truncate flex items-center gap-1.5">
                    <Headset className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      {etapa === 'ESCOLHA' && 'Central de Suporte & Sugestões'}
                      {etapa === 'SUPORTE' && 'Abrir Chamado de Suporte'}
                      {etapa === 'SUGESTAO' && 'Enviar Sugestão de Melhoria'}
                      {etapa === 'HISTORICO' && 'Meus Chamados & Respostas'}
                      {etapa === 'CONVERSA' && `Chamado ${chamadoAtivo?.protocolo || ''}`}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    🏪 {config?.nome_loja || 'Minha Loja'} {usuario?.nome ? `• 👤 ${usuario.nome}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAberto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Painel */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              {sucessoMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{sucessoMsg}</span>
                </div>
              )}

              {erroMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-300 text-xs font-bold">
                  ⚠️ {erroMsg}
                </div>
              )}

              {/* ETAPA 1: ESCOLHER ENTRE SUPORTE OU SUGESTÃO */}
              {etapa === 'ESCOLHA' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Como podemos ajudar sua loja hoje? Escolha uma opção abaixo:
                  </p>

                  {/* Opção 1: Abrir Chamado de Suporte (Incidente) */}
                  <button
                    type="button"
                    onClick={() => setEtapa('SUPORTE')}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 text-left flex items-start gap-3.5 transition group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-sky-400 transition">
                        🛠️ Preciso de Suporte (Abrir Chamado)
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Relate um problema, erro ou dúvida. Nossa equipe receberá na hora e responderá aqui mesmo dentro do seu sistema.
                      </p>
                    </div>
                  </button>

                  {/* Opção 2: Enviar Sugestão */}
                  <button
                    type="button"
                    onClick={() => setEtapa('SUGESTAO')}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-left flex items-start gap-3.5 transition group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-400 transition">
                        💡 Enviar uma Sugestão
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Tem uma ideia de função nova ou melhoria para o sistema? Escreva diretamente para nós em um único campo.
                      </p>
                    </div>
                  </button>

                  {/* Opção 3: Ver Meus Chamados e Respostas do Admin */}
                  <button
                    type="button"
                    onClick={() => setEtapa('HISTORICO')}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-left flex items-center justify-between gap-3 transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <MessageSquareText className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-400 transition">
                          💬 Meus Chamados & Respostas ({chamados.length})
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Acompanhe o andamento e leia as respostas do suporte.
                        </p>
                      </div>
                    </div>

                    {naoLidos > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0 animate-pulse">
                        {naoLidos} nova(s)
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* ETAPA 2: FORMULÁRIO BÁSICO DE CHAMADO DE SUPORTE (INCIDENTE) */}
              {etapa === 'SUPORTE' && (
                <form onSubmit={handleEnviarSuporte} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Store className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      Loja identificada: <strong>{config?.nome_loja || 'Minha Loja'}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        Seu Nome *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={nomeSolicitante}
                          onChange={(e) => setNomeSolicitante(e.target.value)}
                          placeholder="Ex: João / Maria"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        Seu WhatsApp / Telefone *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={contatoSolicitante}
                          onChange={(e) => setContatoSolicitante(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        Resumo do Problema (Assunto)
                      </label>
                      <input
                        type="text"
                        value={assuntoIncidente}
                        onChange={(e) => setAssuntoIncidente(e.target.value)}
                        placeholder="Ex: Impressora, Nota Fiscal, Balança..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                        Urgência
                      </label>
                      <select
                        value={prioridadeIncidente}
                        onChange={(e) => setPrioridadeIncidente(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold outline-none focus:border-sky-500"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="ALTA">Alta</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Descreva o Problema (Incidente) *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={descricaoIncidente}
                      onChange={(e) => setDescricaoIncidente(e.target.value)}
                      placeholder="Conte com suas palavras o que aconteceu ou qual dúvida você está tendo..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500 resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enviando ? 'Enviando Chamado...' : 'Abrir Chamado de Suporte'}</span>
                  </button>
                </form>
              )}

              {/* ETAPA 3: SUGESTÃO (APENAS UM CAMPO SIMPLES PARA ESCREVER A SUGESTÃO) */}
              {etapa === 'SUGESTAO' && (
                <form onSubmit={handleEnviarSugestao} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">
                      💡 Qual é a sua sugestão para melhorarmos o sistema?
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Basta escrever abaixo e enviar. Sua loja e seu usuário são identificados automaticamente.
                    </p>
                  </div>

                  <textarea
                    rows={5}
                    autoFocus
                    required
                    value={textoSugestao}
                    onChange={(e) => setTextoSugestao(e.target.value)}
                    placeholder="Escreva aqui sua ideia ou sugestão de melhoria..."
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 resize-y"
                  />

                  <button
                    type="submit"
                    disabled={enviando || !textoSugestao.trim()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enviando ? 'Enviando...' : 'Enviar Sugestão'}</span>
                  </button>
                </form>
              )}

              {/* ETAPA 4: LISTA DE CHAMADOS ABERTOS PELA LOJA E RESPOSTAS */}
              {etapa === 'HISTORICO' && (
                <div className="space-y-2.5">
                  {chamados.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <MessageSquareText className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Você ainda não abriu nenhum chamado ou sugestão.
                      </div>
                    </div>
                  ) : (
                    chamados.map((c) => {
                      const st = STATUS_BADGE[c.status] || STATUS_BADGE.ABERTO;
                      return (
                        <div
                          key={c.id}
                          onClick={() => abrirConversa(c)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                            c.temRespostaNaoLidaLoja
                              ? 'bg-emerald-500/10 border-emerald-500/50'
                              : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-black text-sky-500">
                              {c.protocolo} • {c.tipo === 'SUGESTAO' ? '💡 Sugestão' : '🛠️ Suporte'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${st.classe}`}>
                              {st.label}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                            {c.assunto}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{formatarHora(c.atualizadoEm || c.criadoEm)}</span>
                            <span className="font-bold text-sky-400">
                              Abrir mensagens ({c.mensagens?.length || 1}) →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ETAPA 5: CONVERSA E RESPOSTAS DO ADMIN DENTRO DO SISTEMA */}
              {etapa === 'CONVERSA' && chamadoAtivo && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-sky-400 font-mono">
                        Protocolo {chamadoAtivo.protocolo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          (STATUS_BADGE[chamadoAtivo.status] || STATUS_BADGE.ABERTO).classe
                        }`}
                      >
                        {(STATUS_BADGE[chamadoAtivo.status] || STATUS_BADGE.ABERTO).label}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {chamadoAtivo.assunto}
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                    {(chamadoAtivo.mensagens || []).map((msg) => {
                      const isAdmin = msg.autor === 'ADMIN';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[90%] rounded-2xl p-3 space-y-1 border ${
                              isAdmin
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-slate-900 dark:text-white'
                                : 'bg-sky-500/15 border-sky-500/30 text-slate-900 dark:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px]">
                              <span
                                className={`font-extrabold ${
                                  isAdmin
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-sky-600 dark:text-sky-400'
                                }`}
                              >
                                {isAdmin ? `🛡️ ${msg.autorNome} (Suporte)` : `👤 ${msg.autorNome} (Você)`}
                              </span>
                              <span className="text-slate-400 font-mono">{formatarHora(msg.criadoEm)}</span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Enviar nova mensagem no chamado */}
                  {chamadoAtivo.status !== 'FECHADO' && (
                    <form onSubmit={handleEnviarReplica} className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                      <input
                        type="text"
                        value={novaReplica}
                        onChange={(e) => setNovaReplica(e.target.value)}
                        placeholder="Escrever nova mensagem neste chamado..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
                      />
                      <button
                        type="submit"
                        disabled={enviando || !novaReplica.trim()}
                        className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-black cursor-pointer shrink-0"
                      >
                        Enviar
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
