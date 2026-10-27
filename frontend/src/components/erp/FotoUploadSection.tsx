import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { produtoApi } from '../../services/produtoApi.js';

interface FotoUploadSectionProps {
  foto: string | null;
  previewFoto: string | null;
  onFotoUploaded: (nomeArquivo: string, base64: string) => void;
  onFotoRemoved: () => void;
  onError: (msg: string) => void;
}

export const FotoUploadSection: React.FC<FotoUploadSectionProps> = ({
  previewFoto,
  onFotoUploaded,
  onFotoRemoved,
  onError,
}) => {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploading(true);
      const res = await produtoApi.uploadFoto(base64);
      setUploading(false);
      if (res.success && res.data) {
        onFotoUploaded(res.data.nomeArquivo, base64);
      } else {
        onError(res.error || 'Falha ao salvar foto');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-950/60 rounded-2xl border border-slate-800 select-none">
      <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
        {previewFoto ? (
          <img src={previewFoto} alt="Foto Produto" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-6 h-6 text-slate-600" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="font-bold text-slate-200">Foto do Produto / Prato</div>
        <p className="text-[10px] text-slate-400 mt-0.5">Salva localmente sem inchar o banco. Aparece no catálogo e na frente de caixa.</p>
        <div className="flex items-center gap-2 mt-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>{previewFoto ? 'Trocar Foto' : 'Selecionar Imagem'}</span>
          </button>
          {previewFoto && (
            <button
              type="button"
              onClick={onFotoRemoved}
              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 cursor-pointer"
              title="Remover foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
