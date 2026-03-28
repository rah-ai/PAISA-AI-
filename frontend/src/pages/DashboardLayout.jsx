import React, { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { usePortfolio } from '../context/PortfolioContext';
import { CurtainReveal, ElasticSpring } from '../components/Animations';

function EmptyState() {
  const { uploadPortfolio, loadSampleData, isLoading } = usePortfolio();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) await uploadPortfolio(file);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full text-center">
        <CurtainReveal>
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full" style={{ background: 'rgba(201,168,76,0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        </CurtainReveal>
        <CurtainReveal delay={0.1}>
          <h2 className="font-serif-display mb-2" style={{ fontSize: 28, color: 'var(--text-primary)' }}>Upload your CAS</h2>
        </CurtainReveal>
        <CurtainReveal delay={0.2}>
          <p className="font-sans mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Upload your Consolidated Account Statement (CAS) PDF to generate deep portfolio intelligence and AI predictions.
          </p>
        </CurtainReveal>

        <ElasticSpring delay={0.3}>
          <div className="flex flex-col gap-4">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.csv" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="btn-gold w-full justify-center" style={{ padding: '14px 20px', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Analyzing Document...' : 'Upload CAS Document'}
            </button>
            <button 
              onClick={loadSampleData}
              disabled={isLoading}
              className="font-mono text-xs w-full py-3 hover:text-white transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Or load demo portfolio
            </button>
          </div>
        </ElasticSpring>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const location = useLocation();
  const { portfolioData } = usePortfolio();

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)', transition: 'background 0.3s ease' }}>
      <Sidebar />
      <main style={{ marginLeft: 240, padding: 32, minHeight: '100vh', width: 'calc(100% - 240px)' }}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {portfolioData ? <Outlet /> : <EmptyState />}
        </motion.div>
      </main>
    </div>
  );
}
