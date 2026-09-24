let currentOrders = [];
let selectedItemsForPayment = [];

async function cargarPortal() {
  const cliente = document.getElementById('userInput').value.trim();
  if (!cliente) return alert('Por favor ingresa tu nombre o número de teléfono.');

  try {
    const res = await fetch(`/api/get-orders?cliente=${encodeURIComponent(cliente)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    if (data.orders.length === 0) {
      return alert('No encontramos ningún pedido registrado con ese nombre o teléfono. Revisa que esté bien escrito.');
    }

    currentOrders = data.orders;
    renderOrders();
    renderShippingCalculator();
    document.getElementById('portalContent').style.display = 'block';
  } catch (err) {
    alert('Error al cargar datos: ' + err.message);
  }
}


function renderOrders() {
  const container = document.getElementById('ordersList');
  container.innerHTML = currentOrders.map(item => `
    <div class="order-card card">
      <div class="card-header">
        <input type="checkbox" class="multi-select-cb" value="${item.id}">
        <h4>${item.producto}</h4>
      </div>
      <p><strong>Estatus:</strong> <span class="badge">${item.estatus}</span></p>
      <p><strong>Saldo Pendiente:</strong> $${item.saldoPendiente} MXN</p>
      <p><strong>Cargo EMS:</strong> $${item.cargoEMS} MXN</p>
      <p><strong>Cargo Aduana:</strong> $${item.cargoAduana} MXN</p>
    </div>
  `).join('');
}

function renderShippingCalculator() {
  const container = document.getElementById('shippingList');
  const availableItems = currentOrders.filter(i => i.disponibleEnvio);

  if (availableItems.length === 0) {
    container.innerHTML = '<p>No tienes artículos disponibles para envío por el momento.</p>';
    return;
  }

  container.innerHTML = availableItems.map(item => `
    <div class="shipping-card card">
      <label>
        <input type="checkbox" class="weight-cb" data-weight="${item.pesoGramos || 0}" value="${item.id}" onchange="calcularPesoTotal()">
        <strong>${item.producto}</strong> - Peso: ${item.pesoGramos || 0}g
      </label>
    </div>
  `).join('');
}

function calcularPesoTotal() {
  const checkboxes = document.querySelectorAll('.weight-cb:checked');
  let totalGramos = 0;
  
  checkboxes.forEach(cb => {
    totalGramos += parseFloat(cb.dataset.weight || 0);
  });

  document.getElementById('selectedCount').innerText = checkboxes.length;
  document.getElementById('totalWeight').innerText = `${totalGramos} g`;
  document.getElementById('totalKg').innerText = `${(totalGramos / 1000).toFixed(2)} kg`;
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  event.target.classList.add('active');
}

function abrirModalPagoMultiples() {
  const selectedCbs = document.querySelectorAll('.multi-select-cb:checked');
  if (selectedCbs.length === 0) {
    return alert('Por favor selecciona al menos un artículo marcando la casilla.');
  }
  
  selectedItemsForPayment = Array.from(selectedCbs).map(cb => cb.value);
  document.getElementById('selectedItemsNotice').innerText = `Aplicando pago para ${selectedItemsForPayment.length} artículo(s).`;
  document.getElementById('paymentModal').style.display = 'block';
}

function cerrarModal() {
  document.getElementById('paymentModal').style.display = 'none';
}
