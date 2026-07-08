import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Header />
        <section className="content-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
