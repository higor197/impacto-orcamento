import { useEffect, useMemo, useState } from 'react';

type Client = {
  id: string;
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
};

type Material = {
  id: string;
  code: string;
  name: string;
  category: string;
  purchaseUnit: string;
  consumptionUnit: string;
  packageContent: number;
  purchasePrice: number;
};

type QuoteRecord = {
  id: string;
  clientId: string;
  projectName: string;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
};

const initialClient = { name: '', cpfCnpj: '', phone: '', whatsapp: '', email: '', address: '', city: '', state: '', observations: '' };
const initialMaterial = { code: '', name: '', category: '', purchaseUnit: 'unidade', consumptionUnit: 'unidade', packageContent: 1, purchasePrice: 0, supplier: '', brand: '', model: '', color: '', finish: '', thickness: '', observations: '' };

const initialQuoteItem = { name: 'Móvel', environment: 'Cozinha', width: 2.4, height: 2.7, depth: 0.6, quantity: 1, pricePerSqm: 1200, method: 'Metro quadrado', unit: 'm', observations: '' };

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'materials' | 'quotes' | 'pricing'>('dashboard');
  const [clientForm, setClientForm] = useState(initialClient);
  const [materialForm, setMaterialForm] = useState(initialMaterial);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [projectName, setProjectName] = useState('Projeto 001');
  const [quoteItems, setQuoteItems] = useState([initialQuoteItem]);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState('Em elaboração');
  const [paymentMethod, setPaymentMethod] = useState('Pix');

  const loadData = async () => {
    try {
      const [clientRes, materialRes, quoteRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/materials'),
        fetch('/api/quotes'),
      ]);

      const clientData = await clientRes.json();
      const materialData = await materialRes.json();
      const quoteData = await quoteRes.json();
      setClients(clientData);
      setMaterials(materialData);
      setQuotes(quoteData);
      if (clientData[0]) setSelectedClientId(clientData[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const dashboardSummary = useMemo(() => {
    const subtotal = quotes.reduce((sum, quote) => sum + Number(quote.total ?? 0), 0);
    const approved = quotes.filter((quote) => quote.status === 'Aprovado').length;
    const drafting = quotes.filter((quote) => quote.status === 'Em elaboração' || quote.status === 'Rascunho').length;
    const waiting = quotes.filter((quote) => quote.status === 'Aguardando aprovação').length;

    return {
      total: subtotal,
      approved,
      drafting,
      waiting,
      count: quotes.length,
    };
  }, [quotes]);

  const subtotalCalculated = useMemo(
    () => quoteItems.reduce((sum, item) => sum + Number(((Number(item.width) * Number(item.height) * Number(item.pricePerSqm) * Number(item.quantity)) || 0)), 0),
    [quoteItems],
  );

  const totalWithDiscount = Math.max(subtotalCalculated - discount, 0);

  const handleClientSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientForm),
    });

    if (response.ok) {
      setClientForm(initialClient);
      await loadData();
    }
  };

  const handleMaterialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materialForm),
    });

    if (response.ok) {
      setMaterialForm(initialMaterial);
      await loadData();
    }
  };

  const handleQuoteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      clientId: selectedClientId,
      projectName,
      status,
      paymentMethod,
      pricingMethod: 'Metro quadrado',
      subtotal: subtotalCalculated,
      discount,
      items: quoteItems.map((item) => ({
        ...item,
        width: Number(item.width),
        height: Number(item.height),
        quantity: Number(item.quantity),
        pricePerSqm: Number(item.pricePerSqm),
      })),
    };

    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await loadData();
      setActiveTab('quotes');
    }
  };

  const lineItems = quoteItems.map((item, index) => (
    <div key={index} className="row-grid">
      <input value={item.name} onChange={(e) => setQuoteItems((current) => current.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)))} />
      <input value={item.environment} onChange={(e) => setQuoteItems((current) => current.map((row, i) => (i === index ? { ...row, environment: e.target.value } : row)))} />
      <input type="number" value={item.width} onChange={(e) => setQuoteItems((current) => current.map((row, i) => (i === index ? { ...row, width: Number(e.target.value) } : row)))} />
      <input type="number" value={item.height} onChange={(e) => setQuoteItems((current) => current.map((row, i) => (i === index ? { ...row, height: Number(e.target.value) } : row)))} />
      <input type="number" value={item.quantity} onChange={(e) => setQuoteItems((current) => current.map((row, i) => (i === index ? { ...row, quantity: Number(e.target.value) } : row)))} />
      <input type="number" value={item.pricePerSqm} onChange={(e) => setQuoteItems((current) => current.map((row, i) => (i === index ? { ...row, pricePerSqm: Number(e.target.value) } : row)))} />
    </div>
  ));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">IO</div>
          <div>
            <strong>IMPACTO</strong>
            <span>ORÇAMENTO</span>
          </div>
        </div>

        <nav>
          {['dashboard', 'clients', 'materials', 'quotes', 'pricing'].map((tab) => (
            <button key={tab} className={activeTab === tab ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab(tab as any)}>
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'clients' && 'Clientes'}
              {tab === 'materials' && 'Materiais'}
              {tab === 'quotes' && 'Orçamentos'}
              {tab === 'pricing' && 'Precificação'}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        {activeTab === 'dashboard' && (
          <section>
            <h1>Dashboard</h1>
            <div className="stats-grid">
              <div className="card stat-card"><span>Em elaboração</span><strong>{dashboardSummary.drafting}</strong></div>
              <div className="card stat-card"><span>Aguardando resposta</span><strong>{dashboardSummary.waiting}</strong></div>
              <div className="card stat-card"><span>Aprovados</span><strong>{dashboardSummary.approved}</strong></div>
              <div className="card stat-card"><span>Projetos</span><strong>{dashboardSummary.count}</strong></div>
              <div className="card stat-card"><span>Valor total</span><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardSummary.total)}</strong></div>
            </div>
          </section>
        )}

        {activeTab === 'clients' && (
          <section>
            <h1>Clientes</h1>
            <form className="panel-form" onSubmit={handleClientSubmit}>
              <div className="two-columns">
                <input placeholder="Nome" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
                <input placeholder="CPF/CNPJ" value={clientForm.cpfCnpj} onChange={(e) => setClientForm({ ...clientForm, cpfCnpj: e.target.value })} />
                <input placeholder="Telefone" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
                <input placeholder="WhatsApp" value={clientForm.whatsapp} onChange={(e) => setClientForm({ ...clientForm, whatsapp: e.target.value })} />
                <input placeholder="E-mail" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
                <input placeholder="Cidade" value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} />
                <input placeholder="Estado" value={clientForm.state} onChange={(e) => setClientForm({ ...clientForm, state: e.target.value })} />
                <input placeholder="Endereço" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} />
              </div>
              <textarea placeholder="Observações" value={clientForm.observations} onChange={(e) => setClientForm({ ...clientForm, observations: e.target.value })} />
              <button type="submit">Salvar cliente</button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Cidade</th></tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>{client.name}</td>
                      <td>{client.phone}</td>
                      <td>{client.email}</td>
                      <td>{client.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'materials' && (
          <section>
            <h1>Materiais</h1>
            <form className="panel-form" onSubmit={handleMaterialSubmit}>
              <div className="two-columns">
                <input placeholder="Código" value={materialForm.code} onChange={(e) => setMaterialForm({ ...materialForm, code: e.target.value })} />
                <input placeholder="Nome" value={materialForm.name} onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })} />
                <input placeholder="Categoria" value={materialForm.category} onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })} />
                <input placeholder="Fabricante" value={materialForm.brand} onChange={(e) => setMaterialForm({ ...materialForm, brand: e.target.value })} />
                <input placeholder="Modelo" value={materialForm.model} onChange={(e) => setMaterialForm({ ...materialForm, model: e.target.value })} />
                <input placeholder="Cor" value={materialForm.color} onChange={(e) => setMaterialForm({ ...materialForm, color: e.target.value })} />
                <input placeholder="Espessura" value={materialForm.thickness} onChange={(e) => setMaterialForm({ ...materialForm, thickness: e.target.value })} />
                <input placeholder="Unidade de compra" value={materialForm.purchaseUnit} onChange={(e) => setMaterialForm({ ...materialForm, purchaseUnit: e.target.value })} />
                <input placeholder="Unidade de consumo" value={materialForm.consumptionUnit} onChange={(e) => setMaterialForm({ ...materialForm, consumptionUnit: e.target.value })} />
                <input type="number" placeholder="Conteúdo da embalagem" value={materialForm.packageContent} onChange={(e) => setMaterialForm({ ...materialForm, packageContent: Number(e.target.value) })} />
                <input type="number" placeholder="Preço de compra" value={materialForm.purchasePrice} onChange={(e) => setMaterialForm({ ...materialForm, purchasePrice: Number(e.target.value) })} />
              </div>
              <textarea placeholder="Observações" value={materialForm.observations} onChange={(e) => setMaterialForm({ ...materialForm, observations: e.target.value })} />
              <button type="submit">Salvar material</button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Código</th><th>Nome</th><th>Categoria</th><th>Compra</th><th>Preço</th></tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td>{material.code}</td>
                      <td>{material.name}</td>
                      <td>{material.category}</td>
                      <td>{material.purchaseUnit}</td>
                      <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(material.purchasePrice ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'quotes' && (
          <section>
            <h1>Novo orçamento</h1>
            <form className="panel-form" onSubmit={handleQuoteSubmit}>
              <div className="two-columns">
                <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                  <option value="">Selecione o cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <input placeholder="Nome do projeto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Em elaboração">Em elaboração</option>
                  <option value="Aguardando aprovação">Aguardando aprovação</option>
                  <option value="Aprovado">Aprovado</option>
                </select>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Pix">Pix</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="quote-editor">
                <div className="quote-header">
                  <h3>Itens do orçamento</h3>
                  <button type="button" onClick={() => setQuoteItems((current) => [...current, { ...initialQuoteItem }])}>Adicionar item</button>
                </div>
                {lineItems}
              </div>

              <div className="pricing-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotalCalculated)}</strong>
                </div>
                <div>
                  <span>Desconto</span>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </div>
                <div>
                  <span>Total</span>
                  <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalWithDiscount)}</strong>
                </div>
              </div>

              <button type="submit">Salvar orçamento</button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Projeto</th><th>Cliente</th><th>Status</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => {
                    const client = clients.find((item) => item.id === quote.clientId);
                    return (
                      <tr key={quote.id}>
                        <td>{quote.projectName}</td>
                        <td>{client?.name ?? 'Cliente'}</td>
                        <td>{quote.status}</td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(quote.total || 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'pricing' && (
          <section>
            <h1>Precificação e pagamentos</h1>
            <div className="card-box">
              <h3>Simulação de taxa de cartão</h3>
              <div className="two-columns compact">
                <input placeholder="Valor líquido desejado" type="number" defaultValue={10000} />
                <input placeholder="Taxa %" type="number" defaultValue={10} />
              </div>
              <button type="button" onClick={async () => {
                const amount = 10000;
                const feePercent = 10;
                const response = await fetch('/api/simulate-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ amount, feePercent, desiredNet: 10000, fixedFee: 0 }),
                });
                const data = await response.json();
                alert(`Valor bruto estimado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.gross)}`);
              }}>Simular</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
