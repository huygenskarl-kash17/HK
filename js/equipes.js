document.addEventListener("DOMContentLoaded", async () => {
    const grille = document.getElementById("grille-equipes");
    if(grille){
        try{
            const res = await fetch("data/teams.json");
            const teams = await res.json();
            grille.innerHTML = teams.map((t,i) => `
                <div class="card equipe-card reveal" style="--i:${i % 4}">
                    <div class="barre-couleur" style="background:${t.couleur};"></div>
                    <img src="${t.badge}" alt="${t.nom}" class="badge-equipe">
                    <h2>${t.nom}</h2>
                    <div class="maillot-mini">
                        <span style="background:${t.couleur};"></span>
                        <span style="background:${t.accent || '#ffffff'};"></span>
                    </div>
                    <a href="equipe.html?equipe=${t.slug}" class="btn-fiche"><i class="fa-solid fa-circle-info"></i> Voir la fiche</a>
                </div>
            `).join("");
            if(window.activerReveal) window.activerReveal();
        }catch(e){
            grille.innerHTML = `<p style="text-align:center;color:var(--texte-doux);">Impossible de charger les équipes pour le moment.</p>`;
        }
    }

    const input = document.getElementById("recherche-equipe");
    if(!input) return;
    input.addEventListener("input", () => {
        const terme = input.value.trim().toLowerCase();
        document.querySelectorAll("#grille-equipes .equipe-card").forEach(c => {
            const nom = c.querySelector("h2").textContent.toLowerCase();
            c.style.display = nom.includes(terme) ? "" : "none";
        });
    });
});
