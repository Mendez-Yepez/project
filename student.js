const LOGIN_URL = "URL-DE-TU-LOGIN-AQUI";

(function checkSession() {
  let role = null;
  try { role = sessionStorage.getItem('ceic_role'); } catch (e) {}
  if (role !== 'estudiante' && LOGIN_URL !== "URL-DE-TU-LOGIN-AQUI") {
    window.location.href = LOGIN_URL;
  }
})();

document.getElementById('sealSlot').innerHTML = `
<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="200" r="185" fill="none" stroke="#2B547E" stroke-width="18" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Q 120 135 120 110 L 120 90 Q 120 70 140 70 Z" fill="#800000" />
  <path d="M 140 70 Q 160 70 160 90 L 160 110 Q 160 135 140 145 Z" fill="#2B547E" />
  <text x="200" y="255" font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="95" fill="#000" text-anchor="middle" letter-spacing="2">CEIC</text>
  <text x="200" y="288" font-family="'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="11.5" fill="#111" text-anchor="middle" letter-spacing="0.5">CENTRO EDUCATIVO INTEGRAL COMUNITARIO</text>
</svg>`;

try {
  const n = sessionStorage.getItem('ceic_username');
  if (n) document.getElementById('numTag').textContent = 'N° de estudiante: ' + n;
} catch (e) {}