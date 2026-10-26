document.addEventListener('DOMContentLoaded', () => {
    // 1. Registro opcional para descargas directas de infografías/recursos
    const downloadButtons = document.querySelectorAll('a[download]');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log(`Recurso descargado exitosamente: ${button.getAttribute('download')}`);
        });
    });

    // 2. Sombra dinámica en la barra de navegación al hacer scroll
    const navbar = document.querySelector('.main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    });
});