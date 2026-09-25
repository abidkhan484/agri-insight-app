import { Navigate, NavLink, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import PestGallery from './pages/PestGallery';
import Calendar from './pages/Calendar';
import Glossary from './pages/Glossary';
import MultiLayer from './pages/MultiLayer';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';
import './App.css';

export default function App() {
  const { isBangla } = useLanguage();
  const navItems = isBangla
    ? ['শুরু', 'হিসাব', 'পোকা ও রোগ', 'ফসল পঞ্জিকা', 'বহুস্তর চাষ', 'শব্দকোষ']
    : ['Home', 'Calculator', 'Pests & diseases', 'Crop calendar', 'Multi-layer crops', 'Glossary'];
  return (
    <div className="knowledge-page">
      <header className="main-header">
        <p className="knowledge-eyebrow"><LanguageText bn="কৃষি সহায়তা" en="Farm support" /></p>
        <h1><span className="bn">কৃষি জ্ঞানভাণ্ডার</span><span className="en">ZBNF Knowledge Base</span></h1>
        <nav className="knowledge-nav" aria-label={isBangla ? 'জ্ঞানভাণ্ডার নেভিগেশন' : 'Knowledge base navigation'}>
          <NavLink to="/knowledge" end>{navItems[0]}</NavLink>
          <NavLink to="/knowledge/calculator">{navItems[1]}</NavLink>
          <NavLink to="/knowledge/pests">{navItems[2]}</NavLink>
          <NavLink to="/knowledge/calendar">{navItems[3]}</NavLink>
          <NavLink to="/knowledge/multi-layer">{navItems[4]}</NavLink>
          <NavLink to="/knowledge/glossary">{navItems[5]}</NavLink>
        </nav>
      </header>
      
      <main className="knowledge-content">
        <Routes>
          <Route index element={<Home />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="pests" element={<PestGallery />} />
          <Route path="pests/calculator" element={<Navigate to="/knowledge/calculator" replace />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="multi-layer" element={<MultiLayer />} />
          <Route path="glossary" element={<Glossary />} />
        </Routes>
      </main>

    </div>
  );
}
