document.addEventListener('DOMContentLoaded', () => {

  // URL del formulario de Fillout para Abonos/Pagos
  // (Reemplaza este enlace por la URL real de tu formulario de Fillout de pagos)
  const FILLOUT_PAGOS_URL = "https://forms.fillout.com/t/tu-formulario-de-pagos";

  let clientaActual = null;

  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('loginForm');
  const userInput = document.getElementById('userInput');
  const clientNameDisplay = document.getElementById('clientNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  // 1. INICIAR SESIÓN / BUSCAR CLIENTA
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = userInput.value.trim();

    if (query) {
      clientaActual = query;
      clientNameDisplay.textContent = clientaActual;

      loginScreen.classList.add('hidden');
      dashboardScreen.classList.remove('hidden');

      // Cargar pedidos desde la API de Notion
      cargarPedidosDesdeNotion(clientaActual);
    }
  });

  // Cerrar Sesión
  logoutBtn.addEventListener('click', () => {
    clientaActual = null;
    userInput.value = '';
    dashboardScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  });

  // 2. ABRIR FORMULARIO DE FILLOUT
  document.querySelectorAll('.btn-trigger-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      // Abre el formulario en una nueva pestaña pasando el nombre prellenado
      const urlConParametro = `${FILLOUT_PAGOS_URL}?nombre=${encodeURIComponent(clientaActual)}`;
      window.open(urlConParametro, '_blank');
    });
  });

  // 3. NAVEGACIÓN ENTRE PESTAÑAS (SPA)
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function cambiarPestana(tabId) {
    navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
    tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => cambiarPestana(btn.dataset.tab));
  });

  document.querySelector('.link-go-pedidos').addEventListener('click', () => cambiarPestana('tab-pedidos'));

  // 4. CONSULTA A LA API SERVERLESS (NOTION)
  async function cargarPedidosDesdeNotion(nombreClienta) {
    const container = document.getElementById('gridPedidosContainer');
    container.innerHTML = '<p class="loading-text">Buscando tus pedidos en Notion...</p>';

    try {
      // Llamada a la función serverless en Vercel
      const res = await fetch(`/api/pedidos?cliente=${encodeURIComponent(nombreClienta)}`);
      const data = await res.json();

      if (!data || data.length === 0) {
        container.innerHTML = '<p>No se encontraron pedidos activos registrados a este nombre.</p>';
        return;
      }

      // Renderizar tarjetas dinámicas recibidas desde Notion
      container.innerHTML = '';
      data.forEach(item => {
        container.innerHTML += `
          <div class="card-pedido" data-estado="${item.estadoSlug}" data-pendiente="${item.restante > 0}">
            <div class="card-img-wrap">
              <span class="card-badge">${item.estado}</span>
              <img src="${item.imagenUrl || 'https://via.placeholder.com/220x160?text=BoraShop'}" alt="${item.producto}">
            </div>
            <div class="card-content">
              <h3>${item.producto}</h3>
              <p class="meta-info">Cant: ${item.cantidad} · Modalidad: ${item.modalidad}</p>
              <div class="fin-box">
                <div>
                  <span class="fin-title">ABONADO</span>
                  <span class="fin-amount">$${item.abonado}</span>
                </div>
                <div>
                  <span class="fin-title">RESTANTE</span>
                  <span class="fin-amount ${item.restante > 0 ? 'text-blue' : 'text-green'}">$${item.restante}</span>
                </div>
              </div>
              <div class="logistics-row">
                <span>Logística (EMS+Cruce):</span>
                <strong>$${item.ems} + $${item.cruce}</strong>
              </div>
              <div class="card-footer-info">
                <span class="due-date">Vence: ${item.fechaVencimiento || 'N/A'}</span>
                <a href="#" class="link-detail">Ver ficha &rarr;</a>
              </div>
            </div>
          </div>
        `;
      });

    } catch (error) {
      console.error(error);
      container.innerHTML = '<p>Ocurrió un error al conectar con Notion. Intenta de nuevo más tarde.</p>';
    }
  }

});
