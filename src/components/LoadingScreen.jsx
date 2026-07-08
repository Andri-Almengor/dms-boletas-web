export default function LoadingScreen({ text = 'Cargando...' }) {
  return <div className="loading-screen"><div className="spinner" /> <p>{text}</p></div>;
}
