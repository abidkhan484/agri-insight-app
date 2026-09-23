import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Calculator from './pages/Calculator';
import PestGallery from './pages/PestGallery';
import Calendar from './pages/Calendar';
import Glossary from './pages/Glossary';
import './App.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="main-header">
        <h1>ZBNF <span className="bn">কৃষি জ্ঞানভাণ্ডার</span></h1>
      </header>
      
      <main className="content">
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
