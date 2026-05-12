import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import PestGallery from './pages/PestGallery';
import Calendar from './pages/Calendar';
import Glossary from './pages/Glossary';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="main-header">
          <h1>ZBNF <span className="bn">কৃষি জ্ঞানভাণ্ডার</span></h1>
        </header>
        
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/pests" element={<PestGallery />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/glossary" element={<Glossary />} />
          </Routes>
        </main>

        <nav className="bottom-nav">
          <Link to="/" className="nav-item">
            <span className="icon">🏠</span>
            <span className="bn">হোম</span>
            <span className="en">Home</span>
          </Link>
          <Link to="/calculator" className="nav-item">
            <span className="icon">🧮</span>
            <span className="bn">হিসাব</span>
            <span className="en">Calc</span>
          </Link>
          <Link to="/pests" className="nav-item">
            <span className="icon">🐛</span>
            <span className="bn">পোকা</span>
            <span className="en">Pests</span>
          </Link>
          <Link to="/calendar" className="nav-item">
            <span className="icon">📅</span>
            <span className="bn">পঞ্জিকা</span>
            <span className="en">Cal</span>
          </Link>
          <Link to="/glossary" className="nav-item">
            <span className="icon">📖</span>
            <span className="bn">শব্দকোষ</span>
            <span className="en">Gloss</span>
          </Link>
        </nav>
      </div>
    </BrowserRouter>
  );
}
