document.addEventListener('DOMContentLoaded', () => {
    // 1. Agrandar imagen en modal o interactividad opcional de descargas
    const downloadButtons = document.querySelectorAll('a[download]');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Confirmación o registro suave al descargar un recurso
            console.log(`Recurso descargado: ${button.getAttribute('download')}`);
        });
    });

    // 2. Transición suave de la barra superior al hacer scroll
    const navbar = document.querySelector('.main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('shadow');
        } else {
            navbar.classList.remove('shadow');
        }
    });
});