import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, FileCheck2, UserCheck, PackagePlus, Truck, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { nfeDanfeApi } from '../../services/nfeDanfeApi.js';
import type { Produto } from '../../types/pdv.js';

interface NfeEmissaoFormProps {
  onNotaEmitida: (nota: any) => void;
}

export const NfeEmissaoForm: React.FC<NfeEmissaoFormProps> = ({ onNotaEmitida }) => {
  const [naturezaOperacao, setNaturezaOperacao] = useState('VENDA DE MERCADORIA');
  const [tipoOperacao, setTipoOperacao] = useState<'1' | '0'>('1');
  const [finalidade, setFinalidade] = useState<'1' | '2' | '3' | '4'>('1');
  const [serie, setSerie] = useState('1');

  const [buscaCliente, setBuscaCliente] = useState(''), [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);
  const [destNome, setDestNome] = useState(''), [destDoc, setDestDoc] = useState(''), [destIe, setDestIe] = useState('ISENTO');
  const [destTelefone, setDestTelefone] = useState(''), [destCep, setDestCep] = useState(''), [destLogradouro, setDestLogradouro] = useState('');
  const [destNumero, setDestNumero] = useState(''), [destBairro, setDestBairro] = useState(''), [destCidade, setDestCidade] = useState('SÃO PAULO'), [destUf, setDestUf] = useState('SP');

  const [buscaProd, setBuscaProd] = useState(''), [prodsSugeridos, setProdsSugeridos] = useState<Produto[]>([]), [itens, setItens] = useState<any[]>([]);
  const [modFrete, setModFrete] = useState<'0' | '1' | '2' | '9'>('9'), [transpNome, setTranspNome] = useState(''), [placaVeiculo, setPlacaVeiculo] = useState('');
  const [volumesQtd, setVolumesQtd] = useState('1'), [pesoBruto, setPesoBruto] = useState('0'), [valorFrete, setValorFrete] = useState('0');
  const [valorDesconto, setValorDesconto] = useState('0'), [formaPagamento, setFormaPagamento] = useState('À VISTA'), [meioPagamento, setMeioPagamento] = useState('01');
  const [infoComplementares, setInfoComplementares] = useState(''), [baixarEstoque, setBaixarEstoque] = useState(true);
  const [emitindo, setEmitindo] = useState(false), [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (buscaCliente.trim().length < 2) { setClientesSugeridos([]); return; }
    const t = setTimeout(async () => {
      const res = await api.listarEntidades('CLIENTE', buscaCliente);
      if (res.success && Array.isArray(res.data)) setClientesSugeridos(res.data.slice(0, 6));
    }, 180);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  useEffect(() => {
    if (buscaProd.trim().length < 2) { setProdsSugeridos([]); return; }
    const t = setTimeout(async () => {
      const res = await api.pesquisarProdutos(buscaProd, 'erp');
      if (res.success && Array.isArray(res.data)) setProdsSugeridos(res.data.slice(0, 8));
    }, 180);
    return () => clearTimeout(t);
  }, [buscaProd]);

  const selecionarCliente = (c: any) => {
    setDestNome(c.razao_social || c.nome || ''); setDestDoc(c.cpf_cnpj || c.documento || ''); setDestIe(c.rg_ie || 'ISENTO');
    setDestTelefone(c.telefone || ''); setDestCep(c.cep || ''); setDestLogradouro(c.logradouro || c.endereco || '');
    setDestNumero(c.numero || 'S/N'); setDestBairro(c.bairro || 'CENTRO'); setDestCidade(c.cidade || 'SÃO PAULO'); setDestUf(c.uf || 'SP');
    setBuscaCliente(''); setClientesSugeridos([]);
  };

  const adicionarProduto = (p?: Produto) => {
    const cfopPadrao = tipoOperacao === '0' ? '1102' : '5102';
    const novo = p
      ? { id: crypto.randomUUID(), produto_id: p.id, codigo: p.codigo_barras || p.sku || '001', descricao: p.descricao, ncm: p.ncm || '00000000', cfop: p.cfop || cfopPadrao, cst_csosn: p.cst_csosn || '102', unidade: p.unidade_medida || 'UN', quantidade: 1, valor_unitario: Number(p.preco_venda || 0), desconto: 0, aliquota_icms: Number(p.aliquota_icms || 0), aliquota_ipi: 0 }
      : { id: crypto.randomUUID(), codigo: String(itens.length + 1).padStart(3, '0'), descricao: 'ITEM / MERCADORIA AVULSA', ncm: '00000000', cfop: cfopPadrao, cst_csosn: '102', unidade: 'UN', quantidade: 1, valor_unitario: 10, desconto: 0, aliquota_icms: 0, aliquota_ipi: 0 };
    setItens((prev) => [...prev, novo]); setBuscaProd(''); setProdsSugeridos([]);
  };

  const atualizarItem = (idx: number, campo: string, valor: any) => setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  const removerItem = (idx: number) => setItens((prev) => prev.filter((_, i) => i !== idx));

  const subtotalProdutos = itens.reduce((acc, it) => acc + Number(it.quantidade || 0) * Number(it.valor_unitario || 0), 0);
  const totalIcms = itens.reduce((acc, it) => acc + (Math.max(0, Number(it.quantidade || 0) * Number(it.valor_unitario || 0) - Number(it.desconto || 0)) * Number(it.aliquota_icms || 0)) / 100, 0);
  const vFreteNum = parseFloat(valorFrete.replace(',', '.')) || 0;
  const vDescNum = (parseFloat(valorDesconto.replace(',', '.')) || 0) + itens.reduce((a, b) => a + Number(b.desconto || 0), 0);
  const valorTotalNota = Math.max(0, subtotalProdutos - vDescNum + vFreteNum);

  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!destNome.trim() || !destDoc.trim()) { setErro('Preencha o Nome / Razão Social e o CPF / CNPJ do cliente ou empresa.'); return; }
    if (itens.length === 0) { setErro('Adicione pelo menos 1 produto ou item na nota fiscal.'); return; }

    setEmitindo(true);
    try {
      const res = await nfeDanfeApi.emitir({
        serie: parseInt(serie, 10) || 1, natureza_operacao: naturezaOperacao, tipo_operacao: tipoOperacao, finalidade,
        destinatario: { nome: destNome.trim(), documento: destDoc.trim(), ie: destIe.trim() || 'ISENTO', telefone: destTelefone.trim(), cep: destCep.trim(), logradouro: destLogradouro.trim(), numero: destNumero.trim() || 'S/N', bairro: destBairro.trim() || 'CENTRO', cidade: destCidade.trim() || 'SÃO PAULO', uf: destUf.trim() || 'SP' },
        itens: itens.map((it) => ({ ...it, quantidade: Number(it.quantidade) || 1, valor_unitario: Number(it.valor_unitario) || 0, desconto: Number(it.desconto) || 0, subtotal: Math.max(0, (Number(it.quantidade) || 1) * (Number(it.valor_unitario) || 0) - (Number(it.desconto) || 0)) })),
        transporte: { modalidade_frete: modFrete, transportadora_nome: transpNome.trim() || 'O PRÓPRIO', placa_veiculo: placaVeiculo.trim().toUpperCase(), volumes_qtd: parseInt(volumesQtd, 10) || 1, especie: 'CAIXA', peso_bruto: parseFloat(pesoBruto.replace(',', '.')) || 0, peso_liquido: parseFloat(pesoBruto.replace(',', '.')) || 0 },
        forma_pagamento: formaPagamento, meio_pagamento: meioPagamento, valor_frete: vFreteNum, valor_desconto: parseFloat(valorDesconto.replace(',', '.')) || 0, informacoes_complementares: infoComplementares.trim(), baixar_estoque: baixarEstoque,
      });
      if (res.success && res.data) { setItens([]); onNotaEmitida(res.data); }
      else setErro(res.error || 'Falha ao emitir NF-e.');
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao emitir NF-e.');
    } finally {
      setEmitindo(false);
    }
  };

  return (
    <form onSubmit={handleEmitir} className="space-y-4 text-xs">
      {erro && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold">{erro}</div>}

      {/* 1. Dados da Operação Fiscal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-sky-400" />
          <span>1. Dados da Operação Fiscal (Modelo 55 - DANFE A4)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Natureza da Operação *</label>
            <input type="text" required value={naturezaOperacao} onChange={(e) => setNaturezaOperacao(e.target.value.toUpperCase())} list="naturezas-list" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold" />
            <datalist id="naturezas-list">
              <option value="VENDA DE MERCADORIA" /><option value="VENDA DE PRODUCAO DO ESTABELECIMENTO" /><option value="DEVOLUCAO DE COMPRA / MERCADORIA" /><option value="REMESSA PARA CONSERTO OU REPARO" /><option value="SIMPLES REMESSA" />
            </datalist>
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Tipo de Operação</label>
            <select value={tipoOperacao} onChange={(e) => setTipoOperacao(e.target.value as '1' | '0')} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold">
              <option value="1">1 - Saída (Venda / Remessa)</option><option value="0">0 - Entrada (Devolução / Compra)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Finalidade</label>
              <select value={finalidade} onChange={(e) => setFinalidade(e.target.value as any)} className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <option value="1">1 - Normal</option><option value="2">2 - Compl.</option><option value="3">3 - Ajuste</option><option value="4">4 - Devolução</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Série</label>
              <input type="number" min="1" value={serie} onChange={(e) => setSerie(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Destinatário */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>2. Destinatário (Cliente ou Empresa — Nome usado para salvar o arquivo da Nota)</span>
          </div>
          <div className="relative w-full sm:w-80">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} placeholder="Buscar cliente cadastrado por nome/CNPJ..." className="w-full bg-transparent text-slate-800 dark:text-white focus:outline-none" />
            </div>
            {clientesSugeridos.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {clientesSugeridos.map((c) => (
                  <button key={c.id} type="button" onClick={() => selecionarCliente(c)} className="w-full text-left px-3 py-2 hover:bg-sky-500/10 flex justify-between items-center cursor-pointer">
                    <span className="font-bold text-slate-800 dark:text-white truncate">{c.razao_social || c.nome}</span>
                    <span className="font-mono text-[10px] text-slate-400">{c.cpf_cnpj || c.documento}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Nome Completo / Razão Social da Empresa *</label>
            <input type="text" required value={destNome} onChange={(e) => setDestNome(e.target.value.toUpperCase())} placeholder="Ex: COMERCIAL SILVA LTDA ou JOÃO DA SILVA" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold" />
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">CPF ou CNPJ *</label>
            <input type="text" required value={destDoc} onChange={(e) => setDestDoc(e.target.value)} placeholder="00.000.000/0001-00" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
          </div>
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Inscrição Estadual (IE)</label>
            <input type="text" value={destIe} onChange={(e) => setDestIe(e.target.value.toUpperCase())} placeholder="ISENTO ou Nº IE" className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">CEP</label><input type="text" value={destCep} onChange={(e) => setDestCep(e.target.value)} placeholder="00000-000" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" /></div>
          <div className="col-span-2"><label className="block text-[11px] font-semibold text-slate-500 mb-1">Logradouro / Rua / Av.</label><input type="text" value={destLogradouro} onChange={(e) => setDestLogradouro(e.target.value.toUpperCase())} placeholder="RUA CENTRO" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" /></div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nº / Bairro</label>
            <div className="flex gap-1">
              <input type="text" value={destNumero} onChange={(e) => setDestNumero(e.target.value)} placeholder="Nº" className="w-14 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
              <input type="text" value={destBairro} onChange={(e) => setDestBairro(e.target.value.toUpperCase())} placeholder="Bairro" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cidade / UF</label>
            <div className="flex gap-1">
              <input type="text" value={destCidade} onChange={(e) => setDestCidade(e.target.value.toUpperCase())} className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
              <input type="text" maxLength={2} value={destUf} onChange={(e) => setDestUf(e.target.value.toUpperCase())} className="w-11 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-center font-bold" />
            </div>
          </div>
          <div><label className="block text-[11px] font-semibold text-slate-500 mb-1">Telefone</label><input type="text" value={destTelefone} onChange={(e) => setDestTelefone(e.target.value)} placeholder="(11) 99999-9999" className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" /></div>
        </div>
      </div>

      {/* 3. Produtos e Serviços da Nota */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <PackagePlus className="w-4 h-4 text-amber-400" />
            <span>3. Produtos / Mercadorias da NF-e ({itens.length} itens)</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input type="text" value={buscaProd} onChange={(e) => setBuscaProd(e.target.value)} placeholder="Pesquisar produto no catálogo..." className="w-full bg-transparent text-slate-800 dark:text-white focus:outline-none" />
              </div>
              {prodsSugeridos.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {prodsSugeridos.map((p) => (
                    <button key={p.id} type="button" onClick={() => adicionarProduto(p)} className="w-full text-left px-3 py-2 hover:bg-amber-500/10 flex justify-between items-center cursor-pointer">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{p.descricao}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NCM: {p.ncm || '00000000'} • CFOP: {p.cfop || '5102'}</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-500">R$ {Number(p.preco_venda).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => adicionarProduto()} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer shrink-0">
              <Plus className="w-3.5 h-3.5" /> Item Avulso
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-sans text-[10px]">
              <tr>
                <th className="p-2">Código</th><th className="p-2">Descrição</th><th className="p-2">NCM</th><th className="p-2">CFOP</th><th className="p-2">CSOSN</th><th className="p-2">UN</th><th className="p-2">Qtd</th><th className="p-2">Vl. Unit</th><th className="p-2">% ICMS</th><th className="p-2 text-right">Subtotal</th><th className="p-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {itens.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-6 text-slate-400 font-sans">Busque um produto acima ou clique em "+ Item Avulso" para incluir na nota.</td></tr>
              ) : (
                itens.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="p-1.5"><input type="text" value={it.codigo} onChange={(e) => atualizarItem(idx, 'codigo', e.target.value)} className="w-20 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700" /></td>
                    <td className="p-1.5"><input type="text" value={it.descricao} onChange={(e) => atualizarItem(idx, 'descricao', e.target.value.toUpperCase())} className="w-44 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-sans font-bold" /></td>
                    <td className="p-1.5"><input type="text" value={it.ncm} onChange={(e) => atualizarItem(idx, 'ncm', e.target.value)} className="w-20 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700" /></td>
                    <td className="p-1.5"><input type="text" value={it.cfop} onChange={(e) => atualizarItem(idx, 'cfop', e.target.value)} className="w-14 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700" /></td>
                    <td className="p-1.5"><input type="text" value={it.cst_csosn} onChange={(e) => atualizarItem(idx, 'cst_csosn', e.target.value)} className="w-14 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700" /></td>
                    <td className="p-1.5"><input type="text" value={it.unidade} onChange={(e) => atualizarItem(idx, 'unidade', e.target.value.toUpperCase())} className="w-12 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-center" /></td>
                    <td className="p-1.5"><input type="number" step="0.001" value={it.quantidade} onChange={(e) => atualizarItem(idx, 'quantidade', e.target.value)} className="w-16 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-right" /></td>
                    <td className="p-1.5"><input type="number" step="0.01" value={it.valor_unitario} onChange={(e) => atualizarItem(idx, 'valor_unitario', e.target.value)} className="w-20 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-right" /></td>
                    <td className="p-1.5"><input type="number" step="0.1" value={it.aliquota_icms} onChange={(e) => atualizarItem(idx, 'aliquota_icms', e.target.value)} className="w-14 px-1.5 py-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-right" /></td>
                    <td className="p-1.5 text-right font-bold text-emerald-600 dark:text-emerald-400">R$ {(Number(it.quantidade || 0) * Number(it.valor_unitario || 0)).toFixed(2)}</td>
                    <td className="p-1.5 text-center"><button type="button" onClick={() => removerItem(idx)} className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Transporte, Pagamento e Emissão */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-400" />
          <span>4. Frete, Pagamento e Finalização do DANFE</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          <div className="col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Modalidade do Frete</label>
            <select value={modFrete} onChange={(e) => setModFrete(e.target.value as any)} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              <option value="9">9 - Sem Frete</option><option value="0">0 - Emitente (CIF)</option><option value="1">1 - Destinatário (FOB)</option><option value="2">2 - Terceiros</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Transportadora / Placa</label>
            <div className="flex gap-1">
              <input type="text" value={transpNome} onChange={(e) => setTranspNome(e.target.value)} placeholder="Transportadora" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
              <input type="text" value={placaVeiculo} onChange={(e) => setPlacaVeiculo(e.target.value)} placeholder="Placa" className="w-16 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Frete / Desc. (R$)</label>
            <div className="flex gap-1">
              <input type="text" value={valorFrete} onChange={(e) => setValorFrete(e.target.value)} placeholder="Frete" className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
              <input type="text" value={valorDesconto} onChange={(e) => setValorDesconto(e.target.value)} placeholder="Desc" className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pagamento</label>
            <select value={formaPagamento} onChange={(e) => { setFormaPagamento(e.target.value); setMeioPagamento(e.target.value.includes('PIX') ? '17' : e.target.value.includes('BOLETO') ? '15' : '01'); }} className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              <option value="À VISTA - DINHEIRO">À Vista (Dinheiro)</option><option value="À VISTA - PIX">À Vista (PIX)</option><option value="CARTÃO DE CRÉDITO / DÉBITO">Cartão</option><option value="A PRAZO - BOLETO BANCÁRIO">A Prazo (Boleto)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Vol. / Peso (KG)</label>
            <div className="flex gap-1">
              <input type="text" value={volumesQtd} onChange={(e) => setVolumesQtd(e.target.value)} className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
              <input type="text" value={pesoBruto} onChange={(e) => setPesoBruto(e.target.value)} className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex-1 min-w-[240px] flex items-center gap-3">
            <input type="text" value={infoComplementares} onChange={(e) => setInfoComplementares(e.target.value)} placeholder="Informações Complementares no rodapé do DANFE (opcional)..." className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
            <label className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0">
              <input type="checkbox" checked={baixarEstoque} onChange={(e) => setBaixarEstoque(e.target.checked)} className="rounded text-emerald-600" />
              <span>Baixar Estoque</span>
            </label>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Geral da NF-e (ICMS: R$ {totalIcms.toFixed(2)})</span>
              <span className="text-xl font-black text-emerald-500 font-mono">R$ {valorTotalNota.toFixed(2)}</span>
            </div>
            <button type="submit" disabled={emitindo} className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50">
              {emitindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
              <span>{emitindo ? 'Emitindo e Salvando...' : 'Emitir NF-e e Gerar DANFE A4'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
