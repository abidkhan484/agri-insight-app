import { NavLink, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import PestGallery from './pages/PestGallery';
import Calendar from './pages/Calendar';
import Glossary from './pages/Glossary';
import './App.css';

export default function App() {
  return (
    <div className="knowledge-page">
      <header className="main-header">
        <p className="knowledge-eyebrow">কৃষি সহায়তা</p>
        <h1><span className="bn">কৃষি জ্ঞানভাণ্ডার</span><span className="en">ZBNF Knowledge Base</span></h1>
        <nav className="knowledge-nav" aria-label="জ্ঞানভাণ্ডার নেভিগেশন">
          <NavLink to="/knowledge" end>শুরু</NavLink>
          <NavLink to="/knowledge/calculator">হিসাব</NavLink>
          <NavLink to="/knowledge/pests">পোকা ও রোগ</NavLink>
          <NavLink to="/knowledge/calendar">ফসল পঞ্জিকা</NavLink>
          <NavLink to="/knowledge/glossary">শব্দকোষ</NavLink>
        </nav>
      </header>
      
      <main className="knowledge-content">
        <Routes>
          <Route index element={<Home />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="pests" element={<PestGallery />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="glossary" element={<Glossary />} />
        </Routes>
      </main>

    </div>
  );
}
