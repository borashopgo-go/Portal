document.addEventListener('DOMContentLoaded', () => {

  // --- NAVEGACIÓN ENTRE PESTAÑAS (SPA) ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function cambiarPestana(tabId) {
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => cambiarPestana(btn.dataset.tab));
  });

  // Acceso directo "Ver Mis pedidos" desde el Inicio
  document.querySelector('.link-go-pedidos').addEventListener('click', () => {
    cambiarPestana('tab-pedidos');
  });


  // --- FILTROS DE MIS PEDIDOS ---
  const filtroBtns = document.querySelectorAll('.filtro-btn');
  const tarjetas = document.querySelectorAll('.card-pedido');

  filtroBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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
    });
  });


  // --- VENTANA MODAL REGISTRAR PAGO ---
  const modalPago = document.getElementById('modalPago');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const montoTotalInput = document.getElementById('montoTotal');
  const checkboxes = document.querySelectorAll('.articulo-checkbox');

  function abrirModal() {
    modalPago.classList.remove('hidden');
  }

  function cerrarModal() {
    modalPago.classList.add('hidden');
  }

  // Activar modal con cualquier botón de pago/abono
  document.querySelectorAll('.btn-trigger-pago').forEach(btn => {
    btn.addEventListener('click', abrirModal);
  });

  closeModalBtn.addEventListener('click', cerrarModal);

  // Calcular monto total dinámicamente según checkboxes seleccionados
  checkboxes.forEach(chk => {
    chk.addEventListener('change', () => {
      let suma = 0;
      checkboxes.forEach(c => {
        if (c.checked) suma += parseFloat(c.value || 0);
      });
      montoTotalInput.value = suma > 0 ? suma.toFixed(2) : '';
    });
  });

  // Envío del formulario
  document.getElementById('formRegistroPago').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('¡Registro de pago enviado con éxito! Se revisará tu comprobante.');
    cerrarModal();
  });

});
