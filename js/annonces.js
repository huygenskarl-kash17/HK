/* =========================================================
   PAGE ANNONCES / MEDIAS — 100% piloté par data/annonces.json
   Pour publier une nouvelle annonce ou une nouvelle date au
   programme : il suffit d'ajouter un bloc dans ce fichier JSON,
   rien à toucher en HTML. Voir GUIDE-ADMINISTRATION.md.
   ========================================================= */

const AN_ICONES_PROGRAMME = {
    match: "fa-futbol", reunion: "fa-people-group", formation: "fa-clipboard-list",
    social: "fa-seedling", solidarite: "fa-hand-holding-heart"
};
const AN_ETIQUETTES_PROGRAMME = {
    reunion: "Réunion", formation: "Formation", social: "Vie de quartier", solidarite: "Solidarité"
};
const AN_TAGS = {
    resultat: { classe: "resultat", label: "Résultat", icone: "" },
    video: { classe: "video", label: "Vidéo", icone: "fa-solid fa-video" },
    "communique-officiel": { classe: "communique-officiel", label: "Communiqué", icone: "" },
    evenement: { classe: "evenement", label: "Vie des clubs", icone: "fa-solid fa-seedling" },
    choc: { classe: "choc", label: "Choc à venir", icone: "fa-solid fa-fire" }
};

function anRenderProgramme(programme){
    const ol = document.getElementById("programme-liste");
    if(!ol || !programme) return;
    ol.innerHTML = programme.map((p,i) => {
        const icone = AN_ICONES_PROGRAMME[p.type] || "fa-solid fa-calendar";
        let etiquette, titreHTML;
        if(p.type === "match"){
            etiquette = p.etiquette || "Championnat";
            titreHTML = (p.domicile && p.exterieur)
                ? `${p.domicile} <em>vs</em> ${p.exterieur}`
                : (p.titre || "");
        } else {
            etiquette = AN_ETIQUETTES_PROGRAMME[p.type] || p.type;
            titreHTML = p.titre || "";
        }
        const lien = p.lien ? ` <a href="${p.lien.href}">${p.lien.texte}</a>` : "";
        return `
        <li class="tl-item tl-${p.type} reveal" style="--i:${i % 4}">
            <div class="tl-date"><span class="tl-jour">${p.jour_court}</span><span class="tl-num">${p.jour_num}</span><span class="tl-mois">${p.mois_court}</span></div>
            <div class="tl-noeud"><i class="fa-solid ${icone}"></i></div>
            <div class="tl-contenu">
                <span class="tl-etiquette ${p.type}">${etiquette}</span>
                <h3>${titreHTML}</h3>
                <p>${p.texte}${lien}</p>
            </div>
        </li>`;
    }).join("");
}

function anCarteChoc(c){
    return `
    <article class="communique communique-choc reveal" data-categorie="choc">
        <div class="entete">
            <span class="tag choc"><i class="fa-solid fa-fire"></i> Choc à venir</span>
            <span class="date-pub">${c.date_pub}</span>
        </div>
        <h3>${c.titre}</h3>
        <p class="texte">${c.texte}</p>
        <div class="billet" style="--c1:${c.couleur1}; --c2:${c.couleur2};">
            <div class="billet-equipe">
                <img src="${c.domicile.badge}" alt="${c.domicile.nom}">
                <span class="billet-nom">${c.domicile.nom}</span>
                <span class="billet-rang">${c.domicile.rang} · ${c.domicile.pts} pts</span>
            </div>
            <div class="billet-milieu">
                <span class="billet-vs">VS</span>
                <span class="billet-heure">${c.heure}</span>
                <span class="billet-lieu"><i class="fa-solid fa-location-dot"></i> ${c.lieu}</span>
            </div>
            <div class="billet-equipe">
                <img src="${c.exterieur.badge}" alt="${c.exterieur.nom}">
                <span class="billet-nom">${c.exterieur.nom}</span>
                <span class="billet-rang">${c.exterieur.rang} · ${c.exterieur.pts} pts</span>
            </div>
        </div>
    </article>`;
}

function anCarteVideo(c){
    return `
    <article class="card communique reveal" data-categorie="video">
        <div class="entete">
            <span class="tag video"><i class="fa-solid fa-video"></i> Vidéo</span>
            <span class="date-pub">${c.date_pub}</span>
        </div>
        <h3>${c.titre}</h3>
        <p class="texte">${c.texte}</p>
        <div class="video-wrap">
            <iframe src="https://www.youtube.com/embed/${c.youtube_id}" title="${c.titre}" allowfullscreen></iframe>
        </div>
    </article>`;
}

