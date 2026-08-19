/* =========================================================
   MOTEUR DE DONNÉES — ENTENTE DE KIPUSHI
   Lit les fichiers data/*.json et affiche classement, calendrier
   et statistiques. Se rafraîchit automatiquement toutes les 15s
   pour donner un effet "quasi temps réel" SANS base de données :
   il suffit d'éditer les fichiers .json et republier le site.
   ========================================================= */

const EK_REFRESH_MS = 15000;

async function ekFetchJSON(chemin){
    try{
        const reponse = await fetch(chemin + "?t=" + Date.now());
        if(!reponse.ok) throw new Error("Réponse invalide");
        return await reponse.json();
    }catch(e){
        console.warn("Impossible de charger", chemin, e);
        return null;
    }
}

function ekBadge(cheminBadge, nom){
    return `<img src="${cheminBadge}" alt="${nom}" class="ek-badge-mini">`;
}

/* ---------- CLASSEMENT ---------- */
function ekRenderClassementComplet(data){
    const corps = document.getElementById("classement-corps");
    if(!corps || !data) return;
    corps.innerHTML = "";
    data.classement.forEach((eq, i) => {
        const tr = document.createElement("tr");
        if(i < 4) tr.classList.add("zone-qualif");
        tr.innerHTML = `
            <td class="rang">${eq.rang}</td>
            <td class="equipe-cell">${ekBadge(eq.badge, eq.nom)} <span>${eq.nom}</span></td>
            <td>${eq.mj}</td><td>${eq.v}</td><td>${eq.n}</td><td>${eq.d}</td>
            <td>${eq.bp}</td><td>${eq.bc}</td><td>${eq.diff > 0 ? "+"+eq.diff : eq.diff}</td>
            <td class="pts">${eq.pts}</td>
        `;
        corps.appendChild(tr);
    });
    const maj = document.querySelectorAll(".ek-derniere-maj");
    maj.forEach(el => el.textContent = "Dernière mise à jour : " + data.maj);
}

