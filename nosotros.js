document.addEventListener("DOMContentLoaded", () => {

/* ==========================
   BARRA PROGRESO SCROLL
========================== */

const progressBar = document.getElementById("scrollProgress");

window.addEventListener("scroll", () => {

    const totalHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

    const progress =
        (window.pageYOffset / totalHeight) * 100;

    progressBar.style.width = progress + "%";
});


/* ==========================
   BOTON VOLVER ARRIBA
========================== */

const toTop = document.getElementById("toTop");

window.addEventListener("scroll", () => {

    if (window.scrollY > 400) {
        toTop.style.display = "flex";
    } else {
        toTop.style.display = "none";
    }
});

toTop.addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


/* ==========================
   ANIMACIONES REVEAL
========================== */

const reveals =
document.querySelectorAll(".reveal");

const revealOnScroll = () => {

    reveals.forEach(el => {

        const top =
        el.getBoundingClientRect().top;

        if (top < window.innerHeight - 100) {
            el.classList.add("active");
        }

    });
};

window.addEventListener(
    "scroll",
    revealOnScroll
);

revealOnScroll();


/* ==========================
   MISIÓN Y VISIÓN
========================== */

const tabs =
document.querySelectorAll(".mv-tab");

const panels =
document.querySelectorAll(".mv-panel");

const pill =
document.getElementById("mvPill");

tabs.forEach((tab, index) => {

    tab.addEventListener("click", () => {

        tabs.forEach(t =>
            t.classList.remove("active")
        );

        panels.forEach(p =>
            p.classList.remove("active")
        );

        tab.classList.add("active");

        document
            .getElementById(
                tab.dataset.target
            )
            .classList.add("active");

        if (index === 0) {
            pill.style.transform =
            "translateX(0)";
        } else {
            pill.style.transform =
            "translateX(100%)";
        }

    });

});


/* ==========================
   VALORES
========================== */

const valores = [

{
    titulo:"Fe",
    categoria:"espiritual",
    icono:"bi-heart-fill",
    color:"primary",
    descripcion:
    "Creemos en Dios como fundamento de toda verdadera educación y desarrollo humano."
},

{
    titulo:"Servicio",
    categoria:"social",
    icono:"bi-people-fill",
    color:"success",
    descripcion:
    "Promovemos la ayuda desinteresada y el compromiso con la comunidad."
},

{
    titulo:"Integridad",
    categoria:"personal",
    icono:"bi-shield-check",
    color:"warning",
    descripcion:
    "Actuamos con honestidad, ética y coherencia en todas nuestras acciones."
},

{
    titulo:"Excelencia",
    categoria:"profesional",
    icono:"bi-star-fill",
    color:"danger",
    descripcion:
    "Buscamos calidad y mejora continua en cada actividad desarrollada."
},

{
    titulo:"Respeto",
    categoria:"social",
    icono:"bi-hand-thumbs-up-fill",
    color:"info",
    descripcion:
    "Valoramos la dignidad, opiniones y diversidad de las personas."
},

{
    titulo:"Responsabilidad",
    categoria:"personal",
    icono:"bi-check-circle-fill",
    color:"secondary",
    descripcion:
    "Cumplimos nuestros compromisos con disciplina y compromiso."
},

{
    titulo:"Emprendimiento",
    categoria:"profesional",
    icono:"bi-lightbulb-fill",
    color:"success",
    descripcion:
    "Impulsamos iniciativas innovadoras para generar oportunidades."
},

{
    titulo:"Esperanza",
    categoria:"espiritual",
    icono:"bi-sun-fill",
    color:"primary",
    descripcion:
    "Inspiramos confianza en un futuro mejor mediante los principios cristianos."
}

];

const grid =
document.getElementById("valuesGrid");

let currentFilter = "all";

function renderValues() {

    grid.innerHTML = "";

    let filtered =
    currentFilter === "all"
    ? valores
    : valores.filter(
        v => v.categoria === currentFilter
      );

    filtered.forEach((valor,index)=>{

        grid.innerHTML += `
        <div class="col-md-6 col-lg-4">
            <div class="custom-card p-4 h-100 value-card"
                 data-index="${valores.indexOf(valor)}">

                <div class="icon-box bg-${valor.color}-subtle mb-3"
                     style="width:70px;height:70px">

                    <i class="bi ${valor.icono}
                    fs-3 text-${valor.color}"></i>

                </div>

                <h5 class="fw-bold">
                    ${valor.titulo}
                </h5>

                <p class="text-muted small">
                    ${valor.descripcion.substring(0,70)}...
                </p>

            </div>
        </div>`;
    });

    activateCards();
}

renderValues();


/* ==========================
   FILTROS
========================== */

const filters =
document.querySelectorAll(".filter-chip");

filters.forEach(btn => {

    btn.addEventListener("click", () => {

        filters.forEach(f =>
            f.classList.remove("active")
        );

        btn.classList.add("active");

        currentFilter =
        btn.dataset.filter;

        renderValues();

    });

});


/* ==========================
   MODAL
========================== */

const modalElement =
document.getElementById("valueModal");

const valueModal =
new bootstrap.Modal(modalElement);

const mTitle =
document.getElementById("mTitle");

const mDesc =
document.getElementById("mDesc");

const mIcon =
document.getElementById("mIcon");

const mCat =
document.getElementById("mCat");

const mCount =
document.getElementById("mCount");

let currentIndex = 0;

function openModal(index){

    currentIndex = index;

    const valor = valores[index];

    mTitle.textContent =
    valor.titulo;

    mDesc.textContent =
    valor.descripcion;

    mCat.textContent =
    valor.categoria.toUpperCase();

    mCat.className =
    `badge bg-${valor.color}`;

    mIcon.innerHTML = `
    <i class="bi ${valor.icono}
    fs-1 text-${valor.color}"></i>`;

    mCount.textContent =
    `${index + 1} / ${valores.length}`;

    valueModal.show();
}


function activateCards(){

    document
    .querySelectorAll(".value-card")
    .forEach(card => {

        card.addEventListener("click",()=>{

            openModal(
                Number(card.dataset.index)
            );

        });

    });

}


document
.getElementById("mPrev")
.addEventListener("click",()=>{

    currentIndex--;

    if(currentIndex < 0){
        currentIndex =
        valores.length - 1;
    }

    openModal(currentIndex);

});


document
.getElementById("mNext")
.addEventListener("click",()=>{

    currentIndex++;

    if(
        currentIndex >= valores.length
    ){
        currentIndex = 0;
    }

    openModal(currentIndex);

});

});