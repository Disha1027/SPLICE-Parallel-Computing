import React from 'react';
import { EngineProvider, useEngine } from './context/EngineContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CompactionRunnerView } from './components/CompactionRunnerView';
import { PerformanceAnalyticsView } from './components/PerformanceAnalyticsView';
import { SystemLogsView } from './components/SystemLogsView';

const MainLayout: React.FC = () => {
  const { activeSection } = useEngine();

  const renderSection = () => {
    switch (activeSection) {
      case 'runner':
        return <CompactionRunnerView />;
      case 'analytics':
        return <PerformanceAnalyticsView />;
      case 'logs':
        return <SystemLogsView />;
      default:
        return <CompactionRunnerView />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <EngineProvider>
      <MainLayout />
    </EngineProvider>
  );
};

export default App;
