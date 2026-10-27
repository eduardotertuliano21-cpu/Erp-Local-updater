import React, { useEffect, useState } from 'react';
import { X, Wifi, Smartphone, Copy, Check } from 'lucide-react';
import { api } from '../../services/api.js';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<{ ip: string; porta: string; url: string; qrcode: string } | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCarregando(true);
      const isVite = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174');
      const porta = typeof window !== 'undefined' ? (isVite ? window.location.port : (window.location.port || '5000')) : '5000';
      api.obterQrCodeMobile(porta)
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .finally(() => setCarregando(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copiarUrl = () => {
    if (data?.url) {
      navigator.clipboard.writeText(data.url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight">Comanda Mobile do Garçom</h3>
        <p className="text-xs text-slate-400 mt-1">
          Aponte a câmera do celular conectado ao Wi-Fi da loja para abrir o aplicativo de pedidos
        </p>

        <div className="my-5 p-4 bg-white rounded-2xl border border-slate-700 shadow-inner flex flex-col items-center justify-center min-h-[240px]">
          {carregando ? (
            <div className="text-slate-500 font-mono text-xs animate-pulse">Gerando QR Code...</div>
          ) : data?.qrcode ? (
            <img src={data.qrcode} alt="QR Code Comanda Mobile" className="w-56 h-56 object-contain rounded-xl" />
          ) : (
            <div className="text-rose-500 font-mono text-xs">Erro ao gerar QR Code</div>
          )}
        </div>

        {data?.url && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2 truncate pr-2">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{data.url}</span>
            </div>
            <button
              onClick={copiarUrl}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
              title="Copiar URL"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        <div className="mt-4 text-[11px] text-slate-500 font-medium">
          O celular precisa estar conectado na mesma rede Wi-Fi que este computador Master
        </div>
      </div>
    </div>
  );
};
