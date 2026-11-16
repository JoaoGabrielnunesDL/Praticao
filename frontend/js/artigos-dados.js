// Conteúdo da área "Dicas e Curiosidades". A API ainda não tem artigos, então os textos ficam aqui,
// no mesmo formato que uma API devolveria (id, titulo, categoria, resumo, imagem, publicado, data_publicacao...).
// Para publicar uma nova dica basta acrescentar um item em ARTIGOS. "publicado: false" esconde o artigo do público.
// Os textos são informativos e gerais; não substituem a consulta ao veterinário.

const CATEGORIAS_DICAS = {
  alimentacao: { nome: 'Alimentação', icone: '🥣', descricao: 'Uma boa alimentação é essencial para uma vida longa e saudável.' },
  passeios: { nome: 'Passeios', icone: '🐕', descricao: 'Passeios são importantes para a saúde física e mental do seu pet.' },
};

const AVISO_VETERINARIO = 'Estas orientações são gerais e informativas. Elas não fazem diagnóstico e não substituem a consulta com um médico-veterinário, que avalia cada animal individualmente.';

const ARTIGOS = [
  // ---------------- ALIMENTAÇÃO ----------------
  {
    id: 1, categoria: 'alimentacao', destaque: true, publicado: true, data_publicacao: '2026-11-02', imagem: 'img/dicas/racao.jpg',
    titulo: 'Como escolher a ração ideal?',
    resumo: 'Descubra o que considerar na hora de escolher a ração do seu pet.',
    introducao: 'Existem muitos tipos de ração no mercado. A melhor escolha depende da fase de vida, do porte e das necessidades de cada animal.',
    topicos: [
      { titulo: 'Observe a fase de vida', itens: ['Filhotes precisam de rações próprias para crescimento.', 'Adultos e idosos têm necessidades diferentes de energia e nutrientes.', 'Prefira rações indicadas para a espécie: cães e gatos não têm as mesmas necessidades.'] },
      { titulo: 'Leia o rótulo', itens: ['Veja a lista de ingredientes e a composição garantida (proteínas, gorduras, fibras).', 'Confira se a embalagem diz que o alimento é completo e balanceado.', 'Verifique a validade e guarde a embalagem bem fechada.'] },
      { titulo: 'Considere o porte e a saúde', itens: ['Grãos menores costumam ser mais fáceis para raças pequenas.', 'Animais com alergias, sobrepeso ou doenças precisam de indicação do veterinário.', 'Qualidade nem sempre significa o produto mais caro: compare e peça orientação.'] },
    ],
    importante: 'Em caso de dúvida sobre qual ração escolher, converse com o veterinário do seu pet.',
  },
  {
    id: 2, categoria: 'alimentacao', destaque: true, publicado: true, data_publicacao: '2026-11-03', imagem: 'img/dicas/proibidos.jpg',
    titulo: 'Alimentos proibidos para cães e gatos',
    resumo: 'Conheça os alimentos que podem fazer mal para seu pet.',
    introducao: 'Alguns alimentos comuns na nossa casa podem ser perigosos para os animais. O melhor é nunca oferecer comida humana sem saber se ela é segura.',
    topicos: [
      { titulo: 'Perigosos para cães e gatos', itens: ['Chocolate e cacau, café e outros produtos com cafeína.', 'Cebola, alho e cebolinha, crus ou cozidos.', 'Uvas e uvas-passas (cães) e bebidas alcoólicas.', 'Alimentos com xilitol, um adoçante usado em balas, gomas e alguns produtos "zero açúcar".'] },
      { titulo: 'Outros cuidados', itens: ['Ossos cozidos ou que lascam podem machucar a boca e o intestino.', 'Alimentos muito gordurosos, salgados ou temperados fazem mal.', 'Muitos gatos e cães adultos têm dificuldade para digerir leite de vaca.', 'Caroços e sementes podem causar engasgo ou obstrução.'] },
      { titulo: 'Diferenças entre cães e gatos', itens: ['Os gatos são carnívoros estritos e não podem receber alimentação feita para cães.', 'Gatos são especialmente sensíveis a cebola e alho.'] },
    ],
    importante: 'Se você suspeita que seu pet comeu algo perigoso, não espere os sintomas: procure um veterinário imediatamente.',
  },
  {
    id: 3, categoria: 'alimentacao', destaque: true, publicado: true, data_publicacao: '2026-11-04', imagem: 'img/dicas/saudavel.jpg',
    titulo: 'Dicas para uma alimentação saudável',
    resumo: 'Pequenas atitudes fazem grande diferença!',
    introducao: 'Uma rotina alimentar organizada ajuda o pet a manter o peso e a saúde em dia.',
    topicos: [
      { titulo: 'Horários e frequência', itens: ['Filhotes comem mais vezes ao dia; adultos costumam comer duas vezes.', 'Mantenha horários regulares, sem deixar a comida disponível o dia todo.'] },
      { titulo: 'Porções e petiscos', itens: ['Siga a quantidade indicada na embalagem para o peso do animal.', 'Petiscos devem ser ocasionais e pequenos, para não causar sobrepeso.'] },
      { titulo: 'Água e idade', itens: ['Deixe sempre água limpa e fresca à disposição.', 'Ajuste o alimento conforme a idade: filhote, adulto ou idoso.', 'Observe o peso: mudanças bruscas merecem uma conversa com o veterinário.'] },
    ],
    importante: 'Mudanças na alimentação por causa de doenças devem ser orientadas por um veterinário.',
  },
  {
    id: 4, categoria: 'alimentacao', destaque: false, publicado: true, data_publicacao: '2026-11-05', imagem: 'img/dicas/racao.jpg',
    titulo: 'Quantidade ideal de alimento',
    resumo: 'Cuidados com as porções para manter o peso do seu pet.',
    introducao: 'Dar comida demais é tão ruim quanto dar de menos. O excesso de peso favorece problemas de articulações, coração e diabetes.',
    topicos: [
      { titulo: 'Como calcular', itens: ['Use a tabela da embalagem, que relaciona peso do animal e quantidade diária.', 'Divida a quantidade diária em duas ou mais refeições.', 'Use um copo medidor em vez de "no olho".'] },
      { titulo: 'Sinais de que a porção precisa de ajuste', itens: ['Costelas difíceis de sentir ao toque podem indicar excesso de peso.', 'Perda de peso sem motivo também deve ser investigada.'] },
    ],
    importante: 'A quantidade ideal muda com a idade, a atividade e a saúde. O veterinário pode indicar o valor certo para o seu pet.',
  },
  {
    id: 5, categoria: 'alimentacao', destaque: false, publicado: true, data_publicacao: '2026-11-06', imagem: 'img/dicas/saudavel.jpg',
    titulo: 'A importância da hidratação',
    resumo: 'Água fresca todos os dias faz parte do bem-estar.',
    introducao: 'A água ajuda na digestão, na temperatura do corpo e no funcionamento dos rins.',
    topicos: [
      { titulo: 'Como estimular o consumo', itens: ['Troque a água todos os dias e lave o pote com frequência.', 'Espalhe potes em lugares diferentes da casa.', 'Alguns gatos preferem bebedouros do tipo fonte.'] },
      { titulo: 'Atenção especial', itens: ['Gatos bebem pouca água; a ração úmida ajuda na hidratação.', 'No calor e depois de passeios, o pet precisa de mais água.'] },
    ],
    importante: 'Se o seu pet passar a beber muito mais ou muito menos água que o normal, procure o veterinário.',
  },
  {
    id: 6, categoria: 'alimentacao', destaque: false, publicado: true, data_publicacao: '2026-11-07', imagem: 'img/dicas/racao.jpg',
    titulo: 'Como trocar a ração do seu pet',
    resumo: 'A troca feita aos poucos evita desconforto na barriga.',
    introducao: 'Mudar a ração de uma vez pode causar vômito e diarreia. O ideal é fazer uma transição gradual.',
    topicos: [
      { titulo: 'Passo a passo', itens: ['Nos primeiros dias, misture uma pequena parte da ração nova com a antiga.', 'A cada dia, aumente a ração nova e diminua a antiga.', 'Em cerca de uma semana, o pet já come só a ração nova.'] },
      { titulo: 'Fique atento', itens: ['Observe fezes, apetite e disposição durante a troca.', 'Se houver vômito ou diarreia que não melhora, volte a falar com o veterinário.'] },
    ],
    importante: 'Filhotes e animais doentes são mais sensíveis. Peça orientação antes de trocar o alimento deles.',
  },

  // ---------------- PASSEIOS ----------------
  {
    id: 7, categoria: 'passeios', destaque: true, publicado: true, data_publicacao: '2026-11-08', imagem: 'img/dicas/passeio-seguro.jpg',
    titulo: 'Como tornar o passeio mais seguro?',
    resumo: 'Dicas para um passeio tranquilo e sem riscos.',
    introducao: 'Com alguns cuidados simples, o passeio fica seguro e divertido para você e para o seu pet.',
    topicos: [
      { titulo: 'Equipamentos', itens: ['Use coleira ou peitoral bem ajustados e guia de tamanho adequado.', 'Evite guias extensíveis em locais com muito movimento.', 'Mantenha uma plaquinha de identificação com o seu telefone.'] },
      { titulo: 'Horários e clima', itens: ['Prefira o início da manhã ou o fim da tarde em dias quentes.', 'Leve água para o pet beber durante o passeio.'] },
      { titulo: 'No caminho', itens: ['Atenção ao trânsito, a bicicletas e a outros animais.', 'Evite que o pet coma coisas do chão.', 'Recolha sempre as fezes do seu pet.'] },
    ],
    importante: 'Se o pet demonstrar cansaço excessivo, falta de ar ou vontade de parar, interrompa o passeio.',
  },
  {
    id: 8, categoria: 'passeios', destaque: true, publicado: true, data_publicacao: '2026-11-09', imagem: 'img/dicas/passeio-gatos.jpg',
    titulo: 'Passeio para gatos: é possível?',
    resumo: 'Saiba como adaptar passeios para seu felino.',
    introducao: 'Alguns gatos aceitam passear, mas isso exige paciência e adaptação. Nem todo gato vai gostar, e tudo bem.',
    topicos: [
      { titulo: 'Adaptação gradual', itens: ['Comece deixando o gato se acostumar com o peitoral dentro de casa.', 'Depois, faça pequenas saídas em locais calmos.', 'Nunca force: respeite o ritmo do seu gato.'] },
      { titulo: 'Equipamento e segurança', itens: ['Use peitoral próprio para gatos, que não escapa com facilidade, e guia.', 'Gatos podem se assustar e fugir: não solte a guia.', 'Mantenha vacinas e proteção contra pulgas e carrapatos em dia.'] },
      { titulo: 'Observe o comportamento', itens: ['Se o gato se esconder, tremer ou ficar paralisado, volte para casa.', 'Prefira locais silenciosos, longe de cães e de barulho.'] },
    ],
    importante: 'Gatos que moram em apartamento podem se beneficiar de outras formas de estímulo, como prateleiras, arranhadores e brinquedos.',
  },
  {
    id: 9, categoria: 'passeios', destaque: true, publicado: true, data_publicacao: '2026-11-10', imagem: 'img/dicas/passeio-diario.jpg',
    titulo: 'Benefícios dos passeios diários',
    resumo: 'Entenda por que o passeio é tão importante.',
    introducao: 'O passeio vai muito além de fazer as necessidades na rua: ele cuida do corpo e da mente do seu pet.',
    topicos: [
      { titulo: 'Corpo e mente', itens: ['Exercício físico ajuda a manter o peso e a saúde das articulações.', 'Cheirar e explorar o ambiente é um estímulo mental importante.'] },
      { titulo: 'Comportamento', itens: ['Pets que passeiam costumam ser mais calmos em casa.', 'O passeio ajuda na socialização com pessoas e outros animais.', 'Reduz o sedentarismo e o tédio.'] },
      { titulo: 'Frequência e duração', itens: ['A quantidade depende do porte, da idade e da energia do animal.', 'Filhotes e idosos precisam de passeios mais curtos.'] },
    ],
    importante: 'Raças de focinho curto e animais com problemas de saúde cansam mais rápido. Peça orientação ao veterinário.',
  },
  {
    id: 10, categoria: 'passeios', destaque: false, publicado: true, data_publicacao: '2026-11-11', imagem: 'img/dicas/passeio-seguro.jpg',
    titulo: 'Cuidados antes de sair',
    resumo: 'O que verificar antes de levar o pet para a rua.',
    introducao: 'Antes de sair, uma checagem rápida evita problemas durante e depois do passeio.',
    topicos: [
      { titulo: 'Saúde em dia', itens: ['Mantenha as vacinas e a vermifugação em dia.', 'Use proteção contra pulgas e carrapatos, conforme indicação do veterinário.'] },
      { titulo: 'Antes de sair', itens: ['Evite passear logo depois de uma refeição grande.', 'Confira se a coleira e a guia estão firmes.', 'Leve saquinhos para recolher as fezes e água para o pet.'] },
      { titulo: 'Na volta', itens: ['Olhe as patas e o pelo para procurar carrapatos, feridas ou espinhos.', 'Ofereça água fresca.'] },
    ],
    importante: 'Filhotes só devem sair para a rua depois de completarem o esquema de vacinação indicado pelo veterinário.',
  },
  {
    id: 11, categoria: 'passeios', destaque: false, publicado: true, data_publicacao: '2026-11-12', imagem: 'img/dicas/passeio-gatos.jpg',
    titulo: 'Equipamentos necessários para o passeio',
    resumo: 'Coleira, peitoral, guia e outros itens úteis.',
    introducao: 'Os equipamentos certos deixam o passeio mais confortável e seguro.',
    topicos: [
      { titulo: 'Itens básicos', itens: ['Coleira ou peitoral do tamanho certo (cabem dois dedos entre o equipamento e o pescoço).', 'Guia curta e resistente para o dia a dia.', 'Plaquinha de identificação com nome e telefone.'] },
      { titulo: 'Itens que ajudam', itens: ['Saquinhos para recolher as fezes.', 'Garrafinha com água e um potinho dobrável.', 'Capa de chuva ou roupinha, se o animal sentir frio.'] },
    ],
    importante: 'Troque equipamentos desgastados ou apertados: um peitoral que não serve mais pode machucar ou deixar o pet escapar.',
  },
  {
    id: 12, categoria: 'passeios', destaque: false, publicado: true, data_publicacao: '2026-11-13', imagem: 'img/dicas/passeio-diario.jpg',
    titulo: 'Passeios em dias quentes',
    resumo: 'Cuidados com o calor, o asfalto e a hidratação.',
    introducao: 'O calor pode ser perigoso para os animais, que suam muito menos do que nós.',
    topicos: [
      { titulo: 'Horário e piso', itens: ['Passeie no início da manhã ou à noite.', 'Encoste o dorso da mão no chão por alguns segundos: se estiver quente para você, está quente para as patinhas.', 'Prefira grama e áreas com sombra.'] },
      { titulo: 'Sinais de alerta', itens: ['Respiração muito ofegante, babação intensa, moleza ou gengivas muito vermelhas.', 'Nesses casos, leve o pet para um lugar fresco, ofereça água e procure um veterinário.'] },
    ],
    importante: 'Nunca deixe o pet dentro de um carro fechado, nem por poucos minutos.',
  },
];

// ---------- funções usadas pelas telas de dicas ----------
const semAcento = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dataLonga = iso => iso.split('-').reverse().join('/');

// Só artigos publicados aparecem para o público.
const artigosPublicados = () => ARTIGOS.filter(a => a.publicado);
const artigoPorId = id => artigosPublicados().find(a => a.id === Number(id));
const categoriaValida = c => Object.prototype.hasOwnProperty.call(CATEGORIAS_DICAS, c);

// Busca por título, resumo ou qualquer texto do artigo, sem diferenciar acentos nem maiúsculas.
// Compara o começo das palavras ("raç" acha "ração", mas não acha "duração").
const palavras = t => ' ' + semAcento(t).replace(/[^a-z0-9]+/g, ' ').trim();
function buscarArtigos(lista, termo) {
  const t = palavras(termo);
  if (!t.trim()) return lista;
  return lista.filter(a => palavras([a.titulo, a.resumo, a.introducao, ...a.topicos.flatMap(x => [x.titulo, ...x.itens])].join(' ').replace(/[^\p{L}\p{N}]+/gu, ' ')).includes(t));
}
