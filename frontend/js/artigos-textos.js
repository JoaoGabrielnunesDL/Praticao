// Textos de destaque das telas de artigo (bloco entre os cartões numerados e o aviso "Importante").
// A chave é o id do artigo em artigos-dados.js. Para um artigo novo, basta acrescentar uma entrada aqui;
// artigo sem entrada simplesmente não mostra o bloco. Formato: { titulo, paragrafos: [...], fecho }.
// Texto informativo e geral: não substitui a consulta ao médico-veterinário.

const TEXTOS_ARTIGOS = {
  // ---------------- ALIMENTAÇÃO ----------------
  1: {
    titulo: 'A ração certa é o investimento que mais retorna em saúde',
    paragrafos: [
      `Parece só mais um item na lista de compras, mas a ração é, na prática, aquilo que o seu pet vai consumir todos os dias durante anos. Cada grão carrega nutrientes que viram ossos fortes, músculos firmes, pelos bonitos e energia para correr atrás da bolinha. Escolher bem não é gastar mais: é gastar com inteligência, porque uma alimentação adequada ajuda a manter o corpo equilibrado e a evitar desconfortos que pesam no bolso e no coração.`,
      `O primeiro segredo é olhar para quem vai comer. Filhotes, adultos e idosos têm necessidades diferentes, assim como cães e gatos, raças pequenas e grandes, animais muito ativos ou mais sedentários. Uma ração feita para a fase errada pode faltar onde o corpo mais precisa ou sobrar onde ele já tem de sobra. Respeitar a espécie, a idade e o porte é o primeiro passo para acertar.`,
      `O segundo segredo está no rótulo. Aprenda a ler a lista de ingredientes e a composição garantida, observe se a embalagem informa que o alimento é completo e balanceado e confira sempre a validade. Embalagens bonitas e promessas exageradas não substituem informação clara. Na dúvida, compare opções e lembre-se: o produto mais caro nem sempre é o mais indicado para o seu pet.`,
      `O terceiro segredo é observar o próprio animal. Fezes bem formadas, pelagem macia, bom apetite e disposição para brincar são sinais de que a escolha deu certo. Se notar coceira, vômitos ou queda de pelos, converse com o veterinário antes de trocar por conta própria. E, quando precisar mudar de marca, faça a transição aos poucos, misturando a ração nova à antiga ao longo de cerca de uma semana.`,
      `Existe uma ração que combina com o seu melhor amigo, e ela está mais perto do que você imagina. Dedique alguns minutos para pesquisar, tire dúvidas com quem entende e escolha com a mesma atenção com que escolheria a sua própria comida. Seu pet não pode opinar, mas vai agradecer em disposição, saúde e muitos anos de companhia.`,
    ],
    fecho: 'A melhor ração é aquela que combina com a vida, a idade e a saúde do seu pet.',
  },
  2: {
    titulo: 'O que parece inofensivo para você pode ser perigoso para ele',
    paragrafos: [
      `Quem convive com um cão ou um gato conhece a cena: você está comendo e, de repente, aparecem dois olhinhos pedindo um pedacinho. É difícil resistir, e a vontade de agradar é uma prova de amor. Mas o organismo dos animais funciona de forma muito diferente do nosso, e vários alimentos comuns na cozinha de casa podem causar intoxicações sérias, mesmo em pequenas quantidades.`,
      `Chocolate e cacau, café e outros produtos com cafeína, cebola, alho, uvas, uvas-passas e alimentos com xilitol, um adoçante presente em balas, gomas e alguns produtos “zero açúcar”, estão entre os grandes vilões. Ossos cozidos podem lascar e machucar a boca e o intestino. Comidas muito gordurosas, salgadas ou temperadas também fazem mal. O problema é que os sintomas nem sempre aparecem na hora e, quando surgem, o quadro pode já estar avançado.`,
      `Por isso, prevenir é a melhor estratégia. Mantenha esses alimentos fora do alcance, feche bem o lixo e avise visitas e crianças sobre o que não deve ser oferecido. Em vez de dividir o prato, tenha petiscos próprios à mão, pensados para a espécie e para o tamanho do seu pet. Assim você mantém o carinho e elimina o risco, sem precisar encarar aquele olhar de “só um pedacinho”.`,
      `Lembre-se também de que cães e gatos não são iguais. Os gatos são carnívoros estritos, especialmente sensíveis a cebola e alho, e não devem receber alimentação feita para cães. Se, mesmo com todo o cuidado, houver suspeita de que seu animal comeu algo perigoso, não espere os sintomas nem tente soluções caseiras. Procure imediatamente um médico-veterinário e informe o que foi ingerido, a quantidade aproximada e o horário.`,
      `Agir rápido muitas vezes faz toda a diferença entre um susto e uma tragédia. Ter informação é uma das formas mais bonitas de proteger quem depende de você. Guarde esta lista, compartilhe com a família e transforme cada refeição em um momento seguro e feliz. Seu pet confia em você para escolher por ele, e esse cuidado começa pelo que vai (ou não vai) parar no potinho.`,
    ],
    fecho: 'Na dúvida, não ofereça. Seu pet confia em você para protegê-lo.',
  },
  3: {
    titulo: 'Cada refeição é uma forma de dizer: eu cuido de você',
    paragrafos: [
      `Quando você enche o potinho do seu pet, está fazendo muito mais do que matar a fome dele. Está construindo, dia após dia, a base da saúde, da energia e da longevidade de quem divide a vida com você. A alimentação é o hábito mais repetido na rotina de qualquer animal e, por isso mesmo, é o que mais pesa no resultado final. Um pet bem alimentado costuma ter pelagem bonita, disposição para brincar e digestão tranquila.`,
      `A boa notícia é que cuidar bem não exige fórmulas complicadas. Exige constância. Horários regulares ensinam o organismo a trabalhar com previsibilidade e evitam aquele comportamento de pedir comida o tempo todo. Porções corretas protegem contra o excesso de peso, um dos problemas silenciosos que mais prejudicam cães e gatos. E a água fresca, sempre limpa e disponível, sustenta o funcionamento do corpo sem que você perceba.`,
      `Sabemos como é difícil resistir àqueles olhos pidões. Um petisco aqui, uma sobra do prato ali, tudo parece inofensivo, mas pequenas concessões diárias viram grandes consequências em poucos meses. Amar também é saber dizer não com carinho, escolhendo recompensas pequenas e ocasionais, que fortalecem o vínculo sem pesar na balança.`,
      `Lembre-se ainda de que seu pet muda com o tempo. O filhote precisa de mais refeições ao longo do dia para crescer forte, o adulto de equilíbrio e o idoso de atenção redobrada. Observar o corpo dele, o apetite e a disposição é a melhor forma de ajustar a rota antes que um problema apareça, e o veterinário é o melhor aliado quando houver qualquer dúvida.`,
      `Use as dicas desta página como ponto de partida e transforme-as em rotina. Você não precisa mudar tudo hoje: comece por um horário fixo, uma medida correta e uma vasilha de água renovada. Seu pet não sabe agradecer em palavras, mas vai agradecer em anos a mais de brincadeiras, colo e companhia.`,
    ],
    fecho: 'Pequenos hábitos hoje, muitos anos de companhia amanhã.',
  },
  4: {
    titulo: 'Nem de menos, nem demais: a medida certa do amor',
    paragrafos: [
      `Muita gente acredita que um pet bem alimentado é aquele que está sempre com o pratinho cheio. Na realidade, o excesso é um dos maiores inimigos da saúde animal. O sobrepeso sobrecarrega as articulações, afeta o coração, favorece o diabetes e tira a vontade de brincar. O mais surpreendente é que muitos tutores só percebem o problema quando ele já está instalado, porque o ganho de peso acontece aos poucos.`,
      `Conhecer a quantidade ideal começa pela embalagem, que traz uma tabela baseada no peso e na idade do animal. Ela é um excelente ponto de partida, mas não é uma regra absoluta. Pets muito ativos podem precisar de um pouco mais, enquanto os mais sedentários tendem a precisar de menos. Por isso, observar o corpo do seu companheiro é tão importante quanto seguir os números.`,
      `Um truque simples: ao passar a mão no seu pet, você deve conseguir sentir as costelas sem que fiquem salientes, e notar uma leve cintura quando olha de cima. Se isso estiver desaparecendo, é hora de rever as porções. Se o peso cair sem motivo, também vale investigar. Use sempre um copo medidor em vez de calcular “no olho”: aquela mãozinha a mais todos os dias pode virar quilos extras ao longo do ano.`,
      `Vale ainda dividir a quantidade total do dia em duas ou mais refeições e lembrar que os petiscos entram na conta. Se ele recebeu muitos agrados, a refeição pode ser um pouco menor. Acompanhar o peso de tempos em tempos ajuda a corrigir o rumo cedo, antes que o problema ganhe força.`,
      `Dar a medida certa é um cuidado que não aparece de imediato, mas se revela em anos de vitalidade. A quantidade ideal muda com a idade, a atividade e a saúde, e o veterinário pode indicar o valor exato para o seu pet. Seu melhor amigo merece envelhecer leve, ágil e feliz ao seu lado.`,
    ],
    fecho: 'A medida certa hoje garante mais energia e mais anos juntos.',
  },
  5: {
    titulo: 'Um gole por dia que faz toda a diferença',
    paragrafos: [
      `É fácil esquecer, mas a água é um dos itens mais importantes da vida do seu pet. Ela ajuda na digestão, regula a temperatura do corpo e mantém os rins funcionando como devem. Uma tigela limpa e cheia parece um detalhe simples, mas é um dos gestos de cuidado que mais trazem retorno, todos os dias, sem custar quase nada.`,
      `O desafio é que nem todo animal bebe o quanto precisa por conta própria. Os gatos, em especial, costumam beber pouco, e isso pede um olhar atento do tutor. A ração úmida ajuda a completar a hidratação, e muitos gatos se encantam com bebedouros do tipo fonte, que oferecem água corrente e fresca. Às vezes, um pequeno ajuste na rotina muda tudo.`,
      `Comece pelo básico: troque a água todos os dias e lave o pote com frequência, porque água parada e vasilha suja afastam o pet. Espalhe potes em lugares diferentes da casa, para que a água esteja sempre ao alcance, sem que ele precise procurar. Pequenas mudanças como essas costumam aumentar o consumo de forma natural, sem esforço e sem brigas.`,
      `Nos dias quentes, e depois de brincadeiras e passeios, a necessidade aumenta, e é nessas horas que a água à disposição faz mais falta. Leve uma garrafinha e um potinho dobrável quando sair e ofereça água fresca na volta. Observe também os hábitos do seu pet: ele sabe dizer, do jeito dele, quando algo mudou.`,
      `Por isso, fique atento: se o seu pet passar a beber muito mais ou muito menos água que o normal, procure o veterinário, porque essa mudança pode ser um sinal importante. Cuidar da hidratação é cuidar de muita coisa ao mesmo tempo. Encha o pote agora mesmo e transforme esse gesto em um ritual de carinho que se repete todos os dias.`,
    ],
    fecho: 'Água fresca todos os dias: o cuidado mais simples, com o maior retorno.',
  },
  6: {
    titulo: 'Mudar sem sustos: a transição gentil que a barriga do seu pet agradece',
    paragrafos: [
      `Chegou a hora de trocar a ração. Talvez a marca antiga saiu de linha, talvez o pet entrou em uma nova fase da vida, talvez você simplesmente encontrou uma opção melhor. Seja qual for o motivo, existe um detalhe que muita gente ignora e que faz toda a diferença: a troca não deve ser feita de um dia para o outro. O organismo do seu pet precisa de tempo para se acostumar ao novo alimento.`,
      `Quando a mudança é brusca, o resultado costuma aparecer na forma de vômito, diarreia e desconforto na barriga. Além do mal-estar do seu pet, sobram a preocupação, a limpeza e a sensação de que a ração nova “não deu certo”, quando na verdade o problema estava no ritmo da troca. A boa notícia é que evitar tudo isso é simples e não custa nada.`,
      `O segredo é a transição gradual. Nos primeiros dias, misture uma pequena parte da ração nova com a antiga. A cada dia, aumente um pouco a quantidade da nova e diminua a da antiga. Em cerca de uma semana, o seu pet já estará comendo só a ração nova, sem sustos e sem estranhar o sabor, o cheiro ou o formato dos grãos.`,
      `Durante todo esse período, seja um bom observador. Olhe as fezes, o apetite e a disposição do seu pet. Se tudo estiver tranquilo, siga em frente. Se houver vômito ou diarreia que não melhora, volte a falar com o veterinário antes de continuar. Filhotes e animais doentes são mais sensíveis, por isso peça orientação antes de trocar o alimento deles.`,
      `Paciência é a palavra-chave. Alguns dias de atenção agora poupam semanas de desconforto depois e ainda ajudam o seu pet a aceitar com gosto o novo alimento. Faça a troca com calma, acompanhe cada refeição e comemore cada prato limpo: é assim que uma simples mudança se transforma em mais saúde para quem você ama.`,
    ],
    fecho: 'Troca gradual, barriga tranquila e um pet feliz com o prato novo.',
  },

  // ---------------- PASSEIOS ----------------
  7: {
    titulo: 'Um passeio seguro é um passeio que vale a pena repetir',
    paragrafos: [
      `O passeio é um dos melhores momentos do dia, tanto para você quanto para o seu pet. É hora de gastar energia, explorar cheiros novos, encontrar vizinhos e fortalecer o vínculo entre vocês. Mas, para que esse momento seja só alegria, ele precisa de um ingrediente que não aparece na foto: o cuidado. Com alguns hábitos simples, o passeio fica tranquilo e muito mais divertido.`,
      `Tudo começa pelo equipamento. Use coleira ou peitoral bem ajustados e uma guia de tamanho adequado, e evite guias extensíveis em locais com muito movimento, onde o pet pode se afastar demais em segundos. Uma plaquinha de identificação com o seu telefone é pequena, barata e pode ser a diferença entre um susto de minutos e uma busca de dias.`,
      `Depois, pense no horário e no clima. Em dias quentes, prefira o início da manhã ou o fim da tarde, quando o chão e o ar estão mais amenos. Leve sempre água para o seu pet beber ao longo do caminho. O calor pesa muito mais para os animais do que para nós, e um bom planejamento evita problemas antes que eles apareçam.`,
      `No caminho, mantenha a atenção. Cuidado com o trânsito, com bicicletas e com outros animais, e evite que o pet coma coisas do chão, que podem machucar ou fazer mal. Recolher as fezes é um gesto de respeito com a cidade e com quem passa depois de você. E observe o seu companheiro: se ele demonstrar cansaço excessivo, falta de ar ou vontade de parar, interrompa o passeio sem culpa.`,
      `Passeios seguros não precisam ser longos nem complicados, só precisam ser pensados. Quando você se prepara, o seu pet percebe e se sente protegido ao seu lado. Pegue a guia, confira o equipamento, leve a água e vá! Cada volta pelo quarteirão, quando feita com cuidado, é uma lembrança boa que vocês dois constroem juntos.`,
    ],
    fecho: 'Preparar o passeio é o primeiro passo para voltar para casa feliz.',
  },
  8: {
    titulo: 'Passear com um gato é possível, mas começa dentro de casa',
    paragrafos: [
      `Quem tem gato sabe: eles têm personalidade de sobra. Por isso, a pergunta “gato pode passear?” não tem uma resposta única. Alguns se encantam com a ideia de explorar o mundo do lado de fora com o tutor por perto, outros preferem a segurança do sofá. E está tudo bem: nem todo gato vai gostar, e respeitar o jeito dele já é uma forma de amar.`,
      `Se você quer tentar, o segredo é a adaptação gradual. Comece deixando o gato se acostumar com o peitoral dentro de casa, em momentos tranquilos, associando o equipamento a coisas boas. Só depois faça pequenas saídas em locais calmos. Cada etapa pode levar dias ou semanas, e não há problema nenhum nisso. O ritmo certo é o dele, nunca o nosso.`,
      `O equipamento também importa. Use um peitoral próprio para gatos, que não escapa com facilidade, e uma guia, e nunca solte a guia: gatos se assustam com facilidade e podem fugir em segundos. Mantenha vacinas e proteção contra pulgas e carrapatos em dia, porque a rua traz desafios que a casa não tem.`,
      `Aprenda a ler os sinais. Se o gato se esconder, tremer ou ficar paralisado, está na hora de voltar para casa, sem insistir. Prefira locais silenciosos, longe de cães e de barulho, e comece com saídas curtas. A experiência precisa ser agradável para ele, ou não vale a pena.`,
      `E se o seu gato preferir não sair, tudo bem. Gatos que moram em apartamento podem ser muito felizes com outras formas de estímulo, como prateleiras, arranhadores e brinquedos. O que importa é oferecer um ambiente rico, seguro e cheio de carinho. Seja qual for o caminho, observar e respeitar o seu gato é a melhor forma de descobrir o que o faz feliz.`,
    ],
    fecho: 'Com paciência e respeito ao ritmo dele, cada gato encontra o seu jeito de ser feliz.',
  },
  9: {
    titulo: 'Um passeio por dia faz bem ao corpo e à mente do seu pet',
    paragrafos: [
      `Quando o relógio aperta, é tentador deixar o passeio para depois. Mas, para o seu pet, aquele momento na rua é muito mais do que fazer as necessidades: é a parte mais esperada do dia, o encontro entre o corpo que precisa se mover e a mente que precisa descobrir. Um pet que passeia é um pet que vive de verdade, e você faz parte de cada passo dessa história.`,
      `Começando pelo corpo: o exercício ajuda a manter o peso e a saúde das articulações e reduz o sedentarismo, um dos grandes vilões da vida dentro de casa. Já para a mente, cheirar e explorar o ambiente é um estímulo importantíssimo. Para os cães, o olfato é uma janela para o mundo, e cada esquina é uma leitura nova que o deixa atento e satisfeito.`,
      `Os efeitos aparecem também no comportamento. Pets que passeiam costumam ser mais calmos em casa, porque gastaram energia e tiveram a curiosidade atendida. O passeio ajuda ainda na socialização com pessoas e outros animais e diminui o tédio, que muitas vezes se transforma em latidos, bagunça e móveis destruídos. Um pet cansado e satisfeito é um pet mais tranquilo.`,
      `E a frequência? Depende do porte, da idade e da energia de cada animal. Filhotes e idosos precisam de passeios mais curtos, enquanto os mais jovens e ativos pedem mais movimento. Raças de focinho curto e animais com problemas de saúde cansam mais rápido, então vale pedir orientação ao veterinário. O importante é ouvir o seu pet e ajustar o passeio ao que ele pode e gosta de fazer.`,
      `O passeio faz bem para você também: tira do sofá, areja a cabeça e cria um compromisso diário de carinho. Que tal começar hoje? Pegue a guia, chame o seu companheiro e descubram juntos o que o mundo tem a oferecer. Ele vai agradecer com o rabo abanando, e você vai perceber que esses minutos viraram o melhor momento do seu dia.`,
    ],
    fecho: 'Todo dia é dia de passeio: o melhor momento é aquele que vocês vivem juntos.',
  },
  10: {
    titulo: 'Alguns minutos antes de sair evitam muita preocupação depois',
    paragrafos: [
      `A porta está aberta, a guia na mão e o seu pet pulando de alegria. É nessa hora que a pressa costuma vencer o cuidado. Mas uma checagem rápida antes de sair leva poucos minutos e evita problemas durante e depois do passeio. É um hábito simples, que protege a saúde do seu pet e a sua tranquilidade.`,
      `O primeiro cuidado é manter a saúde em dia. Mantenha as vacinas e a vermifugação atualizadas e use proteção contra pulgas e carrapatos, conforme a indicação do veterinário. Na rua, o seu pet fica exposto a muita coisa que a gente nem vê, e a prevenção é sempre o melhor caminho. Atenção especial aos filhotes: eles só devem sair para a rua depois de completarem o esquema de vacinação indicado pelo veterinário.`,
      `Antes de sair, evite passear logo depois de uma refeição grande, para não causar desconforto. Confira se a coleira e a guia estão firmes, sem folgas e sem partes desgastadas. Leve saquinhos para recolher as fezes e água para o seu pet beber no caminho. Uma pequena lista mental, repetida todos os dias, vira hábito em pouco tempo.`,
      `O cuidado continua na volta. Olhe as patas e o pelo do seu pet com calma, procurando carrapatos, feridas ou espinhos que possam ter ficado grudados. Ofereça água fresca e deixe que ele descanse. Esses poucos minutos permitem encontrar qualquer problema cedo, quando ainda é simples de resolver.`,
      `Cuidar antes é sempre mais fácil do que remediar depois. Com a rotina certa, o passeio deixa de ser fonte de preocupação e volta a ser o que deveria ser: diversão, exercício e carinho. Da próxima vez que pegar a guia, respire fundo, faça a checagem e saia tranquilo. Seu pet merece um passeio feliz, e você merece a certeza de que fez tudo para protegê-lo.`,
    ],
    fecho: 'Quem se prepara antes de sair aproveita muito mais na rua.',
  },
  11: {
    titulo: 'O equipamento certo transforma o passeio em puro prazer',
    paragrafos: [
      `Já reparou como um passeio muda quando tudo está no lugar? A guia firme, o peitoral confortável, a água à mão. Os equipamentos certos deixam o passeio mais confortável e seguro, tanto para o seu pet quanto para você. Mais do que acessórios, eles são ferramentas de proteção, e escolher bem é uma forma de demonstrar cuidado antes mesmo de sair de casa.`,
      `O básico não pode faltar: uma coleira ou peitoral do tamanho certo, uma guia curta e resistente para o dia a dia e uma plaquinha de identificação com nome e telefone. Um truque simples para conferir o ajuste: devem caber dois dedos entre o equipamento e o pescoço. Nem tão solto que escape, nem tão apertado que incomode.`,
      `Depois do básico, existem itens que ajudam muito. Saquinhos para recolher as fezes mostram respeito pelos espaços que todos dividem. Uma garrafinha com água e um potinho dobrável garantem hidratação em qualquer lugar. E, se o seu pet sentir frio, uma capa de chuva ou uma roupinha podem deixar o passeio agradável também nos dias mais frescos.`,
      `Fique atento ao desgaste. Equipamentos usados todos os dias sofrem com o tempo: costuras que cedem, fivelas que enfraquecem, tecidos que racham. Troque o que estiver desgastado ou apertado, porque um peitoral que não serve mais pode machucar ou deixar o pet escapar. Se o seu pet cresceu ou mudou de peso, revise o ajuste.`,
      `Investir em bons equipamentos não é gastar à toa: é prevenir sustos, acidentes e machucados. Vale o cuidado de escolher o modelo certo para o porte e o jeito do seu pet e de manter tudo em ordem. Quando cada item está no lugar, só sobra o essencial: vocês dois, o caminho pela frente e a vontade de aproveitar cada passo.`,
    ],
    fecho: 'Equipamento certo, ajuste certo e passeio muito mais tranquilo.',
  },
  12: {
    titulo: 'No calor, o cuidado precisa andar na frente',
    paragrafos: [
      `Dia de sol forte, céu azul e vontade de sair. Para nós, parece o cenário perfeito, mas para o seu pet o calor pode ser um perigo silencioso. Os animais suam muito menos do que nós e têm mais dificuldade para se refrescar, o que faz o calor se acumular no corpo mais rápido do que a gente imagina. Passear nessa época é possível e gostoso, desde que o planejamento venha primeiro.`,
      `Comece pelo horário: passeie no início da manhã ou à noite, quando o sol já não castiga. Evite o meio do dia, mesmo que o passeio seja curto. Quanto menos tempo o seu pet ficar exposto ao sol forte, melhor, e uma sombra no caminho faz muita diferença. Prefira grama e áreas com árvores sempre que puder.`,
      `Há um perigo que muita gente esquece: o chão. O asfalto e a calçada podem esquentar muito e machucar as patinhas. Faça o teste: encoste o dorso da mão no chão por alguns segundos. Se estiver quente para você, está quente para as patinhas do seu pet. É um gesto de poucos segundos que evita dor e ferimentos.`,
      `Leve água e ofereça com frequência, e aprenda a reconhecer os sinais de alerta: respiração muito ofegante, babação intensa, moleza ou gengivas muito vermelhas. Se perceber qualquer um deles, leve o pet para um lugar fresco, ofereça água e procure um veterinário. Quanto mais rápido você agir, melhor.`,
      `E uma regra que nunca deve ser quebrada: nunca deixe o pet dentro de um carro fechado, nem por poucos minutos. O interior esquenta rapidamente e o risco é muito grande. Com horário certo, chão fresco, água à vontade e atenção aos sinais, o calor deixa de ser um problema. O verão pode ser uma das melhores estações do ano para vocês, desde que o cuidado ande sempre na frente.`,
    ],
    fecho: 'Horário certo, chão fresco e água à vontade: o calor não precisa ser um problema.',
  },
};
