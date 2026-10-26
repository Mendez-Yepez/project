// Inicializar Iconos de Lucide
lucide.createIcons();

// --- 1. Filtro Interactivo para la Galería ---
const filterButtons = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Cambiar estado activo en botones
    filterButtons.forEach(btn => {
      btn.classList.remove('active', 'bg-blue-600', 'text-white');
      btn.classList.add('text-slate-400');
    });
    button.classList.add('active', 'bg-blue-600', 'text-white');
    button.classList.remove('text-slate-400');

    const filter = button.getAttribute('data-filter');

    // Filtrar elementos de la galería
    galleryItems.forEach(item => {
      if (filter === 'all' || item.classList.contains(filter)) {
        item.classList.remove('hidden-item');
      } else {
        item.classList.add('hidden-item');
      }
    });
  });
});

// --- 2. Animación de Contadores Estadísticos ---
function animateCounter(id, target, duration) {
  const element = document.getElementById(id);
  if (!element) return;
  
  let start = 0;
  const increment = target / (duration / 16);
  
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target + '+';
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// Iniciar contadores al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  animateCounter('counter1', 450, 2000); // 450+ Inscritos
  animateCounter('counter2', 28, 1800);  // 28+ Cursos
  animateCounter('counter3', 15, 1500);  // 15+ Proyectos
  animateCounter('counter4', 120, 2200); // 120+ Horas
});