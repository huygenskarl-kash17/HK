/* =========================================================
   PAGE COMPETITION — 100% genere depuis data/competition.json
   Pour modifier un texte : ouvre ce fichier JSON, rien a
   toucher dans le HTML.
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
    try{
        const res = await fetch("data/competition.json");
        const d = await res.json();

        const intro = document.getElementById("comp-intro");
        if(intro && d.hero) intro.textContent = d.hero.intro;

        const titre = document.getElementById("comp-presentation-titre");
        if(titre && d.presentation) titre.textContent = d.presentation.titre;

        const corps = document.getElementById("comp-presentation-corps");
        if(corps && d.presentation){
            corps.innerHTML = d.presentation.paragraphes.map(p => `<p>${p}</p>`).join("");
        }

        const format = document.getElementById("comp-format");
        if(format && d.format){
            format.innerHTML = d.format.map((f,i) => `
                <div class="card format-card reveal" style="--i:${i}">
                    <i class="${f.icone}"></i>
                    <h3>${f.titre}</h3>
                    <p>${f.texte}</p>
                </div>
            `).join("");
        }

        const reglement = document.getElementById("comp-reglement");
        if(reglement && d.reglement){
            reglement.innerHTML = d.reglement.map(r => `
                <li><i class="${r.icone}" ${r.couleur ? `style="color:${r.couleur};"` : ""}></i><span>${r.texte}</span></li>
            `).join("");
        }

        if(window.activerReveal) window.activerReveal();
    }catch(e){
        console.warn("Impossible de charger data/competition.json", e);
    }
});