function anCarteResultat(c){
    const grilleMatchs = c.matchs.map(m => {
        if(m.en_direct){
            return `<div class="score-box en-direct">
                <span class="statut-badge live" style="position:static; margin-bottom:8px;"><span class="dot"></span> En direct</span>
                <div class="score-box-ligne"><span class="equipe">${m.equipe1}</span><span class="score">${m.score1} — ${m.score2}</span><span class="equipe">${m.equipe2}</span></div>
            </div>`;
        }
        return `<div class="score-box"><span class="equipe">${m.equipe1}</span><span class="score">${m.score1} — ${m.score2}</span><span class="equipe">${m.equipe2}</span></div>`;
    }).join("");
    const photos = (c.photos && c.photos.length)
        ? `<div class="photo-grid">${c.photos.map(p => `<img src="${p}" alt="${c.titre}" onclick="ouvrirLightbox(this)">`).join("")}</div>`
        : "";
    return `
    <article class="card communique reveal" data-categorie="resultat">
        <div class="entete">
            <span class="tag resultat">Résultat</span>
            <span class="date-pub">${c.date_pub}</span>
        </div>
        <h3>${c.titre}</h3>
        <p class="texte">${c.texte}</p>
        <div class="score-grid">${grilleMatchs}</div>
        ${photos}
    </article>`;
}

function anCarteCommuniqueOfficiel(c){
    return `
    <article class="card communique reveal" data-categorie="communique-officiel">
        <div class="entete">
            <span class="tag communique-officiel">Communiqué</span>
            <span class="date-pub">${c.date_pub}</span>
        </div>
        <h3>${c.titre}</h3>
        <p class="texte">${c.texte}</p>
    </article>`;
}

function anCarteEvenement(c){
    const photos = (c.photos && c.photos.length)
        ? `<div class="photo-grid ${c.photos.length===1?'grid-1':(c.photos.length===2?'grid-2':'')}">${c.photos.map(p => `<img src="${p}" alt="${c.titre}" onclick="ouvrirLightbox(this)">`).join("")}</div>`
        : "";
    return `
    <article class="card communique reveal" data-categorie="evenement">
        <div class="entete">
            <span class="tag evenement"><i class="fa-solid fa-seedling"></i> Vie des clubs</span>
            <span class="date-pub">${c.date_pub}</span>
        </div>
        <h3>${c.titre}</h3>
        <p class="texte">${c.texte}</p>
        ${photos}
    </article>`;
}

const AN_RENDUS = {
    choc: anCarteChoc, video: anCarteVideo, resultat: anCarteResultat,
    "communique-officiel": anCarteCommuniqueOfficiel, evenement: anCarteEvenement
};

function anRenderCommuniques(communiques){
    const conteneur = document.getElementById("liste-communiques-corps");
    if(!conteneur || !communiques) return;
    conteneur.innerHTML = communiques.map(c => {
        const fn = AN_RENDUS[c.type];
        return fn ? fn(c) : "";
    }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {

    /* ---------- CHARGEMENT DES DONNEES ---------- */
    try{
        const res = await fetch("data/annonces.json");
        const data = await res.json();
        anRenderProgramme(data.programme);
        anRenderCommuniques(data.communiques);
        document.querySelectorAll(".ek-derniere-maj").forEach(el => el.textContent = "Dernière mise à jour : " + data.maj);
        if(window.activerReveal) window.activerReveal();
    }catch(e){
        const conteneur = document.getElementById("liste-communiques-corps");
        if(conteneur) conteneur.innerHTML = `<p style="text-align:center;color:var(--texte-doux);">Impossible de charger les annonces pour le moment.</p>`;
    }

    /* ---------- FILTRES (fonctionnent sur le contenu qui vient d'être généré) ---------- */
    const boutons = document.querySelectorAll(".filtre-btn");
    boutons.forEach(bouton => {
        bouton.addEventListener("click", () => {
            boutons.forEach(b => b.classList.remove("actif"));
            bouton.classList.add("actif");
            const filtre = bouton.dataset.filtre;
            document.querySelectorAll(".communique").forEach(c => {
                const correspond = (filtre === "tous" || c.dataset.categorie === filtre);
                c.style.display = correspond ? "" : "none";
            });
        });
    });

    /* ---------- LIGHTBOX PHOTOS ---------- */
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");

    window.ouvrirLightbox = function(imgElement){
        lightbox.classList.add("actif");
        lightboxImg.src = imgElement.src;
    };
    window.fermerLightbox = function(){
        lightbox.classList.remove("actif");
        lightboxImg.src = "";
    };

    if (lightbox) {
        lightbox.addEventListener("click", (e) => { if (e.target === lightbox) window.fermerLightbox(); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") window.fermerLightbox(); });
    }
});
