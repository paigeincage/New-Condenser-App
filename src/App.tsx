import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toast } from './components/layout/Toast';
import { BottomNav } from './components/layout/BottomNav';

import { Home } from './pages/Home';
import { NewProject } from './pages/NewProject';
import { Project } from './pages/Project';
import { Intake } from './pages/Intake';
import { Contacts } from './pages/Contacts';
import { Settings } from './pages/Settings';

function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <main className="pb-24">
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewProject />} />
            <Route path="/project/:id" element={<Project />} />
            <Route path="/project/:id/intake" element={<Intake />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </main>
      <BottomNav />
    </BrowserRouter>
  );
}
