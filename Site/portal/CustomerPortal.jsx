import React, { useState, useEffect, useCallback } from 'react';
import {
  portalApi,
  getPortalSession,
  setPortalSession,
  clearPortalSession,
} from './portalApi.js';

export default function CustomerPortal({ onVoltarHome }) {
  const [session, setSession] = useState(() => getPortalSession());
  const [loading, setLoading] = useState(false);
  const [erroLogin, setErroLogin] = useState('');

  // Formulário de Login
  const [chaveLicenca, setChaveLicenca] = useState(() => localStorage.getItem('cs_portal_last_key') || '');
  const [senha, setSenha] = useState('');
  const [servidorUrl, setServidorUrl] = useState(() => localStorage.getItem('cs_portal_last_server') || 'http://localhost:5000');
  const [mostrarConfigAvancada, setMostrarConfigAvancada] = useState(false);

  // Navegação da Área Logada
  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [dadosLoja, setDadosLoja] = useState(null);
  const [statusConexao, setStatusConexao] = useState('VERIFICANDO');
  const [latenciaMs, setLatenciaMs] = useState(null);

  // Estados dos Módulos
  const [dashboard, setDashboard] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [estoque, setEstoque] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [buscaEntidade, setBuscaEntidade] = useState('');
  const [financeiro, setFinanceiro] = useState({ titulos: [], totais: null, dre: null });
  const [relatorios, setRelatorios] = useState({ vendas: [], caixas: [] });
  const [configLoja, setConfigLoja] = useState(null);

  // Modais de Cadastro Rápido
  const [modalNovoProduto, setModalNovoProduto] = useState(false);
  const [formProduto, setFormProduto] = useState({
    descricao: '',
    codigo_barras: '',
    preco_venda: '',
    preco_custo: '',
    estoque_atual: '0',
    unidade_medida: 'UN',
  });
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  // Login no Portal
  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin('');
    setLoading(true);
    try {
      localStorage.setItem('cs_portal_last_key', chaveLicenca.trim());
      localStorage.setItem('cs_portal_last_server', servidorUrl.trim());

      const res = await portalApi.login(chaveLicenca.trim(), senha.trim(), servidorUrl.trim());
      if (res && res.success) {
        const novaSessao = {
          token: res.token,
          servidorUrl: res.servidorUrl || servidorUrl.trim(),
          tenant: res.tenant,
          usuario: res.usuario,
        };
        setPortalSession(novaSessao);
        setSession(novaSessao);
      } else {
        setErroLogin(res?.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setErroLogin('Não foi possível conectar ao servidor. Verifique o endereço e a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearPortalSession();
    setSession(null);
    setDashboard(null);
    setProdutos([]);
  };

  // Carrega e atualiza dados do computador da loja
  const carregarDadosAba = useCallback(async (aba) => {
    if (!session) return;
    const inicio = Date.now();
    try {
      if (aba === 'dashboard') {
        const res = await portalApi.getDashboard();
        if (res && res.success) setDashboard(res.data);
      } else if (aba === 'produtos') {
        const res = await portalApi.getProdutos(buscaProduto);
        if (res && res.success) setProdutos(res.data || []);
      } else if (aba === 'estoque') {
        const res = await portalApi.getEstoquePosicao();
        if (res && res.success) setEstoque(res.data || []);
      } else if (aba === 'entidades') {
        const res = await portalApi.getEntidades('', buscaEntidade);
        if (res && res.success) setEntidades(res.data || []);
      } else if (aba === 'financeiro') {
        const [resTitulos, resTotais, resDre] = await Promise.all([
          portalApi.getFinanceiroTitulos(),
          portalApi.getFinanceiroTotais(),
          portalApi.getFinanceiroDre(),
        ]);
        setFinanceiro({
          titulos: resTitulos?.success ? resTitulos.data || [] : [],
          totais: resTotais?.success ? resTotais.data : null,
          dre: resDre?.success ? resDre.data : null,
        });
      } else if (aba === 'relatorios') {
        const [resVendas, resCaixas] = await Promise.all([
          portalApi.getRelatorioVendas(),
          portalApi.getRelatorioCaixas(),
        ]);
        setRelatorios({
          vendas: resVendas?.success ? resVendas.data || [] : [],
          caixas: resCaixas?.success ? resCaixas.data || [] : [],
        });
      } else if (aba === 'configuracoes') {
        const res = await portalApi.getConfigLoja();
        if (res && res.success) setConfigLoja(res.data);
      }
      setStatusConexao('ONLINE');
      setLatenciaMs(Date.now() - inicio);
    } catch (err) {
      console.warn('Erro ao carregar dados remotos da loja:', err);
      setStatusConexao('OFFLINE');
    }
  }, [session, buscaProduto, buscaEntidade]);

  useEffect(() => {
    if (session) {
      carregarDadosAba(abaAtiva);
    }
  }, [session, abaAtiva, carregarDadosAba]);

  // Salvar Novo Produto na base remota da loja
  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    setSalvandoProduto(true);
    try {
      const res = await portalApi.salvarProduto({
        descricao: formProduto.descricao,
        codigo_barras: formProduto.codigo_barras,
        preco_venda: parseFloat(formProduto.preco_venda) || 0,
        preco_custo: parseFloat(formProduto.preco_custo) || 0,
        estoque_atual: parseFloat(formProduto.estoque_atual) || 0,
        unidade_medida: formProduto.unidade_medida || 'UN',
      });
      if (res && res.success) {
        setModalNovoProduto(false);
        setFormProduto({
          descricao: '',
          codigo_barras: '',
          preco_venda: '',
          preco_custo: '',
          estoque_atual: '0',
          unidade_medida: 'UN',
        });
        carregarDadosAba('produtos');
      } else {
        alert(res?.error || 'Erro ao cadastrar produto na loja.');
      }
    } catch {
      alert('Falha ao comunicar com o computador da loja.');
    } finally {
      setSalvandoProduto(false);
    }
  };

  // Se não estiver logado, exibe tela de login da Área do Cliente
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black">
        {/* Header Superior */}
        <header className="h-20 border-b border-white/5 bg-[#07090e]/85 backdrop-blur-xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <svg className="w-5 h-5 text-black font-black" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-lg text-white">ClickStorm</span>{' '}
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">Portal do Cliente</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onVoltarHome}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 border border-slate-700 hover:border-slate-500 rounded-xl transition cursor-pointer"
          >
            ← Voltar ao Site
          </button>
        </header>

        {/* Card Central de Login */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500" />

            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl mx-auto shadow-inner text-cyan-400">
                🏪
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Acesse a Sua Loja Online</h1>
              <p className="text-xs text-slate-400">
                Consulte relatórios, estoque, produtos e financeiro direto do computador da sua loja.
              </p>
            </div>

            {erroLogin && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                ⚠️ {erroLogin}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chave de Licença da Sua Loja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CS-2026-XXXXXX"
                  value={chaveLicenca}
                  onChange={(e) => setChaveLicenca(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs font-mono text-white placeholder-slate-500 outline-none uppercase transition"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Encontrada no seu cupom de ativação ou no menu de licença do caixa.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Senha de Administrador da Loja *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Sua senha de login no sistema..."
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Opção Avançada de Endereço do Servidor */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setMostrarConfigAvancada((prev) => !prev)}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{mostrarConfigAvancada ? '▼' : '►'} Configuração de Conexão com o Computador Servidor</span>
                </button>

                {mostrarConfigAvancada && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 animate-fade-in">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Endereço IP / URL do Computador Servidor:
                    </label>
                    <input
                      type="text"
                      value={servidorUrl}
                      onChange={(e) => setServidorUrl(e.target.value)}
                      placeholder="http://192.168.3.123:5000 ou http://localhost:5000"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Se estiver na mesma rede Wi-Fi da loja, digite o IP do computador principal (ex: <code>http://192.168.3.123:5000</code>).
                    </p>
                  </div>
                )}
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition transform active:scale-95 cursor-pointer mt-2"
              >
                {loading ? 'Conectando ao Computador da Loja...' : '🚀 Entrar na Minha Loja Remota'}
              </button>
            </form>

            {/* Aviso de Privacidade e Não Armazenamento */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
              <span className="text-emerald-400 text-base shrink-0">🔒</span>
              <p className="leading-relaxed">
                <strong>Privacidade Absoluta:</strong> Nenhuma informação de vendas, produtos ou faturamento da sua loja fica salva nos servidores da ClickStorm. O portal conecta diretamente à base de dados do seu computador local.
              </p>
            </div>
          </div>
        </main>

        {/* Rodapé simples */}
        <footer className="h-12 border-t border-white/5 text-center text-xs text-slate-500 flex items-center justify-center">
          ClickStorm Systems • Portal de Gestão Remota Offline-First
        </footer>
      </div>
    );
  }

  // Se estiver logado, exibe a Área de Gestão Completa espelhada do Servidor
  const tenant = session.tenant || {};
  const usuario = session.usuario || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Barra Superior da Área do Cliente */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-black font-black text-sm shadow-md shadow-cyan-500/20 shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm truncate">
                {tenant.nomeLoja || 'Minha Loja'}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                {tenant.ramo || 'mercado'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              CNPJ: {tenant.cnpj || '00.000.000/0001-91'} • Licença: {tenant.chaveLicenca}
            </span>
          </div>
        </div>

        {/* Status da Conexão Direta com a Loja */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                statusConexao === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="hidden md:inline text-slate-400">Servidor Loja:</span>
            <span className={statusConexao === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
              {statusConexao === 'ONLINE' ? `Online (${latenciaMs || 0}ms)` : 'Desconectado'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="hidden lg:inline text-slate-400">👤 {usuario.nome || 'Lojista'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition text-xs font-bold cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Menu de Abas de Gestão */}
      <nav className="border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6 overflow-x-auto flex items-center gap-1.5 py-2.5 shrink-0 scrollbar-none">
        {[
          { id: 'dashboard', label: '📊 Dashboard & Métricas' },
          { id: 'produtos', label: '📦 Produtos & Catálogo' },
          { id: 'estoque', label: '⚖️ Estoque & Posição' },
          { id: 'entidades', label: '👥 Clientes & Equipe' },
          { id: 'financeiro', label: '💰 Financeiro & DRE' },
          { id: 'relatorios', label: '📑 Relatórios Gerenciais' },
          { id: 'configuracoes', label: '⚙️ Configurações da Empresa' },
          { id: 'pdv_aviso', label: '🛒 Vendas / PDV (Info)' },
        ].map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              abaAtiva === aba.id
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      {/* Conteúdo Principal da Aba Ativa */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {/* ABA 1: DASHBOARD & MÉTRICAS EM TEMPO REAL */}
        {abaAtiva === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Visão Geral da Loja em Tempo Real
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dados sincronizados diretamente da base do computador servidor da sua loja física.
                </p>
              </div>

              <button
                type="button"
                onClick={() => carregarDadosAba('dashboard')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition cursor-pointer self-start sm:self-center"
              >
                🔄 Atualizar Métricas
              </button>
            </div>

            {/* Cards de Métricas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Faturamento de Hoje
                </span>
                <div className="text-2xl font-black text-white">
                  R$ {Number(dashboard?.faturamentoHoje || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">Vendas registradas hoje</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                  Total de Vendas
                </span>
                <div className="text-2xl font-black text-white">
                  {dashboard?.vendasHojeCount || 0}
                </div>
                <div className="text-[11px] text-slate-400">Cupons / pedidos atendidos</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400">
                  Ticket Médio
                </span>
                <div className="text-2xl font-black text-white">
                  R$ {Number(dashboard?.ticketMedio || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">Média por cliente</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
                  Status do Caixa
                </span>
                <div className="text-2xl font-black text-white">
                  {dashboard?.caixaAberto ? '🟢 ABERTO' : '🔴 FECHADO'}
                </div>
                <div className="text-[11px] text-slate-400">Turno na loja física</div>
              </div>
            </div>

            {/* Destaque de Vendas Recentes */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-black text-white flex items-center justify-between">
                <span>Últimas Vendas Realizadas no Caixa da Loja</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  Total acumulado no período: R$ {Number(dashboard?.faturamentoTotal || 0).toFixed(2)}
                </span>
              </h3>

              {dashboard?.ultimasVendas && dashboard.ultimasVendas.length > 0 ? (
                <div className="divide-y divide-slate-800/80">
                  {dashboard.ultimasVendas.slice(0, 6).map((v) => (
                    <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">Venda #{String(v.id).slice(-4)}</div>
                        <div className="text-[11px] text-slate-400">{v.data || 'Hoje'} • {v.forma_pagamento || 'Dinheiro'}</div>
                      </div>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        R$ {Number(v.total_liquido || v.total || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  Nenhuma venda registrada até o momento no caixa físico.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 2: PRODUTOS & CATÁLOGO (CONSULTA E CADASTRO) */}
        {abaAtiva === 'produtos' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  placeholder="Buscar produto por nome ou código..."
                  className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => carregarDadosAba('produtos')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  🔄 Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => setModalNovoProduto(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md transition cursor-pointer"
                >
                  + Novo Produto
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-extrabold uppercase border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-3">Descrição do Produto</th>
                      <th className="p-3">Código EAN</th>
                      <th className="p-3">Preço Venda</th>
                      <th className="p-3">Preço Custo</th>
                      <th className="p-3">Estoque</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {produtos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Nenhum produto encontrado na base da loja.
                        </td>
                      </tr>
                    ) : (
                      produtos.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">{p.descricao}</td>
                          <td className="p-3 font-mono text-slate-400">{p.codigo_barras || '-'}</td>
                          <td className="p-3 font-mono font-black text-emerald-400">
                            R$ {Number(p.preco_venda || 0).toFixed(2)}
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            R$ {Number(p.preco_custo || 0).toFixed(2)}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-200">
                            {p.estoque_atual || 0} {p.unidade_medida || 'UN'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Excluir ${p.descricao}?`)) {
                                  await portalApi.excluirProduto(p.id);
                                  carregarDadosAba('produtos');
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 font-bold text-xs cursor-pointer"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: ESTOQUE & POSIÇÃO */}
        {abaAtiva === 'estoque' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-base font-black text-white">Posição e Saldo de Estoque da Loja</h2>
              <button
                type="button"
                onClick={() => carregarDadosAba('estoque')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                🔄 Atualizar Estoque
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-extrabold uppercase border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Código EAN</th>
                      <th className="p-3">Estoque Atual</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {estoque.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          Nenhum saldo registrado.
                        </td>
                      </tr>
                    ) : (
                      estoque.map((item) => {
                        const qtd = Number(item.estoque_atual || item.saldo || 0);
                        const isBaixo = qtd <= 5;
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-bold text-white">{item.descricao || item.produto_nome}</td>
                            <td className="p-3 font-mono text-slate-400">{item.codigo_barras || '-'}</td>
                            <td className="p-3 font-mono font-black text-white">
                              {qtd} {item.unidade_medida || 'UN'}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  isBaixo
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {isBaixo ? '⚠️ Estoque Baixo' : '✓ Regular'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: CLIENTES & ENTIDADES */}
        {abaAtiva === 'entidades' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <input
                type="text"
                value={buscaEntidade}
                onChange={(e) => setBuscaEntidade(e.target.value)}
                placeholder="Buscar cliente ou fornecedor por nome ou documento..."
                className="w-full sm:w-80 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => carregarDadosAba('entidades')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                🔄 Atualizar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {entidades.length === 0 ? (
                <div className="col-span-full p-8 text-center text-xs text-slate-500">
                  Nenhum cliente ou fornecedor cadastrado na loja.
                </div>
              ) : (
                entidades.map((ent) => (
                  <div key={ent.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white text-sm truncate">{ent.razao_social || ent.nome}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        {ent.tipo || 'CLIENTE'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Doc: {ent.cpf_cnpj || 'Sem CPF/CNPJ'}
                    </div>
                    {ent.telefone && (
                      <div className="text-xs text-emerald-400 font-mono">
                        📞 {ent.telefone}
                      </div>
                    )}
                    {ent.limite_credito !== undefined && (
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        Limite Fiado/Convênio: <strong>R$ {Number(ent.limite_credito || 0).toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 5: FINANCEIRO & DRE */}
        {abaAtiva === 'financeiro' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Total a Receber
                </span>
                <div className="text-2xl font-black text-white">
                  R$ {Number(financeiro.totais?.totalReceber || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">Contas e convênios em aberto</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400">
                  Total a Pagar
                </span>
                <div className="text-2xl font-black text-white">
                  R$ {Number(financeiro.totais?.totalPagar || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">Despesas e boletos a vencer</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                  Saldo Líquido Previsto
                </span>
                <div className="text-2xl font-black text-white">
                  R${' '}
                  {(
                    Number(financeiro.totais?.totalReceber || 0) -
                    Number(financeiro.totais?.totalPagar || 0)
                  ).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">Projeção financeira</div>
              </div>
            </div>

            {/* Lista de Títulos */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-black text-white">Títulos Financeiros Cadastrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-extrabold uppercase border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Entidade</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3">Vencimento</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {financeiro.titulos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Nenhum título financeiro registrado.
                        </td>
                      </tr>
                    ) : (
                      financeiro.titulos.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white">{t.descricao}</td>
                          <td className="p-3 text-slate-300">{t.entidade_nome || '-'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                t.tipo === 'RECEBER'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {t.tipo}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-black text-white">
                            R$ {Number(t.valor || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-slate-400">{t.vencimento}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold text-slate-300">{t.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA 6: RELATÓRIOS GERENCIAIS */}
        {abaAtiva === 'relatorios' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-base font-black text-white">Relatórios Gerenciais da Loja</h2>
              <button
                type="button"
                onClick={() => carregarDadosAba('relatorios')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                🔄 Atualizar Relatórios
              </button>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-black text-white">Histórico de Fechamento de Caixas</h3>
              <div className="divide-y divide-slate-800/80">
                {relatorios.caixas.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Nenhum turno de caixa encerrado recentemente.
                  </div>
                ) : (
                  relatorios.caixas.map((cx) => (
                    <div key={cx.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-black text-white">Caixa #{cx.numero || 1} • Turno {cx.id}</div>
                        <div className="text-[11px] text-slate-400">
                          Aberto em: {cx.data_abertura} {cx.data_fechamento ? `| Fechado: ${cx.data_fechamento}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-400">
                          Total Vendido: R$ {Number(cx.total_vendas || 0).toFixed(2)}
                        </div>
                        <span className="text-[10px] text-slate-400">Operador: {cx.operador_nome || 'Caixa'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 7: CONFIGURAÇÕES DA EMPRESA */}
        {abaAtiva === 'configuracoes' && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 max-w-2xl">
            <div>
              <h2 className="text-lg font-black text-white">Dados Cadastrais da Empresa</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configurações da loja física registradas no banco do computador servidor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nome Fantasia</span>
                <div className="font-black text-white text-sm">{configLoja?.nome_loja || tenant.nomeLoja}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Razão Social</span>
                <div className="font-black text-white text-sm">{configLoja?.razao_social || tenant.razaoSocial}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">CNPJ</span>
                <div className="font-mono font-bold text-slate-200">{configLoja?.cnpj || tenant.cnpj}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</span>
                <div className="font-mono text-emerald-400 font-bold">{configLoja?.telefone || 'Não informado'}</div>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Endereço da Loja</span>
                <div className="text-slate-300">
                  {configLoja?.logradouro || configLoja?.endereco || 'Endereço principal'}, {configLoja?.numero || 'S/N'} • {configLoja?.bairro || 'Centro'} - {configLoja?.cidade || ''}/{configLoja?.estado || ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 8: VENDAS / PDV (AVISO DE SEGURANÇA FISCAL) */}
        {abaAtiva === 'pdv_aviso' && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto text-amber-400">
              🛒
            </div>
            <h2 className="text-xl font-black text-white">Registro de Vendas Exclusivo na Loja Física</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Por requisitos de <strong>segurança fiscal (SEFAZ), contingência de cupons, trava de operadores e integração direta com balanças e impressoras térmicas ESC/POS</strong>, a abertura de caixas e o registro de vendas acontecem exclusivamente no <strong>aplicativo desktop instalado fisicamente no caixa da sua loja</strong>.
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left text-slate-400 space-y-2">
              <div className="font-bold text-cyan-400 uppercase text-[10px]">O que você pode fazer pelo portal web:</div>
              <div>✓ Consultar faturamento em tempo real, ticket médio e vendas realizadas</div>
              <div>✓ Cadastrar e alterar produtos, preços de venda e estoque</div>
              <div>✓ Consultar e gerenciar clientes, convênios (fiado) e contas a pagar/receber</div>
              <div>✓ Visualizar relatórios fiscais, DRE e fechamentos de turno</div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Novo Produto Cadastrado pelo Portal */}
      {modalNovoProduto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Cadastrar Produto Remoto na Loja</h3>
              <button
                type="button"
                onClick={() => setModalNovoProduto(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarProduto} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Descrição do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Coca-Cola 2L, Arroz 5kg..."
                  value={formProduto.descricao}
                  onChange={(e) => setFormProduto({ ...formProduto, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Código de Barras EAN</label>
                  <input
                    type="text"
                    placeholder="789..."
                    value={formProduto.codigo_barras}
                    onChange={(e) => setFormProduto({ ...formProduto, codigo_barras: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Unidade</label>
                  <select
                    value={formProduto.unidade_medida}
                    onChange={(e) => setFormProduto({ ...formProduto, unidade_medida: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold outline-none"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="FD">FD (Fardo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Preço Venda *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formProduto.preco_venda}
                    onChange={(e) => setFormProduto({ ...formProduto, preco_venda: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-emerald-400 outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Preço Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formProduto.preco_custo}
                    onChange={(e) => setFormProduto({ ...formProduto, preco_custo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formProduto.estoque_atual}
                    onChange={(e) => setFormProduto({ ...formProduto, estoque_atual: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoProduto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoProduto}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shadow-md transition"
                >
                  {salvandoProduto ? 'Gravando no Servidor...' : 'Salvar no Computador da Loja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
