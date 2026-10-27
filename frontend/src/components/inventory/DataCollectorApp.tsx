import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Barcode, Check, ArrowLeft, Layers } from 'lucide-react';
import { api } from '../../services/api.js';
import type { Produto } from '../../types/pdv.js';

interface ContagemRecente {
  produtoNome: string;
  codigoBarras: string;
  quantidade: number;
  almoxarifado: string;
  hora: string;
}

export const DataCollectorApp: React.FC = () => {
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [codigoDigitado, setCodigoDigitado] = useState('');
  const [produtoEncontrado, setProdutoEncontrado] = useState<Produto | null>(null);
  const [quantidadeContada, setQuantidadeContada] = useState<string>('1');
  const [almoxarifado, setAlmoxarifado] = useState<'LOJA' | 'DEPOSITO'>('LOJA');
  const [historico, setHistorico] = useState<ContagemRecente[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
    setCameraAtiva(false);
  };

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraAtiva(true);
      scanningRef.current = true;
      scanLoop();
    } catch {
      setStatusMsg({ tipo: 'erro', texto: 'Não foi possível acessar a câmera do dispositivo.' });
    }
  };

  const scanLoop = async () => {
    if (!scanningRef.current || !videoRef.current) return;
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          buscarProduto(raw);
          pararCamera();
          return;
        }
      } catch {}
    }
    if (scanningRef.current) {
      requestAnimationFrame(scanLoop);
    }
  };

  useEffect(() => () => pararCamera(), []);

  const buscarProduto = async (codigo: string) => {
    if (!codigo.trim()) return;
    setCarregando(true);
    setStatusMsg(null);
    try {
      const res = await api.buscarPorCodigoBarras(codigo.trim());
      if (res.success && res.data) {
        setProdutoEncontrado(res.data);
        setQuantidadeContada('1');
        setStatusMsg({ tipo: 'ok', texto: `Produto localizado: ${res.data.descricao}` });
      } else {
        setProdutoEncontrado(null);
        setStatusMsg({ tipo: 'erro', texto: 'Código não encontrado no cadastro local.' });
      }
    } catch {
      setStatusMsg({ tipo: 'erro', texto: 'Erro de conexão com o banco de dados.' });
    } finally {
      setCarregando(false);
    }
  };

  const confirmarContagem = async () => {
    if (!produtoEncontrado) return;
    const qtd = parseFloat(quantidadeContada.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      setStatusMsg({ tipo: 'erro', texto: 'Informe uma quantidade válida.' });
      return;
    }

    setCarregando(true);
    try {
      const res = await api.ajustarEstoque({
        produto_id: produtoEncontrado.id,
        tipo: 'AJUSTE_INVENTARIO',
        almoxarifado,
        quantidade: qtd,
        motivo: `CONTAGEM_COLETOR_MOBILE (${almoxarifado})`,
      });

      if (res.success) {
        const itemHistorico: ContagemRecente = {
          produtoNome: produtoEncontrado.descricao,
          codigoBarras: produtoEncontrado.codigo_barras,
          quantidade: qtd,
          almoxarifado,
          hora: new Date().toLocaleTimeString().slice(0, 5),
        };
        setHistorico((prev) => [itemHistorico, ...prev.slice(0, 9)]);
        setStatusMsg({ tipo: 'ok', texto: `✓ Registrado: ${qtd}x ${produtoEncontrado.descricao}` });
        setProdutoEncontrado(null);
        setCodigoDigitado('');
      } else {
        setStatusMsg({ tipo: 'erro', texto: res.error || 'Erro ao salvar contagem.' });
      }
    } catch (err: any) {
      setStatusMsg({ tipo: 'erro', texto: err.message || 'Falha ao registrar.' });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto font-sans p-4 select-none pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Barcode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black">Coletor de Dados</h1>
            <p className="text-[10px] text-slate-400 font-mono">Inventário & Contagem de Estoque</p>
          </div>
        </div>
        <a href="/" className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800">
          <ArrowLeft className="w-4 h-4" />
        </a>
      </div>

      {/* Camera Viewport */}
      {cameraAtiva && (
        <div className="relative mt-3 rounded-2xl overflow-hidden border border-indigo-500/40 bg-black aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 animate-pulse shadow-glow-brand" />
          <button
            onClick={pararCamera}
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-xl text-white text-xs font-bold"
          >
            <CameraOff className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions and Barcode Input */}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => (cameraAtiva ? pararCamera() : iniciarCamera())}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition"
          >
            {cameraAtiva ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            <span>{cameraAtiva ? 'Fechar Câmera' : 'Escanear com Câmera'}</span>
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); buscarProduto(codigoDigitado); }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Digite ou bipe o código de barras..."
            value={codigoDigitado}
            onChange={(e) => setCodigoDigitado(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={carregando || !codigoDigitado}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 disabled:opacity-40"
          >
            Buscar
          </button>
        </form>

        {statusMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-bold ${
            statusMsg.tipo === 'ok' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {statusMsg.texto}
          </div>
        )}
      </div>

      {/* Product Found Card & Quantity Form */}
      {produtoEncontrado && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3 animate-in fade-in">
          <div>
            <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">
              {produtoEncontrado.codigo_barras}
            </div>
            <h3 className="font-extrabold text-sm text-white mt-0.5">{produtoEncontrado.descricao}</h3>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
              <span>UN: {produtoEncontrado.unidade_medida || 'UN'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">R$ {produtoEncontrado.preco_venda.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Local / Depósito</label>
              <select
                value={almoxarifado}
                onChange={(e) => setAlmoxarifado(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
              >
                <option value="LOJA">Loja (Gôndola)</option>
                <option value="DEPOSITO">Depósito</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Qtd Contada</label>
              <input
                type="text"
                autoFocus
                value={quantidadeContada}
                onChange={(e) => setQuantidadeContada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold text-center"
              />
            </div>
          </div>

          <button
            onClick={confirmarContagem}
            disabled={carregando}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Ajustar Estoque</span>
          </button>
        </div>
      )}

      {/* History */}
      <div className="mt-5 flex-1 overflow-y-auto">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Últimas Contagens Realizadas ({historico.length})</span>
        </h4>
        {historico.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            Nenhuma contagem feita nesta sessão.
          </div>
        ) : (
          <div className="space-y-1.5">
            {historico.map((h, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-white truncate max-w-[200px]">{h.produtoNome}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{h.codigoBarras} • {h.almoxarifado}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-emerald-400 font-mono">{h.quantidade} un</div>
                  <div className="text-[10px] text-slate-500">{h.hora}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