function ekRenderClassementMini(data){
    const corps = document.getElementById("classement-mini-corps");
    if(!corps || !data) return;
    corps.innerHTML = "";
    data.classement.slice(0,5).forEach(eq => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="rang">${eq.rang}</td>
            <td class="equipe-cell">${ekBadge(eq.badge, eq.nom)} <span>${eq.nom}</span></td>
            <td>${eq.mj}</td>
            <td class="pts">${eq.pts}</td>
        `;
        corps.appendChild(tr);
    });
}

/* ---------- CALENDRIER ---------- */
/* Important : "jour" = une journée réelle du calendrier (ex: un dimanche donné,
   avec ses matchs de ce jour-là). "journée" = le numéro de ronde propre à
   chaque match/équipe. Les deux notions sont volontairement séparées : deux
   matchs qui se jouent le même "jour" réel peuvent très bien correspondre à
   une "journée" différente si des équipes ont pris de l'avance ou du retard
   sur leur calendrier. On ne mélange donc jamais les deux : le regroupement
   visuel se fait par "jour_numero", et chaque match affiche sa propre étiquette
   "Journée X". */
function ekStatutLabel(statut){
    if(statut === "live") return '<span class="statut-badge live"><span class="dot"></span> Live</span>';
    if(statut === "termine") return '<span class="statut-badge termine">Terminé</span>';
    return '<span class="statut-badge a_venir">À venir</span>';
}

function ekJourNumero(m){
    return (m.jour_numero !== undefined && m.jour_numero !== null) ? m.jour_numero : m.journee;
}

function ekRenderCalendrier(data, filtreJournee){
    const conteneur = document.getElementById("calendrier-liste");
    if(!conteneur || !data) return;

    const parJour = {};
    data.matchs.forEach(m => {
        if(filtreJournee && filtreJournee !== "tous" && String(m.journee) !== String(filtreJournee)) return;
        const jn = ekJourNumero(m);
        if(!parJour[jn]) parJour[jn] = [];
        parJour[jn].push(m);
    });

    conteneur.innerHTML = "";
    Object.keys(parJour).sort((a,b)=>a-b).forEach(j => {
        const matchs = parJour[j];
        const bloc = document.createElement("div");
        bloc.className = "journee-bloc";
        bloc.innerHTML = `
            <div class="journee-header">
                <span class="journee-badge"><i class="fa-solid fa-calendar-days"></i> Jour ${j}</span>
                <span class="journee-date">${matchs[0].jour} • ${matchs[0].date}</span>
            </div>
            <div class="match-list"></div>
        `;
        const liste = bloc.querySelector(".match-list");
        matchs.forEach(m => {
            const row = document.createElement("div");
            row.className = "match-row";
            const scoreHTML = (m.statut === "a_venir")
                ? `<span class="heure-match">${m.heure}</span>`
                : `<span class="score-inline">${m.score_domicile} — ${m.score_exterieur}</span>`;
            row.innerHTML = `
                <span class="journee-mini">Journée ${m.journee}</span>
                ${ekStatutLabel(m.statut)}
                <div class="match-teams">
                    <div class="team-side">${ekTeamBadge(m.domicile)} <span>${m.domicile}</span></div>
                    <div class="score-zone">${scoreHTML}</div>
                    <div class="team-side away"><span>${m.exterieur}</span> ${ekTeamBadge(m.exterieur)}</div>
                </div>
            `;
            liste.appendChild(row);
        });
        conteneur.appendChild(bloc);
    });

    document.querySelectorAll(".ek-derniere-maj").forEach(el => el.textContent = "Dernière mise à jour : " + data.maj);
}

/* ---------- FILTRES DE JOURNEE (generes automatiquement depuis scores.json) ---------- */
let EK_FILTRES_JOURNEES_GENERES = false;
function ekGenererFiltresJournees(data){
    const conteneur = document.getElementById("filtres-jour-calendrier");
    if(!conteneur || !data || EK_FILTRES_JOURNEES_GENERES) return;

    const journees = [...new Set(data.matchs.map(m => m.journee))].sort((a,b) => a-b);
    let html = `<button class="filtre-btn filtre-jour actif" data-jour="tous">Toutes les journées</button>`;
    journees.forEach(j => {
        html += `<button class="filtre-btn filtre-jour" data-jour="${j}">Journée ${j}</button>`;
    });
    conteneur.innerHTML = html;
    EK_FILTRES_JOURNEES_GENERES = true;
}

/* ---------- MINI-ANNONCES QUI DEFILENT (accueil) ---------- */
const EK_TAGS_ANNONCE = {
    resultat: { classe: "resultat", label: "Résultat" },
    video: { classe: "video", label: "Vidéo" },
    "communique-officiel": { classe: "communique-officiel", label: "Communiqué" },
    evenement: { classe: "evenement", label: "Vie des clubs" },
    choc: { classe: "choc", label: "Choc à venir" }
};
function ekRenderAnnoncesAccueil(communiques){
    const piste = document.getElementById("annonces-piste-accueil");
    if(!piste || !communiques || !communiques.length) return;

    const items = communiques.slice(0, 6);
    const carte = (c, cache) => {
        const tagInfo = EK_TAGS_ANNONCE[c.type] || { classe: "", label: c.type };
        const texte = (c.texte || "").length > 100 ? c.texte.slice(0,97) + "…" : (c.texte || "");
        return `
        <a href="annonces.html" class="mini-annonce" ${cache ? 'aria-hidden="true"' : ''}>
            <span class="tag ${tagInfo.classe}">${tagInfo.label}</span>
            <h4>${c.titre}</h4>
            <p>${texte}</p>
            <span class="mini-annonce-date"><i class="fa-regular fa-clock"></i> ${c.date_pub}</span>
        </a>`;
    };
    // la liste est dupliquee une fois pour un defilement infini fluide (piste 2x plus longue)
    piste.innerHTML = items.map(c => carte(c, false)).join("") + items.map(c => carte(c, true)).join("");
}

/* ---------- EQUIPES EN LICE (accueil) ---------- */
function ekRenderEquipesAccueil(teams){
    const grille = document.getElementById("equipes-accueil-grid");
    if(!grille || !teams) return;
    grille.innerHTML = teams.map(t => `
        <a href="equipes.html" class="equipe-mini-badge" style="border-top:3px solid ${t.couleur}">
            <img src="${t.badge}" alt="${t.nom}">
            <span>${t.nom}</span>
        </a>
    `).join("");
}

let EK_TEAMS_INDEX = null;
function ekTeamBadge(nom){
    if(!EK_TEAMS_INDEX) return "";
    const t = EK_TEAMS_INDEX[nom];
    if(!t) return "";
    return `<img src="${t.badge}" alt="${nom}" class="ek-badge-mini">`;
}

/* ---------- PROCHAIN MATCH (accueil) ---------- */
function ekRenderProchainMatch(data){
    const cible = document.getElementById("prochain-match");
    if(!cible || !data) return;
    const prochain = data.matchs.find(m => m.statut === "a_venir") || data.matchs.find(m => m.statut === "live");
    if(!prochain){ cible.innerHTML = "<p>Aucun match à venir pour le moment.</p>"; return; }
    cible.innerHTML = `
        <span class="pm-label">${prochain.statut === "live" ? "En ce moment" : "Prochain match"} — Jour ${ekJourNumero(prochain)} · Journée ${prochain.journee}</span>
        <div class="pm-teams">
            <div class="pm-team">${ekTeamBadge(prochain.domicile)}<span>${prochain.domicile}</span></div>
            <div class="pm-vs">VS</div>
            <div class="pm-team">${ekTeamBadge(prochain.exterieur)}<span>${prochain.exterieur}</span></div>
        </div>
        <div class="pm-date"><i class="fa-regular fa-clock"></i> ${prochain.jour} ${prochain.date} — ${prochain.heure}</div>
    `;
}

/* ---------- BANDEAU DERNIERS RESULTATS (ticker) ---------- */
function ekRenderTicker(data){
    const ticker = document.getElementById("live-ticker-content");
    if(!ticker || !data) return;
    const termines = data.matchs.filter(m => m.statut === "termine" || m.statut === "live").slice(-10);
    const items = termines.map(m => {
        const tag = m.statut === "live" ? "🔴 LIVE" : "✅";
        return `${tag} ${m.domicile} ${m.score_domicile}-${m.score_exterieur} ${m.exterieur}`;
    });
    ticker.innerHTML = items.concat(items).map(t => `<span class="ticker-item">${t}</span>`).join("");
}

/* ---------- STATISTIQUES ---------- */
function ekRenderStats(data){
    if(!data) return;

    const corpsBut = document.getElementById("buteurs-corps");
    if(corpsBut && data.buteurs){
        corpsBut.innerHTML = data.buteurs.map(b => `
            <tr><td class="rang ${b.rang===1?'top1':''}">${b.rang}</td><td>${b.nom}</td><td>${b.equipe}</td><td class="valeur">${b.buts}</td></tr>
        `).join("");
    }
    const corpsPas = document.getElementById("passeurs-corps");
    if(corpsPas && data.passeurs){
        corpsPas.innerHTML = data.passeurs.map(p => `
            <tr><td class="rang ${p.rang===1?'top1':''}">${p.rang}</td><td>${p.nom}</td><td>${p.equipe}</td><td class="valeur">${p.passes}</td></tr>
        `).join("");
    }

    /* Meilleurs gardiens (clean sheets) */
    const corpsGar = document.getElementById("gardiens-corps");
    if(corpsGar && data.gardiens){
        corpsGar.innerHTML = data.gardiens.map(g => `
            <tr><td class="rang ${g.rang===1?'top1':''}">${g.rang}</td><td>${g.nom}</td><td>${g.equipe}</td><td class="valeur">${g.clean_sheets}</td></tr>
        `).join("");
    }

    /* Meilleurs dribbleurs */
    const corpsDri = document.getElementById("dribbleurs-corps");
    if(corpsDri && data.dribbleurs){
        corpsDri.innerHTML = data.dribbleurs.map(d => `
            <tr><td class="rang ${d.rang===1?'top1':''}">${d.rang}</td><td>${d.nom}</td><td>${d.equipe}</td><td class="valeur">${d.dribbles}</td></tr>
        `).join("");
    }

    /* Cartons jaunes par équipe */
    const corpsCJ = document.getElementById("cartons-jaunes-corps");
    if(corpsCJ && data.cartons_jaunes_equipes){
        corpsCJ.innerHTML = data.cartons_jaunes_equipes.map(c => `
            <tr><td class="rang ${c.rang===1?'top1':''}">${c.rang}</td><td class="equipe-cell">${ekTeamBadge(c.equipe)} <span>${c.equipe}</span></td><td class="valeur carton-jaune-val">${c.jaunes}</td></tr>
        `).join("");
    }

    /* Cartons rouges par équipe */
    const corpsCR = document.getElementById("cartons-rouges-corps");
    if(corpsCR && data.cartons_rouges_equipes){
        corpsCR.innerHTML = data.cartons_rouges_equipes.map(c => `
            <tr><td class="rang ${c.rang===1?'top1':''}">${c.rang}</td><td class="equipe-cell">${ekTeamBadge(c.equipe)} <span>${c.equipe}</span></td><td class="valeur carton-rouge-val">${c.rouges}</td></tr>
        `).join("");
    }

    /* Classement des trophées "Homme du match" — calculé automatiquement
       à partir de la liste hommes_du_match : pas besoin de le tenir à jour
       à la main, il suffit de continuer à renseigner l'homme du match de
       chaque jour et ce classement se met à jour tout seul. */
    const corpsTro = document.getElementById("trophees-hdm-corps");
    if(corpsTro && data.hommes_du_match){
        const compte = {};
        data.hommes_du_match.forEach(h => {
            const cle = h.nom + "||" + h.equipe;
            if(!compte[cle]) compte[cle] = { nom: h.nom, equipe: h.equipe, trophees: 0 };
            compte[cle].trophees++;
        });
        const classement = Object.values(compte).sort((a,b) => b.trophees - a.trophees).slice(0,5);
        corpsTro.innerHTML = classement.map((t,i) => `
            <tr><td class="rang ${i===0?'top1':''}">${i+1}</td><td>${t.nom}</td><td>${t.equipe}</td><td class="valeur"><i class="fa-solid fa-trophy" style="color:var(--rouge);margin-right:6px;"></i>${t.trophees}</td></tr>
        `).join("");
    }

    /* Homme du match — un par jour réel (et non par journée globale, qui
       peut différer d'une équipe à l'autre) */
    ekRenderHommeDuMatch(data.hommes_du_match);

    const meilleure = document.getElementById("meilleure-equipe");
    if(meilleure && data.meilleure_equipe){
        const me = data.meilleure_equipe;
        meilleure.innerHTML = `
            <img src="${me.badge}" alt="${me.nom}" class="me-badge">
            <div>
                <span class="me-tag">Équipe du moment</span>
                <h3>${me.nom}</h3>
                <p>${me.description}</p>
            </div>
        `;
    }
}

/* ---------- HOMME DU MATCH (slider, un par jour) ---------- */
let EK_HM_INTERVAL = null;

/* Moteur generique de carrousel : recoit des vignettes deja construites
   (tableau de chaines HTML) et gere l'affichage + la rotation automatique.
   Reutilise a la fois pour statistiques.html (3 photos) et l'accueil
   (6 vignettes : 3 hommes du match + 3 affiches de match). */
function ekMonterCarrousel(vignettesHTML, sliderId, dotsId){
    const slider = document.getElementById(sliderId);
    const dotsWrap = document.getElementById(dotsId);
    if(!slider || !dotsWrap || !vignettesHTML || !vignettesHTML.length) return;

    slider.innerHTML = vignettesHTML.map((html,i) => `<div class="hm-slide ${i===0?'actif':''}">${html}</div>`).join("");
    dotsWrap.innerHTML = vignettesHTML.map((h,i) => `<span class="hm-dot ${i===0?'actif':''}"></span>`).join("");

    const slides = slider.querySelectorAll(".hm-slide");
    const dots = dotsWrap.querySelectorAll(".hm-dot");
    if(slides.length <= 1) return;
    let index = 0;
    const intervalle = setInterval(() => {
        slides[index].classList.remove("actif");
        dots[index].classList.remove("actif");
        index = (index + 1) % slides.length;
        slides[index].classList.add("actif");
        dots[index].classList.add("actif");
    }, 3000);
    return intervalle;
}

/* Vignette "photo" (homme du match) */
function ekVignetteHomme(h){
    return `
        <img src="${h.photo}" alt="Homme du match">
        <div class="hm-caption">
            <span class="hm-tag">Jour ${h.jour_numero}</span>
            <h4>${h.nom}</h4>
            ${h.equipe ? `<p>Équipe — ${h.equipe}</p>` : ""}
        </div>`;
}

/* Vignette "affiche de match" (2 blasons + score, sans photo) */
function ekVignetteAffiche(m){
    const badgeDom = EK_TEAMS_INDEX[m.domicile] ? EK_TEAMS_INDEX[m.domicile].badge : "";
    const badgeExt = EK_TEAMS_INDEX[m.exterieur] ? EK_TEAMS_INDEX[m.exterieur].badge : "";
    const score = (m.score_domicile !== null && m.score_domicile !== undefined)
        ? `${m.score_domicile} — ${m.score_exterieur}` : "VS";
    return `
        <div class="hm-affiche">
            <span class="hm-affiche-tag">Journée ${m.journee}</span>
            <div class="hm-affiche-equipe">${badgeDom ? `<img src="${badgeDom}" alt="${m.domicile}">` : ""}<span>${m.domicile}</span></div>
            <div class="hm-affiche-milieu">
                <span class="hm-affiche-score">${score}</span>
                <span class="hm-affiche-journee">${m.date}</span>
            </div>
            <div class="hm-affiche-equipe">${badgeExt ? `<img src="${badgeExt}" alt="${m.exterieur}">` : ""}<span>${m.exterieur}</span></div>
        </div>`;
}

/* statistiques.html — 3 vignettes photo (comportement historique inchangé) */
function ekRenderHommeDuMatch(liste){
    if(!liste) return;
    const trie = [...liste].sort((a,b) => (a.jour_numero||0) - (b.jour_numero||0));
    if(EK_HM_INTERVAL) clearInterval(EK_HM_INTERVAL);
    EK_HM_INTERVAL = ekMonterCarrousel(trie.map(ekVignetteHomme), "hm-slider", "hm-dots");
}

/* accueil — 6 vignettes : 3 hommes du match + 3 affiches (data/stats.json,
   cle "affiches_a_la_une", qui reference des id de data/scores.json —
   une seule source de verite, pas de duplication de score a la main) */
let EK_HM_ACCUEIL_INTERVAL = null;
function ekRenderVitrineAccueil(hommesDuMatch, affichesRefs, scoresData){
    const slider = document.getElementById("hm-slider-accueil");
    if(!slider || !hommesDuMatch) return;

    const vignettesHommes = [...hommesDuMatch]
        .sort((a,b) => (a.jour_numero||0) - (b.jour_numero||0))
        .map(ekVignetteHomme);

    let vignettesAffiches = [];
    if(affichesRefs && scoresData && scoresData.matchs){
        vignettesAffiches = affichesRefs
            .map(ref => scoresData.matchs.find(m => m.id === ref.match_id))
            .filter(Boolean)
            .map(ekVignetteAffiche);
    }

    const toutes = [...vignettesHommes, ...vignettesAffiches];
    if(EK_HM_ACCUEIL_INTERVAL) clearInterval(EK_HM_ACCUEIL_INTERVAL);
    EK_HM_ACCUEIL_INTERVAL = ekMonterCarrousel(toutes, "hm-slider-accueil", "hm-dots-accueil");
}

/* ---------- INITIALISATION ---------- */
document.addEventListener("DOMContentLoaded", async () => {

    const teams = await ekFetchJSON("data/teams.json");
    if(teams){
        EK_TEAMS_INDEX = {};
        teams.forEach(t => EK_TEAMS_INDEX[t.nom] = t);
        ekRenderEquipesAccueil(teams);
    }

    async function rafraichirTout(){
        const [standings, scores, stats, annonces] = await Promise.all([
            ekFetchJSON("data/standings.json"),
            ekFetchJSON("data/scores.json"),
            ekFetchJSON("data/stats.json"),
            ekFetchJSON("data/annonces.json")
        ]);
        if(standings){ ekRenderClassementComplet(standings); ekRenderClassementMini(standings); }
        if(scores){
            ekGenererFiltresJournees(scores);
            const filtreActif = document.querySelector(".filtre-jour.actif");
            ekRenderCalendrier(scores, filtreActif ? filtreActif.dataset.jour : "tous");
            ekRenderProchainMatch(scores);
            ekRenderTicker(scores);
        }
        if(stats) ekRenderStats(stats);
        if(stats && scores) ekRenderVitrineAccueil(stats.hommes_du_match, stats.affiches_a_la_une, scores);
        if(annonces && annonces.communiques) ekRenderAnnoncesAccueil(annonces.communiques);

        const maj = (scores && scores.maj) || (standings && standings.maj);
        if(maj) document.querySelectorAll(".ek-derniere-maj").forEach(el => el.textContent = "Dernière mise à jour : " + maj);

        if(window.activerReveal) window.activerReveal();
    }

    await rafraichirTout();
    setInterval(rafraichirTout, EK_REFRESH_MS);

    /* filtres de journee sur la page calendrier — delegation d'evenements,
       fonctionne meme si les boutons sont generes apres coup depuis scores.json */
    const conteneurFiltres = document.getElementById("filtres-jour-calendrier");
    if(conteneurFiltres){
        conteneurFiltres.addEventListener("click", async (e) => {
            const btn = e.target.closest(".filtre-jour");
            if(!btn) return;
            document.querySelectorAll(".filtre-jour").forEach(b => b.classList.remove("actif"));
            btn.classList.add("actif");
            const scores = await ekFetchJSON("data/scores.json");
            if(scores) ekRenderCalendrier(scores, btn.dataset.jour);
            if(window.activerReveal) window.activerReveal();
        });
    }
});
