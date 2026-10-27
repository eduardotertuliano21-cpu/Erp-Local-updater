import { useEffect } from 'react';

export interface ShortcutHandlers {
  onF1?: () => void;
  onF2?: () => void;
  onF3?: () => void;
  onCtrlF3?: () => void;
  onF4?: () => void;
  onF5?: () => void;
  onF6?: () => void;
  onF7?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onF10?: () => void;
  onF11?: () => void;
  onF12?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onDelete?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, disabled = false) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercepta CTRL + F3 (Acesso Administrativo Mestre Secreto)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'F3' || e.code === 'F3')) {
        e.preventDefault();
        e.stopPropagation();
        handlers.onCtrlF3?.();
        return;
      }

      // Impede comportamentos padrão do navegador para teclas F do PDV
      if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'F1':
          handlers.onF1?.();
          break;
        case 'F2':
          handlers.onF2?.();
          break;
        case 'F3':
          handlers.onF3?.();
          break;
        case 'F4':
          handlers.onF4?.();
          break;
        case 'F5':
          handlers.onF5?.();
          break;
        case 'F6':
          handlers.onF6?.();
          break;
        case 'F7':
          handlers.onF7?.();
          break;
        case 'F8':
          handlers.onF8?.();
          break;
        case 'F9':
          handlers.onF9?.();
          break;
        case 'F10':
          handlers.onF10?.();
          break;
        case 'F11':
          handlers.onF11?.();
          break;
        case 'F12':
          handlers.onF12?.();
          break;
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'ArrowUp':
          handlers.onArrowUp?.();
          break;
        case 'ArrowDown':
          handlers.onArrowDown?.();
          break;
        case 'Delete':
          handlers.onDelete?.();
          break;
        case 'PageUp':
          e.preventDefault();
          handlers.onPageUp?.();
          break;
        case 'PageDown':
          e.preventDefault();
          handlers.onPageDown?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, disabled]);
}
