document.addEventListener("DOMContentLoaded", function () {
            // Activar efecto sutil de resaltado en tarjetas al hacer hover o clic
            const cards = document.querySelectorAll('.custom-card, .resource-card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.borderColor = '#94a3b8';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.borderColor = '#e2e8f0';
                });
            });

            // Registro en consola de carga correcta de componentes interactivos
            console.log("CEIC IUNAV - Módulo 'Nosotros' inicializado correctamente con fondo gris azulado.");
        });