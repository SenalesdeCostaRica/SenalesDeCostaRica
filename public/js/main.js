// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.menu a[href^="#"]');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY + 120;
  sections.forEach(section => {
    if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + section.id);
      });
    }
  });
});

// ===== FORM SUBMISSION =====
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');
const successName = document.getElementById('successName');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const tipoServicio = document.getElementById('tipoServicio').value;

    if (!nombre || !email || !telefono || !tipoServicio) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Enviando...';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, tipoServicio })
      });

      const data = await res.json();

      if (data.success) {
        form.style.display = 'none';
        successName.textContent = `¡Gracias ${nombre}!`;
        formSuccess.style.display = 'block';
      } else {
        alert('Error: ' + (data.error || 'No se pudo enviar. Intenta de nuevo.'));
        submitBtn.disabled = false;
        submitBtn.textContent = '✉️ Enviar solicitud';
      }
    } catch {
      alert('Error de conexión. Intenta de nuevo o escríbenos por WhatsApp.');
      submitBtn.disabled = false;
      submitBtn.textContent = '✉️ Enviar solicitud';
    }
  });
}
