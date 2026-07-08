import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('DMS ErrorBoundary:', error, info);
  }

  reset = () => {
    localStorage.removeItem('dms_boletas_session_v2');
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-screen">
          <div className="fatal-card">
            <h1>La página tuvo un problema</h1>
            <p>
              Se evitó la pantalla en blanco. Puedes volver al login e iniciar sesión otra vez.
            </p>
            <pre>{String(this.state.error?.message || this.state.error || '')}</pre>
            <button className="btn btn-primary" onClick={this.reset}>Reiniciar aplicación</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
