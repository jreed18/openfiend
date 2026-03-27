import Chat from './components/Chat';

export default function App() {
  return (
    <div className="min-h-screen" style={{
      backgroundColor: 'var(--bg)',
      color: 'var(--text-primary)',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 80% 10%, rgba(167,139,218,0.05), transparent)',
    }}>
      <Chat />
    </div>
  );
}
