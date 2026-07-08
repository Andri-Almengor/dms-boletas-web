import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Sidebar } from './Sidebar.jsx';

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Header />
        <section className="page-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
