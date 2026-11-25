/* Painel do Administrador: parallax discreto dos pets (SOMENTE visual).
   - Ao rolar, os pets descem uma fração da rolagem (TAXA) até no máximo MAX px:
     andam mais devagar que o conteúdo, o que dá a sensação de profundidade.
   - O JS só grava a variável --adm-pets-y no <aside>; quem move é o CSS (translate 3D, sem mexer no layout).
   - Vale só a partir de 1280px (pets em coluna própria) e sem "reduzir movimento"; fora disso fica em 0. */
(() => {
  const pets = document.querySelector('.adm-pets');
  if (!pets) return;

  const TAXA = 0.30;      // 30% da rolagem
  const MAX = 60;         // deslocamento máximo, em px
  const SUAVE = 0.18;     // quanto se aproxima do alvo a cada quadro (suavização)
  const largo = window.matchMedia('(min-width: 1280px)');
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)');

  let atual = 0, alvo = 0, quadro = 0;
  const ativo = () => largo.matches && !calmo.matches;
  const aplicar = v => pets.style.setProperty('--adm-pets-y', v.toFixed(2) + 'px');

  function passo() {
    quadro = 0;
    atual += (alvo - atual) * SUAVE;
    if (Math.abs(alvo - atual) < 0.1) atual = alvo;
    aplicar(atual);
    if (atual !== alvo) quadro = requestAnimationFrame(passo);
  }

  function atualizar() {
    if (!ativo()) {
      if (quadro) cancelAnimationFrame(quadro);
      quadro = 0; atual = alvo = 0;
      pets.style.removeProperty('--adm-pets-y');
      return;
    }
    alvo = Math.min(MAX, Math.max(0, window.scrollY * TAXA));
    if (!quadro && atual !== alvo) quadro = requestAnimationFrame(passo);
  }

  window.addEventListener('scroll', atualizar, { passive: true });
  largo.addEventListener('change', atualizar);
  calmo.addEventListener('change', atualizar);
  atualizar();
})();
