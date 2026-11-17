// Único lugar para trocar nome da marca, contato, vídeo e IDs. Nada aqui é segredo.
window.SITE = {
  brand: 'Achei Moda',         // nome da marca
  instagram: 'acheeimoda',     // sem @. Vazio = não mostra
  metaPixelId: '',             // ID do pixel do Meta. Vazio = não carrega o pixel
  ownerName: '',               // nome de quem responde pelo grupo (pessoa física), aparece nos Termos, na Privacidade e no rodapé
  contactEmail: '',            // e-mail público de contato (LGPD e dúvidas)
  videoUrl: '',                // vídeo de apresentação (vertical). Aceita link do YouTube (watch, shorts, youtu.be) ou arquivo .mp4. Vazio = mostra o espaço reservado
  printsGrupo: ['/prints/post-1.jpg', '/prints/post-2.jpg', '/prints/post-3.jpg', '/prints/post-4.jpg'],             // prints REAIS de posts do grupo (sem nomes ou telefones de terceiros). Ex.: ['/prints/1.jpg', '/prints/2.jpg']. Vazio = nao mostra. Se videoUrl estiver preenchido, o video tem prioridade
  testimonialImages: [],       // prints de depoimentos REAIS de participantes, com permissão. Ex.: ['/depoimentos/1.png', '/depoimentos/2.png']. Vazio = não mostra a seção
  showCounterFrom: 500,        // só mostra "mais de X pessoas" quando o total real passar disso
  showSlotsBelow: 150,         // só mostra "restam X vagas" quando o grupo atual tiver essa quantidade ou menos
  lastUpdate: '12/11/2026'     // data exibida nas páginas legais
};
