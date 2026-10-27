import { useState, useEffect, useCallback } from 'react';
import type { ItemCarrinho, CaixaStatus, Produto } from '../types/pdv.js';
import { api } from '../services/api.js';
import { varejoAvancadoApi } from '../services/varejoAvancadoApi.js';
import { useOperacao } from '../context/OperacaoContext.js';
import { criarItemCarrinho } from '../utils/pdvItemBuilder.js';

export type ActiveModal = 'NONE' | 'HELP' | 'SEARCH' | 'PAYMENT' | 'SANGRIA' | 'SUPRIMENTO' | 'CAIXA_STATUS' | 'CLOSE_CAIXA' | 'CLIENTE';

export function usePDV() {
  const { config, tocarBip, tocarAlerta } = useOperacao();
  const [caixa, setCaixa] = useState<CaixaStatus | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [descontoTotal, setDescontoTotal] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<ActiveModal>('NONE');
  const [mensagemStatus, setMensagemStatus] = useState<string>('Pronto para leitura');
  const [isCarregando, setIsCarregando] = useState<boolean>(false);
  const [operadorId] = useState<string>('OPERADOR_PADRAO');
  const [clienteIdentificado, setClienteIdentificado] = useState<any | null>(null);
  const [produtoPesagemAoVivo, setProdutoPesagemAoVivo] = useState<Produto | null>(null);

  const recarregarStatusCaixa = useCallback(async () => {
    const res = await api.obterStatusCaixa();
    if (res.success && res.data) setCaixa(res.data.caixa);
  }, []);

  useEffect(() => {
    recarregarStatusCaixa();
  }, [recarregarStatusCaixa]);

  const subtotal = itens.reduce((acc, item) => acc + item.subtotal, 0);
  const totalLiquido = Math.max(0, subtotal - descontoTotal);
  const quantidadeTotalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const inserirItemInterno = (prodData: any, qtd: number, codigo: string, isBalancaEtiqueta = false, isPesagem = false) => {
    const estoqueAtual = prodData.estoque_atual;
    if (estoqueAtual !== undefined && estoqueAtual <= 0) {
      if (config.estoque_negativo === 'BLOQUEAR') {
        tocarAlerta();
        setMensagemStatus(`❌ Venda Bloqueada: '${prodData.descricao}' com estoque zerado/negativo (${estoqueAtual})`);
        return;
      }
      if (config.estoque_negativo === 'AVISAR') {
        tocarAlerta();
        setMensagemStatus(`⚠️ Atenção: '${prodData.descricao}' com estoque zerado/negativo (${estoqueAtual})`);
      }
    }

    if (config.agrupar_itens_repetidos === 1 && !isBalancaEtiqueta && !isPesagem) {
      const itemExistenteIndex = itens.findIndex((i) => i.produto_id === prodData.id);
      if (itemExistenteIndex >= 0) {
        const itemAntigo = itens[itemExistenteIndex];
        const novaQtd = itemAntigo.quantidade + qtd;
        const novoSubtotal = parseFloat((novaQtd * itemAntigo.preco_unitario - itemAntigo.desconto).toFixed(2));
        const novosItens = [...itens];
        novosItens[itemExistenteIndex] = { ...itemAntigo, quantidade: novaQtd, subtotal: novoSubtotal };
        setItens(novosItens);
        setSelectedIndex(itemExistenteIndex);
        tocarBip();
        setMensagemStatus(`✓ ${prodData.descricao} (+${qtd}x = ${novaQtd} UN - R$ ${novoSubtotal.toFixed(2)})`);
        return;
      }
    }

    const novoItem = criarItemCarrinho(prodData, qtd, codigo, isBalancaEtiqueta, isPesagem);
    setItens((prev) => [...prev, novoItem]);
    setSelectedIndex(itens.length);
    tocarBip();
    setMensagemStatus(`✓ ${novoItem.descricao} (${qtd} ${novoItem.unidade_medida} - R$ ${novoItem.subtotal.toFixed(2)})`);
  };

  const adicionarProdutoPorBarcode = async (inputTexto: string) => {
    if (!inputTexto.trim()) return;
    let quantidade = 1;
    let codigo = inputTexto.trim();

    if (codigo.includes('*')) {
      const partes = codigo.split('*');
      const qtdParse = parseFloat(partes[0].replace(',', '.'));
      if (!isNaN(qtdParse) && qtdParse > 0 && partes[1]) {
        quantidade = qtdParse;
        codigo = partes[1].trim();
      }
    }

    setIsCarregando(true);
    setMensagemStatus(`Consultando: ${codigo}...`);

    try {
      const res = await api.buscarPorCodigoBarras(codigo);
      if (!res.success || !res.data) {
        tocarAlerta();
        setMensagemStatus(`❌ Produto não encontrado: ${codigo}`);
        return;
      }

      const prodData = res.data as any;
      const isBalanca = Boolean(prodData.isItemBalanca);

      // Fluxo 1: Item Pesável no Checkout (Balança Serial ao Vivo)
      if (prodData.is_pesavel_checkout && !isBalanca) {
        setMensagemStatus(`⚖️ Detectando peso na balança para: ${prodData.descricao}...`);
        try {
          const balancaRes = await api.testarBalanca();
          const info = (balancaRes.data as any) || balancaRes;
          if (balancaRes.success && typeof info.peso === 'number' && info.peso > 0 && info.estavel) {
            inserirItemInterno(prodData, info.peso, codigo, false, true);
            return;
          }
        } catch {}
        // Balança zerada, instável ou ausente: abre modal de pesagem ao vivo
        setProdutoPesagemAoVivo(prodData);
        setMensagemStatus(`⚖️ Posicione '${prodData.descricao}' na balança...`);
        return;
      }

      // Fluxo 2: Item Padrão ou Etiqueta com Código de Barras Pré-pesado
      const qtdFinal = isBalanca ? (prodData.quantidadeSugerida || 1) : quantidade;
      inserirItemInterno(prodData, qtdFinal, codigo, isBalanca, false);
    } catch {
      tocarAlerta();
      setMensagemStatus('❌ Erro de conexão com o banco local');
    } finally {
      setIsCarregando(false);
    }
  };

  const confirmarPesagemAoVivo = (peso: number) => {
    if (!produtoPesagemAoVivo) return;
    const prod = produtoPesagemAoVivo;
    const cod = prod.codigo_barras || (prod as any).codigo || 'PESO';
    setProdutoPesagemAoVivo(null);
    inserirItemInterno(prod, peso, cod, false, true);
  };

  const cancelarPesagemAoVivo = () => {
    setProdutoPesagemAoVivo(null);
    setMensagemStatus('Pesagem ao vivo cancelada');
  };

  const removerItemSelecionado = () => {
    if (itens.length === 0) return;
    const indexToRemove = selectedIndex >= 0 && selectedIndex < itens.length ? selectedIndex : itens.length - 1;
    const itemRemovido = itens[indexToRemove];
    setItens((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedIndex((prev) => Math.max(0, Math.min(prev, itens.length - 2)));
    setMensagemStatus(`Item cancelado: ${itemRemovido.descricao}`);
  };

  const cancelarVenda = () => {
    if (itens.length === 0) return;
    setItens([]);
    setSelectedIndex(-1);
    setDescontoTotal(0);
    setClienteIdentificado(null);
    setMensagemStatus('Venda cancelada / Nova venda iniciada');
  };

  const aplicarTabelaPrecoNoCarrinho = useCallback(async (tabelaId: string) => {
    if (!tabelaId) return;
    try {
      setIsCarregando(true);
      const res = await varejoAvancadoApi.obterPrecosTabela(tabelaId);
      if (!res.success || !res.data) return;
      const mapaPrecos = res.data;
      setItens((prev) =>
        prev.map((item) => {
          const precoTabela = mapaPrecos[item.produto_id];
          if (precoTabela !== undefined && precoTabela !== null && precoTabela > 0) {
            const fator = item.fator_saida || 1;
            const novoPrecoUnit = precoTabela * fator;
            const novoSubtotal = parseFloat((novoPrecoUnit * item.quantidade - item.desconto).toFixed(2));
            return { ...item, preco_unitario: novoPrecoUnit, subtotal: Math.max(0, novoSubtotal) };
          }
          return item;
        })
      );
      setMensagemStatus('✓ Carrinho recalculado para a Tabela de Preço');
    } catch {
      setMensagemStatus('⚠️ Erro ao recalcular preços por tabela');
    } finally {
      setIsCarregando(false);
    }
  }, []);

  const identificarCliente = useCallback(async (cliente: any | null) => {
    setClienteIdentificado(cliente);
    if (cliente?.tabela_preco_id) {
      await aplicarTabelaPrecoNoCarrinho(cliente.tabela_preco_id);
      setMensagemStatus(`✓ Cliente ${cliente.razao_social} identificado (Tabela Atacado/B2B aplicada)`);
    } else if (cliente) {
      setMensagemStatus(`✓ Cliente ${cliente.razao_social} identificado`);
    } else {
      setMensagemStatus('Identificação de cliente removida');
    }
  }, [aplicarTabelaPrecoNoCarrinho]);

  const alterarPrecoItemSelecionado = (novoPreco: number) => {
    if (itens.length === 0 || novoPreco < 0) return false;
    const targetIdx = selectedIndex >= 0 && selectedIndex < itens.length ? selectedIndex : itens.length - 1;
    const item = itens[targetIdx];
    const novoSubtotal = parseFloat((novoPreco * item.quantidade - item.desconto).toFixed(2));
    setItens((prev) => {
      const copy = [...prev];
      copy[targetIdx] = { ...item, preco_unitario: novoPreco, subtotal: Math.max(0, novoSubtotal) };
      return copy;
    });
    setMensagemStatus(`✓ Preço alterado: ${item.descricao} -> R$ ${novoPreco.toFixed(2)}`);
    return true;
  };

  const carregarItensExternos = (novosItens: ItemCarrinho[], origem = 'Itens importados') => {
    setItens(novosItens);
    setSelectedIndex(novosItens.length - 1);
    setMensagemStatus(`✓ ${origem} carregada com sucesso (${novosItens.length} itens)`);
  };

  const abrirModal = (modal: ActiveModal) => setActiveModal(modal);
  const fecharModal = () => setActiveModal('NONE');

  return {
    caixa,
    itens,
    selectedIndex,
    setSelectedIndex,
    subtotal,
    descontoTotal,
    setDescontoTotal,
    totalLiquido,
    quantidadeTotalItens,
    activeModal,
    abrirModal,
    fecharModal,
    mensagemStatus,
    setMensagemStatus,
    isCarregando,
    operadorId,
    clienteIdentificado,
    identificarCliente,
    aplicarTabelaPrecoNoCarrinho,
    adicionarProdutoPorBarcode,
    removerItemSelecionado,
    alterarPrecoItemSelecionado,
    carregarItensExternos,
    cancelarVenda,
    recarregarStatusCaixa,
    produtoPesagemAoVivo,
    confirmarPesagemAoVivo,
    cancelarPesagemAoVivo,
  };
}
