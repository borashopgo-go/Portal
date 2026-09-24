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
    
    // Calcular y llenar métricas del Resumen estilo Glide
    actualizarMetricas();
    
    renderOrders();
    renderShippingCalculator();
    
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('portalContent').style.display = 'block';
  } catch (err) {
    alert('Error al cargar datos: ' + err.message);
  }
}

function actualizarMetricas() {
  let restante = 0;
  let extras = 0;
  let bodega = 0;

  currentOrders.forEach(order => {
    restante += (order.saldoPendiente || 0);
    extras += (order.cargoEMS || 0) + (order.cargoAduana || 0);
    if (order.disponibleEnvio) bodega++;
  });

  const global = restante + extras;

  document.getElementById('metricSaldoGlobal').innerText = `$${global.toLocaleString('es-MX')}`;
  document.getElementById('metricRestante').innerText = `$${restante.toLocaleString('es-MX')}`;
  document.getElementById('metricTotalLiquidar').innerText = `$${extras.toLocaleString('es-MX')}`;
  document.getElementById('metricBodegaCount').innerText = bodega;
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
    <div class="card order-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <input type="checkbox" class="multi-select-cb" value="${item.id}">
        <span class="badge-live">${item.estatus}</span>
      </div>
      <h3 style="font-size:1.1rem; color:var(--primary-purple-dark); margin-bottom:8px;">${item.producto}</h3>
      <p style="font-size:0.9rem; color:var(--text-muted);">Saldo pendiente: <strong>$${item.saldoPendiente} MXN</strong></p>
      <p style="font-size:0.9rem; color:var(--text-muted);">Cargos EMS/Aduana: <strong>$${(item.cargoEMS || 0) + (item.cargoAduana || 0)} MXN</strong></p>
    </div>
  `).join('');
}

function renderShippingCalculator() {
  const container = document.getElementById('shippingList');
  const availableItems = currentOrders.filter(i => i.disponibleEnvio);

  if (availableItems.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);">No tienes artículos disponibles en bodega actualmente.</p>';
    return;
  }

  container.innerHTML = availableItems.map(item => `
    <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
      <label style="display:flex; gap:10px; align-items:center;">
        <input type="checkbox" class="weight-cb" value="${item.id}">
        <span><strong>${item.producto}</strong> (${item.pesoGramos || 0}g)</span>
      </label>
    </div>
  `).join('');
}
