import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { HeroSection } from './components/HeroSection.jsx';
import { DoresSection } from './components/DoresSection.jsx';
import { SolucaoSection } from './components/SolucaoSection.jsx';
import { NichosSection } from './components/NichosSection.jsx';
import { RecursosSection } from './components/RecursosSection.jsx';
import FaqSection from './components/FaqSection.jsx';
import FooterSection from './components/FooterSection.jsx';
import AdminPanel from './admin/AdminPanel.jsx';
import CustomerPortal from './portal/CustomerPortal.jsx';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');
  const isPortalRoute =
    currentPath === '/portal' ||
    currentPath.startsWith('/portal/') ||
    currentPath === '/cliente' ||
    currentPath.startsWith('/cliente/') ||
    currentPath === '/area-cliente';

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  if (isPortalRoute) {
    if (typeof window !== 'undefined') {
      window.location.href = '/portal/';
      return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Barra de Navegação Fixa */}
      <Navbar onAbrirPortal={() => navigateTo('/portal')} />

      {/* Hero Principal com Prova Visual de Latência */}
      <HeroSection />

      {/* Seção das Dores Mais Comuns dos Comerciantes */}
      <DoresSection />

      {/* Apresentação da Solução Offline-First e Leveza */}
      <SolucaoSection />

      {/* Segmentos e Nichos com Comportamento Interativo */}
      <NichosSection />

      {/* Recursos de Confiança + Gráfico Dinâmico de Crescimento */}
      <RecursosSection />

      {/* FAQ com Respostas Práticas para Dúvidas Comuns */}
      <FaqSection />

      {/* CTA Final e Rodapé Institucional */}
      <FooterSection />
    </div>
  );
}
