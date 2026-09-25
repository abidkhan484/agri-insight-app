import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import log from '../logger';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const { isBangla } = useLanguage();
  const plots = useLiveQuery(() => db.plots.toArray());
  const inputs = useLiveQuery(() => db.inputs.toArray());
  const harvests = useLiveQuery(() => db.harvests.toArray());

  const chartData = useMemo(() => {
    if (!plots || !inputs || !harvests) return null;

    const labels = plots.map(p => p.name);
    const costData = plots.map(p => {
      return inputs
        .filter(i => i.plotId === p.id)
        .reduce((sum, i) => sum + (i.cost || 0), 0);
    });
    const revenueData = plots.map(p => {
      return harvests
        .filter(h => h.plotId === p.id)
        .reduce((sum, h) => sum + (h.revenue || 0), 0);
    });

    return {
      labels,
      datasets: [
        {
          label: isBangla ? 'খরচ' : 'Cost',
          data: costData,
          backgroundColor: 'rgba(211, 47, 47, 0.6)',
        },
        {
          label: isBangla ? 'আয়' : 'Revenue',
          data: revenueData,
          backgroundColor: 'rgba(46, 125, 50, 0.6)',
        },
      ],
    };
  }, [plots, inputs, harvests, isBangla]);

  const exportCSV = () => {
    if (!harvests) return;
    const csv = Papa.unparse(harvests);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'harvest_records.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    log.info('CSV exported');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Krishi Record - Harvest Summary', 10, 10);
    
    let y = 20;
    harvests?.forEach((h, index) => {
      const plot = plots?.find(p => p.id === h.plotId);
      doc.text(`${index + 1}. ${h.date}: ${h.crop} - ${h.quantity} ${h.quantityUnit} (${plot?.name})`, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('krishi_report.pdf');
    log.info('PDF exported');
  };

  return (
    <div>
      <h2><LanguageText bn="রিপোর্ট এবং বিশ্লেষণ" en="Reports & analysis" /></h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={exportCSV} style={{ backgroundColor: '#1976d2', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          <LanguageText bn="CSV ডাউনলোড করুন" en="Download CSV" />
        </button>
        <button onClick={exportPDF} style={{ backgroundColor: '#f57c00', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          <LanguageText bn="PDF ডাউনলোড করুন" en="Download PDF" />
        </button>
      </div>

      <div className="chart-container">
        <h3><LanguageText bn="খরচ বনাম আয়" en="Cost vs revenue" /></h3>
        {chartData ? (
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: false }
              }
            }} 
          />
        ) : (
          <p><LanguageText bn="লোড হচ্ছে" en="Loading..." /></p>
        )}
      </div>
    </div>
  );
};

export default Reports;
