import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, LogOut, BookOpen } from 'lucide-react';
import { subscribeToMesas, emitNovoPedido } from '../../services/restaurantSocket.js';
import { MobilePinScreen } from './MobilePinScreen.js';
import { MobileMenuView } from './MobileMenuView.js';
import type { ItemPedidoMobile } from './mobileOrderData.js';
import { authApi } from '../../services/authApi.js';
import { api } from '../../services/api.js';
import type { Produto } from '../../types/pdv.js';

export const MobileOrderApp: React.FC = () => {
  const [pin, setPin] = useState<string>('');
  const [pinErro, setPinErro] = useState<string | null>(null);
  const [validandoPin, setValidandoPin] = useState<boolean>(false);
  const [garcomLogado, setGarcomLogado] = useState<string | null>(null);
  const [modoCardapio, setModoCardapio] = useState<boolean>(false);
  const [mesas, setMesas] = useState<any[]>([]);
  const [mesaAtiva, setMesaAtiva] = useState<any | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemPedidoMobile[]>([]);
  const [categoria, setCategoria] = useState<string>('TODOS');
  const [obsModalItem, setObsModalItem] = useState<{ index: number; texto: string } | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMesas(
      (todas) => setMesas(todas),
      (atualizada) => {
        setMesas((prev) => prev.map((m) => (m.numero === atualizada.numero ? atualizada : m)));
        if (mesaAtiva && mesaAtiva.numero === atualizada.numero) {
          setMesaAtiva(atualizada);
        }
      }
    );
    return () => unsubscribe();
  }, [mesaAtiva]);

  // Carrega produtos imediatamente ao abrir o app mobile
  const recarregarProdutos = () => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('clickstorm_business_mode', 'restaurante'); } catch {}
    }
    api.pesquisarProdutos('', 'restaurante', 'restaurante').then((res) => {
      if (res.success && res.data) {
        const itensRestaurante = res.data.filter((p) => p.ativo !== 0 && (
          p.tipo_pdv === 'RESTAURANTE' ||
          p.ramo_atuacao === 'restaurante' ||
          p.categoria === 'PRATOS' ||
          p.categoria === 'BEBIDAS' ||
          p.categoria === 'SOBREMESAS' ||
          p.categoria === 'PORCOES'
        ));
        setProdutos(itensRestaurante.length > 0 ? itensRestaurante : res.data.filter((p) => p.ativo !== 0));
      }
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('clickstorm_business_mode', 'restaurante'); } catch {}
    }
    recarregarProdutos();
  }, []);

  const executarLogin = async (pinValidar: string) => {
    if (!pinValidar || pinValidar.length < 4 || validandoPin) return;
    setValidandoPin(true);
    setPinErro(null);
    try {
      const res = await authApi.validarPinGarcom(pinValidar.trim());
      if (res.success && res.data) {
        setGarcomLogado(res.data.nome || `Garçom #${pinValidar}`);
        setPinErro(null);
        recarregarProdutos();
      } else {
        setPinErro(res.error || 'Senha incorreta. Verifique o PIN cadastrado.');
        setPin('');
      }
    } catch (e: any) {
      setPinErro(e.message || 'Falha ao conectar com o computador caixa');
    } finally {
      setValidandoPin(false);
    }
  };

  const handlePinDigit = (num: string) => {
    if (pin.length < 8 && !validandoPin) {
      setPinErro(null);
      const novoPin = pin + num;
      setPin(novoPin);
      // Se atingir 4 dígitos e nenhum outro for digitado em breve ou se for senha padrão
      if (novoPin.length === 4) {
        executarLogin(novoPin);
      }
    }
  };

  const addItem = (nome: string, preco: number, id?: string) => {
    setCarrinho((prev) => {
      const idx = prev.findIndex((i) => i.descricao === nome && !i.observacao);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantidade += 1;
        return copy;
      }
      return [...prev, { produto_id: id, descricao: nome, preco_unitario: preco, quantidade: 1 }];
    });
  };

  const handleEnviarPedido = () => {
    if (!mesaAtiva || carrinho.length === 0) return;
    setEnviando(true);
    emitNovoPedido({ mesa_numero: mesaAtiva.numero, garcom_pin: pin, itens: carrinho });

    setSucessoMsg(`✓ Pedido enviado para Mesa ${mesaAtiva.numero}!`);
    setCarrinho([]);
    setTimeout(() => {
      setSucessoMsg(null);
      setMesaAtiva(null);
      setEnviando(false);
    }, 1800);
  };

  // Visão de Cardápio Digital (Livre, sem senha)
  if (modoCardapio) {
    return (
      <MobileMenuView
        produtos={produtos}
        carrinho={[]}
        categoria={categoria}
        enviando={false}
        modoCardapio={true}
        onVoltar={() => setModoCardapio(false)}
        onSelectCategoria={setCategoria}
        onAddItem={() => {}}
        onRemoveItem={() => {}}
        onOpenObs={() => {}}
        onEnviarPedido={() => {}}
      />
    );
  }

  // Visão de Bloqueio por PIN
  if (!garcomLogado) {
    return (
      <MobilePinScreen
        pin={pin}
        erro={pinErro}
        loading={validandoPin}
        onDigit={handlePinDigit}
        onClear={() => { setPin(''); setPinErro(null); }}
        onBackspace={() => { setPin((p) => p.slice(0, -1)); setPinErro(null); }}
        onSubmitPin={() => executarLogin(pin)}
        onVerCardapio={() => { recarregarProdutos(); setModoCardapio(true); }}
      />
    );
  }

  // Visão de Cardápio da Mesa Selecionada (Garçom lançando itens)
  if (mesaAtiva) {
    return (
      <>
        <MobileMenuView
          mesa={mesaAtiva}
          garcomNome={garcomLogado}
          produtos={produtos}
          carrinho={carrinho}
          categoria={categoria}
          enviando={enviando}
          onVoltar={() => setMesaAtiva(null)}
          onSelectCategoria={setCategoria}
          onAddItem={addItem}
          onRemoveItem={(idx) => setCarrinho((prev) => prev.filter((_, i) => i !== idx))}
          onOpenObs={(index, texto) => setObsModalItem({ index, texto })}
          onEnviarPedido={handleEnviarPedido}
        />

        {obsModalItem !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-xs space-y-3">
              <h4 className="text-xs font-bold text-white">Observação do Item</h4>
              <input
                type="text"
                autoFocus
                placeholder="Ex: Sem cebola, Gelo e limão..."
                value={obsModalItem.texto}
                onChange={(e) => setObsModalItem({ ...obsModalItem, texto: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white outline-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setObsModalItem(null)} className="px-3 py-1.5 text-xs text-slate-400">Cancelar</button>
                <button
                  onClick={() => {
                    const copy = [...carrinho];
                    copy[obsModalItem.index].observacao = obsModalItem.texto.trim();
                    setCarrinho(copy);
                    setObsModalItem(null);
                  }}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {sucessoMsg && (
          <div className="fixed top-6 left-4 right-4 max-w-xs mx-auto p-3 bg-emerald-600 text-white font-bold text-xs text-center rounded-2xl shadow-2xl z-50 animate-bounce">
            {sucessoMsg}
          </div>
        )}
      </>
    );
  }

  // Visão de Seleção de Mesas pelo Garçom
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto select-none font-sans p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Mesas & Comandas</h2>
            <div className="text-[10px] text-amber-400 font-mono font-bold">{garcomLogado}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModoCardapio(true)}
            className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cardápio</span>
          </button>
          <button
            onClick={() => { setGarcomLogado(null); setPin(''); }}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pb-6">
        {mesas.map((m) => {
          const isOcupada = m.status === 'OCUPADA' || m.status === 'FECHANDO';
          return (
            <div
              key={m.id}
              onClick={() => setMesaAtiva(m)}
              className={`p-4 rounded-2xl border cursor-pointer active:scale-95 transition flex flex-col justify-between h-32 ${
                isOcupada
                  ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400 ring-1 ring-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-white">Mesa {m.numero}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isOcupada ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {m.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xs font-mono font-bold text-slate-200">
                  {m.subtotal > 0 ? `R$ ${m.subtotal.toFixed(2)}` : 'Disponível'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {m.itens?.length ? `${m.itens.length} itens pedidos` : 'Toque para abrir'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
