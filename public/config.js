// Único lugar para trocar nome da marca, contato, vídeo e IDs. Nada aqui é segredo.
window.SITE = {
  brand: 'Achei Moda',         // nome da marca
  instagram: 'acheeimoda',     // sem @. Vazio = não mostra
  metaPixelId: '',             // ID do pixel do Meta. Vazio = não carrega o pixel
  ownerName: '',               // nome de quem responde pelo grupo (pessoa física), aparece nos Termos e na Privacidade
  contactEmail: '',            // e-mail público de contato (LGPD e dúvidas)
  videoUrl: '',                // vídeo de apresentação (vertical). Aceita link do YouTube (watch, shorts, youtu.be) ou arquivo .mp4. Vazio = mostra o espaço reservado
  showCounterFrom: 500,        // só mostra "mais de X pessoas" quando o total real passar disso
  showSlotsBelow: 150,         // só mostra "restam X vagas" quando o grupo atual tiver essa quantidade ou menos
  lastUpdate: '12/11/2026'     // data exibida nas páginas legais
};
