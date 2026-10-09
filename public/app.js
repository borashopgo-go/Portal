document.addEventListener('DOMContentLoaded', () => {

  const FILLOUT_PAGOS_URL = "https://forms.fillout.com/t/tu-formulario-de-pagos";
  let clientaActual = null;
  let pedidosGuardados = [];

  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  
  const loginBox = document.getElementById('login-box');
  const registerBox = document.getElementById('register-box');
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const showLoginBtn = document.getElementById('showLoginBtn');
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const userInput = document.getElementById('userInput');
  const passwordInput = document.getElementById('passwordInput');
  const logoutBtn = document.getElementById('logoutBtn');

  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Toggle Vistas (Tarjetas vs Tabla)
  const btnViewGrid = document.getElementById('btnViewGrid');
  const btnViewTable = document.getElementById('btnViewTable');
  const gridContainer = document.getElementById('gridPedidosContainer');
  const tableContainer = document.getElementById('tablaPedidosContainer');

  if (btnViewGrid && btnViewTable) {
    btnViewGrid.addEventListener('click', () => {
      btnViewGrid.classList.add('active');
      btnViewTable.classList.remove('active');
      if (gridContainer) gridContainer.style.display = 'grid';
      if (tableContainer) tableContainer.style.display = 'none';
    });

    btnViewTable.addEventListener('click', () => {
      btnViewTable.classList.add('active');
      btnViewGrid.classList.remove('active');
      if (tableContainer) tableContainer.style.display = 'block';
      if (gridContainer) gridContainer.style.display = 'none';
    });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  document.querySelectorAll('.link-go-pedidos').forEach(btn => {
    btn.addEventListener('click', () => {
      const btnMisPedidos = document.querySelector('.nav-btn[data-tab="tab-pedidos"]');
      if (btnMisPedidos) btnMisPedidos.click();
    });
  });

  if (showRegisterBtn && showLoginBtn) {
    showRegisterBtn.addEventListener('click', () => {
      loginBox.classList.add('hidden');
      registerBox.classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', () => {
      registerBox.classList.add('hidden');
      loginBox.classList.remove('hidden');
    });
  }

  const sesionGuardada = localStorage.getItem('borashop_user');

  if (sesionGuardada) {
    try {
      const usuarioData = JSON.parse(sesionGuardada);
      if (usuarioData && usuarioData.nombre) {
        iniciarSesionEnPantalla(usuarioData.nombre);
      }
    } catch (e) {
      localStorage.removeItem('borashop_user');
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = userInput ? userInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value.trim() : '';

      if (!usuario || !password) {
        alert('Por favor completa todos los campos');
        return;
      }

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, password })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('borashop_user', JSON.stringify(data.user));
          iniciarSesionEnPantalla(data.user.nombre);
        } else {
          alert(data.message || 'Credenciales incorrectas');
        }
      } catch (err) {
        alert('Error al conectar con el servidor.');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nombre = document.getElementById('regNameInput').value.trim();
      const correo = document.getElementById('regEmailInput').value.trim();
      const telefono = document.getElementById('regPhoneInput').value.trim();
      const password = document.getElementById('regPasswordInput').value.trim();

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, correo, telefono, password })
        });

        const data = await res.json();

        if (data.success) {
          alert('¡Registro exitoso! Bienvenida a BoraShop ⭐');
          localStorage.setItem('borashop_user', JSON.stringify(data.user));
          iniciarSesionEnPantalla(data.user.nombre);
        } else {
          alert(data.message || 'No se pudo completar el registro.');
        }
      } catch (err) {
        alert('Error de conexión con el servidor.');
      }
    });
  }

  function iniciarSesionEnPantalla(nombreClienta) {
    clientaActual = nombreClienta;
    if (loginScreen) loginScreen.classList.add('hidden');
    if (dashboardScreen) dashboardScreen.classList.remove('hidden');
    cargarPedidosDesdeNotion(clientaActual);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('borashop_user');
      clientaActual = null;
      
      if (userInput) userInput.value = '';
      if (passwordInput) passwordInput.value = '';
      
      if (dashboardScreen) dashboardScreen.classList.add('hidden');
      if (loginScreen) loginScreen.classList.remove('hidden');
    });
  }

  document.querySelectorAll('.btn-trigger-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      const urlConParametro = `${FILLOUT_PAGOS_URL}?nombre=${encodeURIComponent(clientaActual || '')}`;
      window.open(urlConParametro, '_blank');
    });
  });

  async function cargarPedidosDesdeNotion(nombreClienta) {
    if (gridContainer) {
      gridContainer.innerHTML = '<p class="loading-text">Buscando tus pedidos en Notion... 🐈‍⬛</p>';
    }
    const tablaBody = document.getElementById('tablaPedidosBody');
    if (tablaBody) {
      tablaBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Cargando tus pedidos...</td></tr>';
    }

    try {
      const res = await fetch(`/api/get-orders?cliente=${encodeURIComponent(nombreClienta)}`);
      const data = await res.json();

      if (!data.success || !data.orders || data.orders.length === 0) {
        if (gridContainer) {
          gridContainer.innerHTML = '<p style="text-align:center; padding:20px;">No se encontraron pedidos registrados a este nombre. 🍊</p>';
        }
        if (tablaBody) {
          tablaBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">No se encontraron pedidos registrados.</td></tr>';
        }
        return;
      }

      pedidosGuardados = data.orders;
      renderizarVista(pedidosGuardados);

    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      if (gridContainer) {
        gridContainer.innerHTML = '<p style="text-align:center; padding:20px;">Ocurrió un error al consultar la base de datos.</p>';
      }
    }
  }

  function renderizarVista(orders) {
    if (gridContainer) gridContainer.innerHTML = '';
    const tablaBody = document.getElementById('tablaPedidosBody');
    if (tablaBody) tablaBody.innerHTML = '';

    // Estado inicial al renderizar: Tarjetas visibles, tabla oculta
    if (gridContainer) gridContainer.style.display = 'grid';
    if (tableContainer) tableContainer.style.display = 'none';
    if (btnViewGrid && btnViewTable) {
      btnViewGrid.classList.add('active');
      btnViewTable.classList.remove('active');
    }

    let totalRestanteArticulos = 0;
    let totalEMS = 0;
    let totalCruce = 0;
    let articulosBodega = 0;

    orders.forEach(item => {
      const precioNum = parseFloat(item.precio) || 0;
      const restanteNum = parseFloat(item.restante) || 0;
      const emsNum = parseFloat(item.montoEms) || 0;
      const cruceNum = parseFloat(item.montoCruce) || 0;

      totalRestanteArticulos += restanteNum;
      totalEMS += emsNum;
      totalCruce += cruceNum;

      if (item.estado && item.estado.toLowerCase().includes('bodega')) {
        articulosBodega++;
      }

      const imagenUrl = item.foto || 'https://via.placeholder.com/220x200/FAF5FF/8B62F6?text=BoraShop+🍊';

      if (gridContainer) {
        gridContainer.innerHTML += `
          <div class="card-pedido-cute">
            <img src="${imagenUrl}" alt="${item.articulo || 'Producto'}" class="card-img-cute">
            
            <h3 class="card-title-cute">${item.articulo || 'Sin título'}</h3>
            <span class="card-claim-cute">Claim: ${item.claim || 'N/A'}</span>

            <div class="info-section-cute">
              <div class="info-grid-cute">
                <div class="info-item">
                  <span class="info-label">Precio</span>
                  <span class="info-value">$${precioNum.toFixed(2)} MXN</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Pago</span>
                  <span class="info-value">${item.pago || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Resta</span>
                  <span class="info-value">$${restanteNum.toFixed(2)} MXN</span>
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

            <div class="logistics-section-cute">
              <div class="logistics-block">
                <div class="logistics-row">
                  <span>EMS: <strong>$${emsNum.toFixed(2)}</strong></span>
                  <span>E. EMS: <strong>${item.estadoEms || 'N/A'}</strong></span>
                </div>
                <div class="logistics-sub">⏰ Venc. EMS: ${item.vencimientoEms || 'N/A'}</div>
              </div>

              <div style="border-top: 1px solid #ffe4f2; margin: 6px 0;"></div>

              <div class="logistics-block">
                <div class="logistics-row">
                  <span>Cruce: <strong>$${cruceNum.toFixed(2)}</strong></span>
                  <span>E. Cruce: <strong>${item.estadoCruce || 'N/A'}</strong></span>
                </div>
                <div class="logistics-sub">⏰ Venc. Cruce: ${item.vencimientoCruce || 'N/A'}</div>
              </div>
            </div>
          </div>
        `;
      }

      if (tablaBody) {
        tablaBody.innerHTML += `
          <tr style="border-bottom: 1px solid #f0e4ff;">
            <td style="padding: 12px;"><img src="${imagenUrl}" class="img-thumb-table"></td>
            <td style="padding: 12px;"><strong>${item.articulo || 'Sin título'}</strong></td>
            <td style="padding: 12px;">${item.claim || 'N/A'}</td>
            <td style="padding: 12px;">$${precioNum.toFixed(2)}</td>
            <td style="padding: 12px; color:${restanteNum > 0 ? '#0284c7' : '#10b981'}; font-weight:bold;">$${restanteNum.toFixed(2)}</td>
            <td style="padding: 12px;">${item.pago || 'N/A'}</td>
            <td style="padding: 12px;">${item.estado || 'En proceso'}</td>
            <td style="padding: 12px; font-size: 0.82rem;">
              EMS: $${emsNum.toFixed(2)} (${item.estadoEms || 'N/A'})<br>
              Cruce: $${cruceNum.toFixed(2)} (${item.estadoCruce || 'N/A'})
            </td>
          </tr>
        `;
      }
    });

    const totalGlobalPendiente = totalRestanteArticulos + totalEMS + totalCruce;

    const elemTotalPendiente = document.getElementById('totalPendiente');
    const elemTotalLiquidar = document.getElementById('totalLiquidar');
    const elemCantBodega = document.getElementById('cantBodega');

    if (elemTotalPendiente) elemTotalPendiente.textContent = `$${totalGlobalPendiente.toFixed(2)} MXN`;
    if (elemTotalLiquidar) elemTotalLiquidar.textContent = `$${(totalEMS + totalCruce).toFixed(2)} MXN`;
    if (elemCantBodega) elemCantBodega.textContent = articulosBodega;
  }

});
