import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Lojas } from './components/Lojas';
import { Motoboys } from './components/Motoboys';
import { Jornadas } from './components/Jornadas';
import { Adiantamentos } from './components/Adiantamentos';
import { Colaboradores } from './components/Colaboradores';

function AppContent() {
  const { isAuthenticated } = useApp();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'lojas':
        return <Lojas />;
      case 'motoboys':
        return <Motoboys />;
      case 'jornadas':
        return <Jornadas />;
      case 'adiantamentos':
        return <Adiantamentos />;
      case 'colaboradores':
        return <Colaboradores />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;