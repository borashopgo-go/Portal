document.addEventListener('DOMContentLoaded', () => {

  const FILLOUT_PAGOS_URL = "https://forms.fillout.com/t/tu-formulario-de-pagos";
  let clientaActual = null;
  let pedidosGuardados = [];

  // Elementos del DOM
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('loginForm');
  const userInput = document.getElementById('userInput');
  const clientNameDisplay = document.getElementById('clientNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  // Navegación de Pestañas (Inicio, Mis pedidos, Envíos)
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Toggle Vistas (Tarjetas vs Tabla)
  const btnViewGrid = document.getElementById('btnViewGrid');
  const btnViewTable = document.getElementById('btnViewTable');
  const gridContainer = document.getElementById('gridPedidosContainer');
  const tableContainer = document.getElementById('tablaPedidosContainer');

  // ----------------------------------------------------
  // 1. MANEJO DE NAVEGACIÓN ENTRE PESTAÑAS
  // ----------------------------------------------------
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Cambiar botón activo
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Cambiar sección visible
      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // Botón rápido en la pantalla de Inicio para saltar a "Mis pedidos"
  document.querySelectorAll('.link-go-pedidos').forEach(btn => {
    btn.addEventListener('click', () => {
      const btnMisPedidos = document.querySelector('.nav-btn[data-tab="tab-pedidos"]');
      if (btnMisPedidos) btnMisPedidos.click();
    });
  });

  // ----------------------------------------------------
  // 2. INICIAR SESIÓN / BUSCAR CLIENTA
  // ----------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = userInput.value.trim();

      if (query) {
        clientaActual = query;
        if (clientNameDisplay) clientNameDisplay.textContent = clientaActual;

        // Cambiar de pantalla
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');

        // Cargar pedidos desde Notion
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

  // ----------------------------------------------------
  // 3. CAMBIO DE VISTA (TARJETAS / TABLA)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 4. REGISTRAR PAGO Y ENVIOS (Fillout)
  // ----------------------------------------------------
  document.querySelectorAll('.btn-trigger-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      const urlConParametro = `${FILLOUT_PAGOS_URL}?nombre=${encodeURIComponent(clientaActual)}`;
      window.open(urlConParametro, '_blank');
    });
  });

  // ----------------------------------------------------
  // 5. CONSULTA DE PEDIDOS A NOTION
  // ----------------------------------------------------
  async function cargarPedidosDesdeNotion(nombreClienta) {
    gridContainer.innerHTML = '<p class="loading-text">Buscando tus pedidos en Notion... 🐈‍⬛</p>';

    try {
      const res = await fetch(`/api/get-orders?cliente=${encodeURIComponent(nombreClienta)}`);
      const data = await res.json();

      if (!data.success || !data.orders || data.orders.length === 0) {
        gridContainer.innerHTML = '<p style="text-align:center; padding:20px;">No se encontraron pedidos registrados a este nombre. 🍊</p>';
        return;
      }

      pedidosGuardados = data.orders;
      renderizarVista(pedidosGuardados);

    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      gridContainer.innerHTML = '<p style="text-align:center; padding:20px;">Ocurrió un error al consultar la base de datos.</p>';
    }
  }

  // ----------------------------------------------------
  // 6. RENDERIZADO DE TARJETAS, TABLA Y RESUMEN
  // ----------------------------------------------------
  function renderizarVista(orders) {
    gridContainer.innerHTML = '';
    const tablaBody = document.getElementById('tablaPedidosBody');
    if (tablaBody) tablaBody.innerHTML = '';

    let totalRestaArticulos = 0;
    let cantBodega = 0;

    orders.forEach(item => {
      const imagenUrl = item.foto || 'https://via.placeholder.com/220x200/FAF5FF/8B62F6?text=BoraShop+🍊';
      const precioNum = Number(item.precio) || 0;
      const restaNum = Number(item.restante) || 0;

      totalRestaArticulos += restaNum;
      if (item.estado && item.estado.toLowerCase().includes('bodega')) {
        cantBodega++;
      }

      // --- DIBUJAR TARJETA CUTE ---
      gridContainer.innerHTML += `
        <div class="card-pedido-cute">
          <img src="${imagenUrl}" alt="${item.articulo || 'Producto'}" class="card-img-cute">
          
          <h3 class="card-title-cute">${item.articulo || 'Sin título'}</h3>
          <span class="card-claim-cute">Claim: ${item.claim || 'N/A'}</span>

          <!-- Bloque 1: Detalles de Precio y Estado -->
          <div class="info-section-cute">
            <div class="info-grid-cute">
              <div class="info-item">
                <span class="info-label">Precio</span>
                <span class="info-value">$${precioNum} MXN</span>
              </div>
              <div class="info-item">
                <span class="info-label">Pago</span>
                <span class="info-value">${item.tipoPago || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Resta</span>
                <span class="info-value ${restaNum > 0 ? 'highlight-blue' : 'highlight-green'}">$${restaNum} MXN</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado</span>
                <span class="info-value">${item.estado || 'En proceso'}</span>
              </div>
            </div>
            <div class="vencimiento-badge">
              📅 Venc. facilidades: ${item.fdvFacilidades || 'N/A'}
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- Bloque 2: EMS y Cruce -->
          <div class="logistics-section-cute">
            <div class="logistics-block">
              <div class="logistics-row">
                <span>EMS: <strong>$${item.ems || 0}</strong></span>
                <span>E. EMS: <strong>${item.eEms || 'N/A'}</strong></span>
              </div>
              <div class="logistics-sub">⏰ Venc. EMS: ${item.fdvEms || 'N/A'}</div>
            </div>

            <div style="border-top: 1px solid #ffe4f2; margin: 6px 0;"></div>

            <div class="logistics-block">
              <div class="logistics-row">
                <span>Cruce: <strong>$${item.cruce || 0}</strong></span>
                <span>E. Cruce: <strong>${item.eCruce || 'N/A'}</strong></span>
              </div>
              <div class="logistics-sub">⏰ Venc. Cruce: ${item.fdvCruce || 'N/A'}</div>
            </div>
          </div>
        </div>
      `;

      // --- DIBUJAR FILA EN TABLA ---
      if (tablaBody) {
        tablaBody.innerHTML += `
          <tr>
            <td><img src="${imagenUrl}" class="img-thumb-table"></td>
            <td><strong>${item.articulo || 'Sin título'}</strong></td>
            <td>${item.claim || 'N/A'}</td>
            <td>$${precioNum}</td>
            <td style="color:${restaNum > 0 ? '#0284c7' : '#10b981'}; font-weight:bold;">$${restaNum}</td>
            <td>${item.tipoPago || 'N/A'}</td>
            <td>${item.estado || 'En proceso'}</td>
            <td>EMS: $${item.ems || 0}<br>Cruce: $${item.cruce || 0}</td>
          </tr>
        `;
      }
    });

    // --- ACTUALIZAR MÉTRICAS DE INICIO ---
    const elemRestante = document.getElementById('restanteArticulos');
    const elemBodega = document.getElementById('cantBodega');
    const elemTotalPendiente = document.getElementById('totalPendiente');
    const elemTotalLiquidar = document.getElementById('totalLiquidar');

    if (elemRestante) elemRestante.textContent = `$${totalRestaArticulos.toFixed(2)} MXN`;
    if (elemBodega) elemBodega.textContent = cantBodega;
    if (elemTotalPendiente) elemTotalPendiente.textContent = `$${totalRestaArticulos.toFixed(2)} MXN`;
    if (elemTotalLiquidar) elemTotalLiquidar.textContent = `$${totalRestaArticulos.toFixed(2)} MXN`;
  }

});
