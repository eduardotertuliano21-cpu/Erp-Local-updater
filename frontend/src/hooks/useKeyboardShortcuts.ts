import { useEffect, useRef } from 'react';

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
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercepta CTRL + F3 (Acesso Administrativo Mestre Secreto)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'F3' || e.code === 'F3')) {
        e.preventDefault();
        e.stopPropagation();
        handlersRef.current.onCtrlF3?.();
        return;
      }

      // Impede comportamentos padrão do navegador para teclas F do PDV
      if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'F1':
          handlersRef.current.onF1?.();
          break;
        case 'F2':
          handlersRef.current.onF2?.();
          break;
        case 'F3':
          handlersRef.current.onF3?.();
          break;
        case 'F4':
          handlersRef.current.onF4?.();
          break;
        case 'F5':
          handlersRef.current.onF5?.();
          break;
        case 'F6':
          handlersRef.current.onF6?.();
          break;
        case 'F7':
          handlersRef.current.onF7?.();
          break;
        case 'F8':
          handlersRef.current.onF8?.();
          break;
        case 'F9':
          handlersRef.current.onF9?.();
          break;
        case 'F10':
          handlersRef.current.onF10?.();
          break;
        case 'F11':
          handlersRef.current.onF11?.();
          break;
        case 'F12':
          handlersRef.current.onF12?.();
          break;
        case 'Escape':
          handlersRef.current.onEscape?.();
          break;
        case 'ArrowUp':
          handlersRef.current.onArrowUp?.();
          break;
        case 'ArrowDown':
          handlersRef.current.onArrowDown?.();
          break;
        case 'Delete':
          handlersRef.current.onDelete?.();
          break;
        case 'PageUp':
          e.preventDefault();
          handlersRef.current.onPageUp?.();
          break;
        case 'PageDown':
          e.preventDefault();
          handlersRef.current.onPageDown?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled]);
}
