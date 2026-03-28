import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout() {
  const location = useLocation();

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
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
