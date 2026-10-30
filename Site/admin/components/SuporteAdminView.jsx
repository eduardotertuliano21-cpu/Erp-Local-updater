import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

const STATUS_BADGES = {
  ABERTO: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  EM_ANDAMENTO: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  RESPONDIDO: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  RESOLVIDO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  FECHADO: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const STATUS_LABELS = {
  ABERTO: '🔴 Aberto (Aguardando)',
  EM_ANDAMENTO: '🟡 Em Atendimento',
  RESPONDIDO: '💬 Respondido',
  RESOLVIDO: '🟢 Resolvido',
  FECHADO: '⚪ Arquivado / Fechado',
};

const PRIORIDADE_BADGES = {
  NORMAL: 'bg-slate-800 text-slate-300 border-slate-700',
  ALTA: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  URGENTE: 'bg-rose-600/25 text-rose-300 border-rose-500/50 animate-pulse',
};

export function SuporteAdminView({ onUpdateBadge }) {
  const [chamados, setChamados] = useState([]);
  const [resumo, setResumo] = useState({
    total: 0,
    abertos: 0,
    emAndamento: 0,
    respondidos: 0,
    resolvidos: 0,
    suporteCount: 0,
    sugestoesCount: 0,
    naoLidosAdmin: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState(null);
  const [textoResposta, setTextoResposta] = useState('');
  const [statusAoResponder, setStatusAoResponder] = useState('RESPONDIDO');
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const carregarChamados = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const res = await api.getSuporteChamados(filtroTipo, filtroStatus, busca);
      if (res && res.success) {
        setChamados(res.data || []);
        if (res.resumo) {
          setResumo(res.resumo);
          if (onUpdateBadge) {
            onUpdateBadge(res.resumo.abertos + res.resumo.naoLidosAdmin);
          }
        }
        setSelecionado((atual) => {
          if (!atual) return null;
          const atualizado = (res.data || []).find((c) => c.id === atual.id);
          return atualizado || atual;
        });
      }
    } catch (err) {
      console.error('Erro ao buscar chamados de suporte:', err);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [filtroTipo, filtroStatus, busca, onUpdateBadge]);

  useEffect(() => {
    carregarChamados();
    const timer = setInterval(() => carregarChamados(true), 8000);
    return () => clearInterval(timer);
  }, [carregarChamados]);

  const selecionarChamado = async (item) => {
    setSelecionado(item);
    setStatusAoResponder(item.status === 'RESOLVIDO' ? 'RESOLVIDO' : 'RESPONDIDO');
    if (!item.lidoPeloAdmin) {
      try {
        const res = await api.atualizarStatusChamadoSuporte(item.id, { lidoPeloAdmin: true });
        if (res && res.success) {
          setSelecionado(res.data);
          carregarChamados(true);
        }
      } catch {}
    }
  };

  const handleResponder = async (e) => {
    e.preventDefault();
    if (!selecionado || !textoResposta.trim()) return;
    setEnviando(true);
    try {
      const savedUser = JSON.parse(localStorage.getItem('cs_master_user') || '{}');
      const autorNome = savedUser?.nome || 'Suporte ClickStorm';
      const res = await api.responderChamadoSuporte(
        selecionado.id,
        textoResposta.trim(),
        autorNome,
        statusAoResponder
      );
      if (res && res.success) {
        setTextoResposta('');
        setSelecionado(res.data);
        setFeedback('✓ Resposta enviada! O cliente já pode visualizar dentro do sistema.');
        setTimeout(() => setFeedback(null), 4000);
        carregarChamados(true);
      }
    } catch (err) {
      alert('Erro ao enviar resposta.');
    } finally {
      setEnviando(false);
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      const res = await api.atualizarStatusChamadoSuporte(id, { status: novoStatus });
      if (res && res.success) {
        if (selecionado && selecionado.id === id) setSelecionado(res.data);
        setFeedback(`✓ Status alterado para ${STATUS_LABELS[novoStatus] || novoStatus}`);
        setTimeout(() => setFeedback(null), 3000);
        carregarChamados(true);
      }
    } catch {}
  };

  const handleExcluir = async (item) => {
    if (!window.confirm(`Deseja realmente APAGAR o registro ${item.protocolo} da loja "${item.nomeLoja}"?`)) {
      return;
    }
    try {
      const res = await api.deletarChamadoSuporte(item.id);
      if (res && res.success) {
        if (selecionado && selecionado.id === item.id) {
          setSelecionado(null);
        }
        setFeedback(`🗑️ Registro ${item.protocolo} apagado com sucesso.`);
        setTimeout(() => setFeedback(null), 3000);
        carregarChamados(true);
      }
    } catch {}
  };

  const formatarData = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatarLinkWhatsapp = (contato, nomePessoa, nomeLoja, protocolo) => {
    const digitos = String(contato || '').replace(/\D/g, '');
    if (digitos.length < 10) return null;
    const fone = digitos.startsWith('55') ? digitos : `55${digitos}`;
    const msg = encodeURIComponent(
      `Olá ${nomePessoa} (${nomeLoja}), aqui é do Suporte ClickStorm referente ao chamado ${protocolo}.`
    );
    return `https://wa.me/${fone}?text=${msg}`;
  };

  return (
    <div className="space-y-5">
      {/* Notificação Flutuante */}
      {feedback && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-xl border border-emerald-400">
          {feedback}
        </div>
      )}

      {/* Cabeçalho e Resumo Rápido */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <span>🎧 Central de Atendimento & Feedback</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Suporte Técnico (Incidentes) & Sugestões das Lojas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie chamados abertos dentro do sistema pelos clientes, veja qual loja e operador enviou, altere status e responda direto para a tela do ERP do lojista.
          </p>
        </div>

        <button
          type="button"
          onClick={() => carregarChamados()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer self-start lg:self-center shrink-0"
        >
          🔄 Atualizar Agora
        </button>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => { setFiltroTipo('TODOS'); setFiltroStatus('ABERTO'); }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-500/60 transition cursor-pointer"
        >
          <div className="text-[11px] font-bold text-rose-400 uppercase">Abertos / Pendentes</div>
          <div className="text-2xl font-black text-white mt-1">{resumo.abertos}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Aguardando sua resposta</div>
        </div>

        <div
          onClick={() => { setFiltroTipo('TODOS'); setFiltroStatus('EM_ANDAMENTO'); }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 transition cursor-pointer"
        >
          <div className="text-[11px] font-bold text-amber-400 uppercase">Em Atendimento</div>
          <div className="text-2xl font-black text-white mt-1">{resumo.emAndamento}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sendo analisados</div>
        </div>

        <div
          onClick={() => { setFiltroTipo('TODOS'); setFiltroStatus('RESPONDIDO'); }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/60 transition cursor-pointer"
        >
          <div className="text-[11px] font-bold text-cyan-400 uppercase">Respondidos</div>
          <div className="text-2xl font-black text-white mt-1">{resumo.respondidos}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mensagem enviada à loja</div>
        </div>

        <div
          onClick={() => { setFiltroTipo('SUGESTAO'); setFiltroStatus('TODOS'); }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/60 transition cursor-pointer"
        >
          <div className="text-[11px] font-bold text-purple-400 uppercase">💡 Sugestões</div>
          <div className="text-2xl font-black text-white mt-1">{resumo.sugestoesCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ideias enviadas por clientes</div>
        </div>

        <div
          onClick={() => { setFiltroTipo('TODOS'); setFiltroStatus('RESOLVIDO'); }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 transition cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="text-[11px] font-bold text-emerald-400 uppercase">Concluídos</div>
          <div className="text-2xl font-black text-white mt-1">{resumo.resolvidos}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Casos solucionados</div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'TODOS', label: `Todos (${resumo.total})` },
            { id: 'SUPORTE', label: `🛠️ Suporte / Incidentes (${resumo.suporteCount})` },
            { id: 'SUGESTAO', label: `💡 Sugestões (${resumo.sugestoesCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroTipo(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                filtroTipo === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold outline-none focus:border-cyan-500"
          >
            <option value="TODOS">Status: Todos</option>
            <option value="ABERTO">🔴 Apenas Abertos</option>
            <option value="EM_ANDAMENTO">🟡 Em Atendimento</option>
            <option value="RESPONDIDO">💬 Respondidos</option>
            <option value="RESOLVIDO">🟢 Resolvidos</option>
            <option value="FECHADO">⚪ Fechados</option>
          </select>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar loja, CNPJ, pessoa, contato ou protocolo..."
            className="w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Layout Mestre-Detalhe: Lista à esquerda + Conversa e Gerenciamento à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda: Lista de Chamados e Sugestões */}
        <div className="lg:col-span-5 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              Carregando chamados e sugestões...
            </div>
          ) : chamados.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <div className="text-2xl">📭</div>
              <div className="text-sm font-bold text-slate-200">
                Nenhum chamado ou sugestão encontrado neste filtro
              </div>
              <p className="text-xs text-slate-500">
                Assim que qualquer loja enviar um incidente ou sugestão pelo botão flutuante do sistema, ele aparecerá aqui instantaneamente.
              </p>
            </div>
          ) : (
            chamados.map((item) => {
              const ativo = selecionado && selecionado.id === item.id;
              const isSugestao = item.tipo === 'SUGESTAO';
              return (
                <div
                  key={item.id}
                  onClick={() => selecionarChamado(item)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                    ativo
                      ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/20 shadow-lg'
                      : !item.lidoPeloAdmin
                      ? 'bg-slate-900/95 border-rose-500/50 hover:border-rose-400'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Topo do Card: Protocolo + Tipo + Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-cyan-400">
                        {item.protocolo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isSugestao
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {isSugestao ? '💡 SUGESTÃO' : '🛠️ SUPORTE'}
                      </span>
                      {!isSugestao && item.prioridade && item.prioridade !== 'NORMAL' && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            PRIORIDADE_BADGES[item.prioridade] || ''
                          }`}
                        >
                          {item.prioridade}
                        </span>
                      )}
                      {!item.lidoPeloAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white uppercase">
                          NOVO
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        STATUS_BADGES[item.status] || STATUS_BADGES.ABERTO
                      }`}
                    >
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </div>

                  {/* Identificação da Loja e Solicitante */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white truncate">
                        🏪 {item.nomeLoja}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {item.cnpjLoja}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                      <span>
                        👤 <strong>{item.solicitanteNome}</strong>
                        {item.solicitanteCargo ? ` (${item.solicitanteCargo})` : ''}
                      </span>
                      <span className="text-emerald-400 font-mono font-semibold">
                        📞 {item.solicitanteContato}
                      </span>
                    </div>
                  </div>

                  {/* Assunto e Prévia */}
                  <div>
                    <div className="text-xs font-extrabold text-slate-100 line-clamp-1">
                      {item.assunto}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                      {item.descricao}
                    </p>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/70">
                    <span>Aberto em: {formatarData(item.criadoEm)}</span>
                    <div className="flex items-center gap-2">
                      <span>💬 {item.mensagens?.length || 1} msg(s)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcluir(item);
                        }}
                        className="text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
                        title="Excluir este registro"
                      >
                        🗑️ Apagar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Coluna Direita: Detalhes Completos, Mudança de Status e Resposta Direta */}
        <div className="lg:col-span-7">
          {!selecionado ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-10 text-center space-y-3">
              <div className="text-3xl">👈</div>
              <h3 className="text-base font-black text-white">
                Selecione um Chamado ou Sugestão ao lado
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Clique em qualquer item da lista para ver os dados completos da loja, quem abriu, o telefone/contato e enviar uma resposta direto para a tela do sistema do cliente.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col">
              {/* Cabeçalho do Chamado Selecionado */}
              <div className="p-5 bg-slate-950/70 border-b border-slate-800 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-cyan-400">
                        Protocolo {selecionado.protocolo}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          selecionado.tipo === 'SUGESTAO'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {selecionado.tipo === 'SUGESTAO' ? '💡 Sugestão de Melhoria' : '🛠️ Chamado de Suporte (Incidente)'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                          STATUS_BADGES[selecionado.status] || STATUS_BADGES.ABERTO
                        }`}
                      >
                        {STATUS_LABELS[selecionado.status] || selecionado.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white leading-snug pt-1">
                      {selecionado.assunto}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExcluir(selecionado)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-extrabold transition cursor-pointer"
                  >
                    🗑️ Apagar Chamado
                  </button>
                </div>

                {/* Quadro Completo de Identificação da Loja e da Pessoa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Dados da Loja que Abriu
                    </div>
                    <div className="font-black text-white text-sm">
                      🏪 {selecionado.nomeLoja}
                    </div>
                    <div className="text-slate-300 font-mono">
                      CNPJ: <strong className="text-slate-100">{selecionado.cnpjLoja}</strong>
                    </div>
                    <div className="text-slate-400">
                      Licença: <span className="font-mono text-cyan-400">{selecionado.chaveLicenca}</span> • Ramo:{' '}
                      <span className="uppercase font-bold text-slate-200">{selecionado.ramoLoja || 'mercado'}</span>
                    </div>
                  </div>

                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Pessoa que Abriu & Contato
                    </div>
                    <div className="font-black text-white text-sm">
                      👤 {selecionado.solicitanteNome}
                      {selecionado.solicitanteCargo && (
                        <span className="ml-1.5 text-[11px] font-semibold text-slate-400">
                          ({selecionado.solicitanteCargo})
                        </span>
                      )}
                    </div>
                    <div className="text-emerald-400 font-mono font-bold">
                      📞 Contato: {selecionado.solicitanteContato}
                    </div>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {formatarLinkWhatsapp(
                        selecionado.solicitanteContato,
                        selecionado.solicitanteNome,
                        selecionado.nomeLoja,
                        selecionado.protocolo
                      ) && (
                        <a
                          href={formatarLinkWhatsapp(
                            selecionado.solicitanteContato,
                            selecionado.solicitanteNome,
                            selecionado.nomeLoja,
                            selecionado.protocolo
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition"
                        >
                          <span>📲 Chamar no WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões Rápidos de Mudança de Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Mudar Status:</span>
                    {['ABERTO', 'EM_ANDAMENTO', 'RESPONDIDO', 'RESOLVIDO', 'FECHADO'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleMudarStatus(selecionado.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          selecionado.status === st
                            ? STATUS_BADGES[st]
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Histórico de Mensagens (Conversa Loja <-> Admin) */}
              <div className="p-5 space-y-3 max-h-[360px] overflow-y-auto bg-slate-950/40">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Histórico de Mensagens (Visível dentro do ERP da Loja)
                </div>

                {(selecionado.mensagens || []).map((msg) => {
                  const isAdmin = msg.autor === 'ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 space-y-1 border ${
                          isAdmin
                            ? 'bg-cyan-500/15 border-cyan-500/30 text-slate-100'
                            : 'bg-slate-800/90 border-slate-700 text-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px]">
                          <span className={`font-extrabold ${isAdmin ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {isAdmin ? `🛡️ ${msg.autorNome} (Admin)` : `🏪 ${msg.autorNome} (${selecionado.nomeLoja})`}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {formatarData(msg.criadoEm)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.texto}
                        </p>
                        {isAdmin && (
                          <div className="text-[10px] text-right text-slate-400 pt-0.5">
                            {msg.lidoPelaLoja ? '✓✓ Visualizado pela loja no sistema' : '✓ Enviado (Aguardando leitura na loja)'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulário para Responder Direto para o Sistema da Loja */}
              <form onSubmit={handleResponder} className="p-5 bg-slate-900 border-t border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-extrabold text-cyan-400">
                    ✉️ Responder para {selecionado.solicitanteNome} ({selecionado.nomeLoja})
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Ao enviar, marcar como:</span>
                    <select
                      value={statusAoResponder}
                      onChange={(e) => setStatusAoResponder(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                    >
                      <option value="RESPONDIDO">💬 Respondido</option>
                      <option value="EM_ANDAMENTO">🟡 Em Atendimento</option>
                      <option value="RESOLVIDO">🟢 Resolvido</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={textoResposta}
                  onChange={(e) => setTextoResposta(e.target.value)}
                  placeholder="Digite sua resposta ou orientação... O cliente receberá um aviso e lerá esta mensagem dentro do sistema ClickStorm dele."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 p-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none resize-y"
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={enviando || !textoResposta.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    {enviando ? 'Enviando...' : '🚀 Enviar Resposta para o Sistema da Loja'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
