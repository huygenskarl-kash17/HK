/* =========================================================
   TÉLÉCHARGEMENT DU CALENDRIER — PDF ou IMAGE
   Capture la zone #calendrier-liste (le programme actuellement affiché,
   selon le filtre "jour" choisi par le visiteur) et propose de la
   télécharger en image PNG ou en document PDF.
   ========================================================= */

function ekNomFichier(extension){
    const filtreActif = document.querySelector(".filtre-jour.actif");
    const suffixe = (filtreActif && filtreActif.dataset.jour !== "tous") ? "-jour-" + filtreActif.dataset.jour : "-complet";
    return "programme-entente-kipushi" + suffixe + "." + extension;
}

function ekToast(message){
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

async function ekCapturerCalendrier(){
    const cible = document.getElementById("calendrier-liste");
    if(!cible || typeof html2canvas === "undefined"){
        ekToast("Le téléchargement n'a pas pu démarrer, réessaie dans un instant.");
        return null;
    }
    return await html2canvas(cible, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const btnPdf = document.getElementById("btn-telecharger-pdf");
    const btnImg = document.getElementById("btn-telecharger-img");

    if(btnImg){
        btnImg.addEventListener("click", async () => {
            ekToast("Préparation de l'image...");
            const canvas = await ekCapturerCalendrier();
            if(!canvas) return;
            const lien = document.createElement("a");
            lien.download = ekNomFichier("png");
            lien.href = canvas.toDataURL("image/png");
            lien.click();
        });
    }

    if(btnPdf){
        btnPdf.addEventListener("click", async () => {
            ekToast("Préparation du PDF...");
            const canvas = await ekCapturerCalendrier();
            if(!canvas || typeof window.jspdf === "undefined"){
                ekToast("Le PDF n'a pas pu être généré, réessaie dans un instant.");
                return;
            }
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "a4"
            });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const marge = 24;
            const imgW = pageW - marge * 2;
            const imgH = (canvas.height * imgW) / canvas.width;

            pdf.setFontSize(16);
            pdf.text("Entente de Kipushi — Programme de la compétition", marge, marge + 10);

            let positionY = marge + 26;
            let hauteurRestante = imgH;
            let decoupeY = 0;
            const imgData = canvas.toDataURL("image/png");
            const hauteurPageDispo = pageH - marge * 2 - 26;

            if(imgH <= hauteurPageDispo){
                pdf.addImage(imgData, "PNG", marge, positionY, imgW, imgH);
            } else {
                /* Découpe l'image sur plusieurs pages si le calendrier est long */
                const ratioPxParPt = canvas.height / imgH;
                let pageIndex = 0;
                while(hauteurRestante > 0){
                    const hauteurPage = Math.min(hauteurPageDispo, hauteurRestante);
                    const sourceY = decoupeY * ratioPxParPt;
                    const sourceH = hauteurPage * ratioPxParPt;

                    const pageCanvas = document.createElement("canvas");
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceH;
                    const ctx = pageCanvas.getContext("2d");
                    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);

                    if(pageIndex > 0) pdf.addPage();
                    const yDepart = pageIndex === 0 ? positionY : marge;
                    pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", marge, yDepart, imgW, hauteurPage);

                    decoupeY += hauteurPage;
                    hauteurRestante -= hauteurPage;
                    pageIndex++;
                }
            }

            pdf.save(ekNomFichier("pdf"));
        });
    }
});
