import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const HEALTH_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1$/, '') + '/health';

function App() {
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(HEALTH_URL || '/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth(null));

    fetch(`${API_BASE}/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`API respondeu ${res.status}`);
        return res.json();
      })
      .then((data) => setProducts(data.data || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>E-Commerce · Painel Operacional</h1>
        <span className={`status ${health ? 'status-ok' : 'status-down'}`}>
          {health ? `API online · uptime ${Math.round(health.uptime)}s` : 'API indisponível'}
        </span>
      </header>

      <main>
        <section>
          <h2>Catálogo de Produtos</h2>
          {error && <p className="error">Erro ao carregar produtos: {error}</p>}
          {!error && products.length === 0 && <p>Carregando ou nenhum produto cadastrado.</p>}
          <div className="grid">
            {products.map((product) => (
              <article key={product.id} className="card">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <strong>R$ {Number(product.price).toFixed(2)}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>Infraestrutura monitorada via Prometheus + Grafana · Deploy automatizado via GitHub Actions</p>
      </footer>
    </div>
  );
}

export default App;
