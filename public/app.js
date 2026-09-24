document.addEventListener('DOMContentLoaded', () => {

  const FILLOUT_PAGOS_URL = "https://forms.fillout.com/t/tu-formulario-de-pagos";

  let clientaActual = null;

  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('loginForm');
  const userInput = document.getElementById('userInput');
  const clientNameDisplay = document.getElementById('clientNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  // 1. LOGIN
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = userInput.value.trim();

    if (query) {
      clientaActual = query;
      clientNameDisplay.textContent = clientaActual;

      loginScreen.classList.add('hidden');
      dashboardScreen.classList.remove('hidden');

      cargarPedidosDesdeNotion(clientaActual);
    }
  });

  logoutBtn.addEventListener('click', () => {
    clientaActual = null;
    userInput.value = '';
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  });

  // 2. REGISTRAR PAGO
  document.querySelectorAll('.btn-trigger-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      const urlConParametro = `${FILLOUT_PAGOS_URL}?nombre=${encodeURIComponent(clientaActual)}`;
      window.open(urlConParametro, '_blank');
    });
  });

  // 3. NAVEGACIÓN
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function cambiarPestana(tabId) {
    navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => cambiarPestana(btn.dataset.tab));
  });

  const goPedidosBtn = document.querySelector('.link-go-pedidos');
  if (goPedidosBtn) {
    goPedidosBtn.addEventListener('click', () => cambiarPestana('tab-pedidos'));
  }

  // 4. LECTURA Y RENDERIZADO DE PEDIDOS DESDE NOTION
  async function cargarPedidosDesdeNotion(nombreClienta) {
    const container = document.getElementById('gridPedidosContainer');
    container.innerHTML = '<p class="loading-text">Buscando tus pedidos en Notion...</p>';

    try {
      const res = await fetch(`/api/get-orders?cliente=${encodeURIComponent(nombreClienta)}`);
      const data = await res.json();

      if (!data.success || !data.orders || data.orders.length === 0) {
        container.innerHTML = '<p>No se encontraron pedidos registrados a este nombre.</p>';
        actualizarMetricas([]);
        return;
      }

      const orders = data.orders;

      actualizarMetricas(orders);

      container.innerHTML = '';
      orders.forEach(item => {
        const estadoSlug = item.estado.toLowerCase().includes('bodega') ? 'bodega' : 'transito';
        
        // Imagen desde la columna 'Foto' o placeholder limpio
        const imagenUrl = item.foto || 'https://via.placeholder.com/300x200/F4EFFD/8B62F6?text=Sin+Imagen';

        container.innerHTML += `
          <div class="card-pedido" data-estado="${estadoSlug}" data-pendiente="${item.restante > 0}">
            <div class="card-img-wrap">
              <span class="card-badge">${item.estado}</span>
              <img src="${imagenUrl}" alt="${item.articulo}" loading="lazy">
            </div>
            <div class="card-content">
              <h3>${item.articulo}</h3>
              
              <!-- Precio Unitario y Estatus colocados arriba -->
              <div class="precio-estatus-row" style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0;">
                <span style="font-size: 0.82rem; color: #666;">Precio: <strong style="color: #333;">$${item.precio} MXN</strong></span>
                <span style="font-size: 0.75rem; background: #eeeaf8; color: #6b46c1; padding: 2px 8px; border-radius: 8px; font-weight: 600;">${item.estado}</span>
              </div>

              <p class="meta-info" style="margin-bottom: 10px;">Cant: ${item.cantidad} · Tipo de pago: ${item.tipoPago}</p>
              
              <div class="fin-box">
                <div>
                  <span class="fin-title">ABONADO</span>
                  <span class="fin-amount">$${item.abonos} MXN</span>
                </div>
                <div>
                  <span class="fin-title">RESTANTE</span>
                  <span class="fin-amount ${item.restante > 0 ? 'text-blue' : 'text-green'}">$${item.restante} MXN</span>
                </div>
              </div>

              <!-- FdV Facilidades y Restante desglosado abajo -->
              <div class="logistics-row">
                <span>Vence Facilidades:</span>
                <strong>${item.fdvFacilidades}</strong>
              </div>

              <div class="card-footer-info">
                <span class="due-date">Lote/Claim: ${item.pedidoClaim}</span>
                <a href="#" class="link-detail">Ver detalles &rarr;</a>
              </div>
            </div>
          </div>
        `;
      });

      activarFiltros();

    } catch (error) {
      console.error(error);
      container.innerHTML = '<p>Ocurrió un error al consultar la base de datos.</p>';
    }
  }

  function actualizarMetricas(orders) {
    let totalRestante = 0;
    let cantidadEnBodega = 0;

    orders.forEach(o => {
      totalRestante += parseFloat(o.restante || 0);
      if (o.estado.toLowerCase().includes('bodega')) {
        cantidadEnBodega += parseInt(o.cantidad || 1);
      }
    });

    const elTotal = document.getElementById('totalPendiente');
    const elRestante = document.getElementById('restanteArticulos');
    const elLiquidar = document.getElementById('totalLiquidar');
    const elBodega = document.getElementById('cantBodega');

    if (elTotal) elTotal.textContent = `$${totalRestante.toFixed(2)} MXN`;
    if (elRestante) elRestante.textContent = `$${totalRestante.toFixed(2)} MXN`;
    if (elLiquidar) elLiquidar.textContent = `$${totalRestante.toFixed(2)} MXN`;
    if (elBodega) elBodega.textContent = cantidadEnBodega;
  }

  function activarFiltros() {
    const filtroBtns = document.querySelectorAll('.filtro-btn');
    const tarjetas = document.querySelectorAll('.card-pedido');

    filtroBtns.forEach(btn => {
      btn.onclick = () => {
        filtroBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtro = btn.dataset.filtro;

        tarjetas.forEach(card => {
          if (filtro === 'todos') {
            card.style.display = 'flex';
          } else if (filtro === 'bodega' && card.dataset.estado === 'bodega') {
            card.style.display = 'flex';
          } else if (filtro === 'transito' && card.dataset.estado === 'transito') {
            card.style.display = 'flex';
          } else if (filtro === 'pendiente' && card.dataset.pendiente === 'true') {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      };
    });
  }

});
