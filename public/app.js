let currentOrders = [];

async function cargarPortal() {
  const cliente = document.getElementById('userInput').value.trim();
  if (!cliente) return alert('Por favor ingresa tu nombre.');

  try {
    const res = await fetch(`/api/get-orders?cliente=${encodeURIComponent(cliente)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    if (data.orders.length === 0) {
      return alert('No encontramos ningún pedido registrado con ese nombre.');
    }

    currentOrders = data.orders;
    
    actualizarMetricas();
    renderOrders();
    
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('portalContent').style.display = 'block';
  } catch (err) {
    alert('Error al cargar datos: ' + err.message);
  }
}

function actualizarMetricas() {
  let totalRestante = 0;
  let totalAbonado = 0;
  let totalArticulos = 0;

  currentOrders.forEach(order => {
    totalRestante += (order.restante || 0);
    totalAbonado += (order.abonos || 0);
    totalArticulos += (order.cantidad || 1);
  });

  document.getElementById('metricSaldoGlobal').innerText = `$${totalRestante.toLocaleString('es-MX')} MXN`;
  document.getElementById('metricRestante').innerText = `$${totalAbonado.toLocaleString('es-MX')} MXN`;
  document.getElementById('metricTotalLiquidar').innerText = `$${totalRestante.toLocaleString('es-MX')} MXN`;
  document.getElementById('metricBodegaCount').innerText = totalArticulos;
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(tabId).style.display = 'block';
  event.target.classList.add('active');
}

function renderOrders() {
  const container = document.getElementById('ordersList');
  
  container.innerHTML = currentOrders.map(item => `
    <div class="card order-card" style="border-left: 5px solid var(--primary-purple);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span class="badge-live" style="background:#E8E3F5; color:var(--primary-purple-dark);">
          📌 ${item.pedidoClaim}
        </span>
        <span class="badge-live">${item.tipoPago}</span>
      </div>

      <h3 style="font-size:1.2rem; color:var(--primary-purple-dark); margin-bottom:8px;">
        ${item.articulo} ${item.cantidad > 1 ? `(x${item.cantidad})` : ''}
      </h3>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:12px; font-size:0.9rem;">
        <div><strong>Precio total:</strong> $${item.precio} MXN</div>
        <div><strong>Abonos:</strong> $${item.abonos} MXN</div>
        <div style="grid-column: span 2; color: #D90429; font-weight: bold; font-size: 1rem; margin-top: 4px;">
          Saldo Restante: $${item.restante} MXN
        </div>
      </div>
    </div>
  `).join('');
}
