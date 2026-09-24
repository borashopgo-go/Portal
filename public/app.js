document.addEventListener('DOMContentLoaded', () => {

  const FILLOUT_PAGOS_URL = "https://forms.fillout.com/t/tu-formulario-de-pagos";
  let clientaActual = null;
  let pedidosGuardados = [];

  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('loginForm');
  const userInput = document.getElementById('userInput');
  const clientNameDisplay = document.getElementById('clientNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  // Toggle vistas (Tarjetas vs Tabla)
  const btnViewGrid = document.getElementById('btnViewGrid');
  const btnViewTable = document.getElementById('btnViewTable');
  const gridContainer = document.getElementById('gridPedidosContainer');
  const tableContainer = document.getElementById('tablaPedidosContainer');

  // 1. INICIAR SESIÓN / BUSCAR CLIENTA
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = userInput.value.trim();

      if (query) {
        clientaActual = query;
        if (clientNameDisplay) clientNameDisplay.textContent = clientaActual;

        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');

        cargarPedidosDesdeNotion(clientaActual);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clientaActual = null;
      userInput.value = '';
      dashboardScreen.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    });
  }

  // 2. BOTONES VISTA TABLA / TARJETAS
  if (btnViewGrid && btnViewTable) {
    btnViewGrid.addEventListener('click', () => {
      btnViewGrid.classList.add('active');
      btnViewTable.classList.remove('active');
      gridContainer.classList.remove('hidden');
      tableContainer.classList.add('hidden');
    });

    btnViewTable.addEventListener('click', () => {
      btnViewTable.classList.add('active');
      btnViewGrid.classList.remove('active');
      tableContainer.classList.remove('hidden');
      gridContainer.classList.add('hidden');
    });
  }

  // 3. REGISTRAR PAGO (Abre Fillout)
  document.querySelectorAll('.btn-trigger-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      const urlConParametro = `${FILLOUT_PAGOS_URL}?nombre=${encodeURIComponent(clientaActual)}`;
      window.open(urlConParametro, '_blank');
    });
  });

  // 4. CONSULTA A NOTION BACKEND
  async function cargarPedidosDesdeNotion(nombreClienta) {
    gridContainer.innerHTML = '<p class="loading-text">Buscando tus pedidos en Notion... 🐈‍⬛</p>';

    try {
      const res = await fetch(`/api/get-orders?cliente=${encodeURIComponent(nombreClienta)}`);
      const data = await res.json();

      if (!data.success || !data.orders || data.orders.length === 0) {
        gridContainer.innerHTML = '<p>No se encontraron pedidos registrados a este nombre. 🍊</p>';
        return;
      }

      pedidosGuardados = data.orders;
      renderizarVista(pedidosGuardados);

    } catch (error) {
      console.error(error);
      gridContainer.innerHTML = '<p>Ocurrió un error al consultar la base de datos.</p>';
    }
  }

  // 5. AQUÍ VA EL CÓDIGO DEL PASO 2 (RENDERIZADO DE TARJETAS Y TABLA)
  function renderizarVista(orders) {
    gridContainer.innerHTML = '';
    const tablaBody = document.getElementById('tablaPedidosBody');
    if (tablaBody) tablaBody.innerHTML = '';

    orders.forEach(item => {
      const imagenUrl = item.foto || 'https://via.placeholder.com/220x200/FAF5FF/8B62F6?text=BoraShop+🍊';

      // --- DIBUJAR TARJETA CUTE (PASO 2) ---
      gridContainer.innerHTML += `
        <div class="card-pedido-cute">
          <img src="${imagenUrl}" alt="${item.articulo}" class="card-img-cute">
          
          <h3 class="card-title-cute">${item.articulo}</h3>
          <span class="card-claim-cute">Claim: ${item.claim}</span>

          <!-- Bloque 1: Precio, Pago, Resta y Estado -->
          <div class="info-section-cute">
            <div class="info-grid-cute">
              <div class="info-item">
                <span class="info-label">Precio</span>
                <span class="info-value">$${item.precio} MXN</span>
              </div>
              <div class="info-item">
                <span class="info-label">Pago</span>
                <span class="info-value">${item.tipoPago}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Resta</span>
                <span class="info-value ${item.restante > 0 ? 'highlight-blue' : 'highlight-green'}">$${item.restante} MXN</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="info-value">${item.estado}</span>
              </div>
            </div>
            <div class="vencimiento-badge">
              📅 Venc. facilidades: ${item.fdvFacilidades}
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- Bloque 2: Logística EMS y Cruce -->
          <div class="logistics-section-cute">
            <div class="logistics-block">
              <div class="logistics-row">
                <span>EMS: <strong>$${item.ems}</strong></span>
                <span>E. EMS: <strong>${item.eEms}</strong></span>
              </div>
              <div class="logistics-sub">⏰ Venc. EMS: ${item.fdvEms}</div>
            </div>

            <div style="border-top: 1px solid #ffe4f2; margin: 6px 0;"></div>

            <div class="logistics-block">
              <div class="logistics-row">
                <span>Cruce: <strong>$${item.cruce}</strong></span>
                <span>E. Cruce: <strong>${item.eCruce}</strong></span>
              </div>
              <div class="logistics-sub">⏰ Venc. Cruce: ${item.fdvCruce}</div>
            </div>
          </div>
        </div>
      `;

      // --- DIBUJAR FILA EN TABLA ---
      if (tablaBody) {
        tablaBody.innerHTML += `
          <tr>
            <td><img src="${imagenUrl}" class="img-thumb-table"></td>
            <td><strong>${item.articulo}</strong></td>
            <td>${item.claim}</td>
            <td>$${item.precio}</td>
            <td style="color:${item.restante > 0 ? '#0284c7' : '#10b981'}; font-weight:bold;">$${item.restante}</td>
            <td>${item.tipoPago}</td>
            <td><span class="badge-table">${item.estado}</span></td>
            <td>EMS: $${item.ems} (${item.eEms})<br>Cruce: $${item.cruce} (${item.eCruce})</td>
          </tr>
        `;
      }
    });
  }

});
