// src/services/pdfService.js
import jsPDF from "jspdf";
import QRCode from "qrcode";

export const pdfService = {
  async generateTicketPDF(ticketData) {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 150], // Format ticket 80x150mm
    });

    try {
      // Générer le QR code d'abord
      const qrCodeDataURL = await this.generateQRCode(ticketData);

      // Couleurs
      const primaryColor = "#e53e3e"; // Rouge
      const secondaryColor = "#2d3748"; // Gris foncé
      const lightGray = "#f8f9fa"; // Gris très clair
      const mediumGray = "#718096"; // Gris moyen
      const darkGray = "#4a5568"; // Gris foncé

      // Configuration de base
      const margin = 5;
      let yPosition = margin;

      // En-tête - KIDS EVENTS
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor);
      doc.text("KIDS EVENTS", 40, yPosition + 5, { align: "center" });

      // Sous-titre - VILLAGE DE NOËL
      doc.setFontSize(14);
      doc.setTextColor(secondaryColor);
      doc.text("VILLAGE DE NOËL", 40, yPosition + 10, { align: "center" });

      yPosition += 15;

      // Ligne séparatrice
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, 75, yPosition);
      yPosition += 5;

      // Informations de base
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      doc.setFont("helvetica", "bold");
      doc.text("ID: ", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(ticketData.id, margin + 8, yPosition);
      yPosition += 5;

      doc.setFont("helvetica", "bold");
      doc.text("Date: ", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(
        new Date(ticketData.dateCreation).toLocaleDateString("fr-FR"),
        margin + 12,
        yPosition
      );
      yPosition += 5;

      doc.setFont("helvetica", "bold");
      doc.text("Heure: ", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(
        new Date(ticketData.dateCreation).toLocaleTimeString("fr-FR"),
        margin + 14,
        yPosition
      );
      yPosition += 8;

      // Détails du ticket - Zone avec fond gris
      doc.setFillColor(lightGray);
      doc.rect(margin, yPosition, 70, 25, "F");

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(secondaryColor);
      doc.text("DÉTAILS DU TICKET", 40, yPosition + 5, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      doc.setFont("helvetica", "bold");
      doc.text("Billets: ", margin + 2, yPosition + 12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${ticketData.nombreBillets} personne(s)`,
        margin + 16,
        yPosition + 12
      );

      doc.setFont("helvetica", "bold");
      doc.text("Prix total: ", margin + 2, yPosition + 17);
      doc.setFont("helvetica", "normal");
      doc.text(`${ticketData.prixTotal} FCFA`, margin + 20, yPosition + 17);

      doc.setFont("helvetica", "bold");
      doc.text("Paiement: ", margin + 2, yPosition + 22);
      doc.setFont("helvetica", "normal");
      doc.text(
        this.formatPaymentMethod(ticketData.typePaiement),
        margin + 20,
        yPosition + 22
      );

      if (ticketData.codePromo) {
        doc.setFont("helvetica", "bold");
        doc.text("Code promo: ", margin + 2, yPosition + 27);
        doc.setFont("helvetica", "normal");
        doc.text(ticketData.codePromo, margin + 25, yPosition + 27);
      }

      yPosition += 35;

      // Zone QR Code
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(secondaryColor);
      doc.text("SCANNEZ À L'ENTRÉE", 40, yPosition, { align: "center" });
      yPosition += 5;

      // Cadre autour du QR code
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(20, yPosition, 40, 40);

      if (qrCodeDataURL) {
        // Ajouter le vrai QR code (30x30mm au centre du cadre)
        doc.addImage(qrCodeDataURL, "PNG", 25, yPosition + 5, 30, 30);
      } else {
        // Fallback - rectangle avec texte QR CODE
        doc.setFillColor(lightGray);
        doc.rect(25, yPosition + 5, 30, 30, "F");
        doc.setFontSize(8);
        doc.setTextColor(darkGray);
        doc.text("QR CODE", 40, yPosition + 20, { align: "center" });
      }

      // Code unique en dessous du QR code
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(ticketData.codeUnique, 40, yPosition + 45, { align: "center" });
      yPosition += 50;

      // Pied de page
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, yPosition, 75, yPosition);
      yPosition += 5;

      doc.setFontSize(9);
      doc.setTextColor(mediumGray);
      doc.setFont("helvetica", "italic");
      doc.text("Présentez ce ticket à l'entrée de l'événement", 40, yPosition, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.text(
        `Ticket généré le ${new Date().toLocaleString("fr-FR")}`,
        40,
        yPosition + 4,
        { align: "center" }
      );

      // Sauvegarder le PDF
      const fileName = `ticket-${ticketData.id}.pdf`;
      doc.save(fileName);

      return fileName;
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      throw new Error("Impossible de générer le PDF");
    }
  },

  // Générer un QR code
  async generateQRCode(ticket) {
    try {
      const qrData = JSON.stringify({
        id: ticket.id,
        code: ticket.codeUnique,
        event: "Village de Noël KIDS EVENTS",
        tickets: ticket.nombreBillets,
        timestamp: ticket.dateCreation,
      });

      return await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Erreur génération QR code:", error);
      return null;
    }
  },

  formatPaymentMethod(method) {
    const methods = {
      cash: "Espèces",
      card: "Carte bancaire",
      "mobile-money": "Mobile Money",
    };
    return methods[method] || method;
  },
};

export default pdfService;
