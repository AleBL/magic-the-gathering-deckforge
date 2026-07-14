# 🚀 DeckForge v5.0 — Prompts para "O App Mais Bonito e Funcional Possível"

> Documento de execução para elevar o `magic-the-gathering-deckforge` a uma versão **5.0 premium**.
> Stack real: **React 19 + Zustand (`src/store/useDeckStore.ts`) + Tailwind v4 + CSS custom em `src/style/*.css` + Electron/Vite + i18next + Dexie + recharts + scryfall-sdk**.
> Complementa (não substitui) `PROJECT_IMPROVEMENT_PLAN.md` (Fases 0–3: bugs, arquitetura base, responsividade inicial) e `DESIGN_IMPROVEMENT_PROMPTS.md` (fundação de tokens/CSS).
> **Pré-requisito:** conclua a Fase 0 (bugs) do plano antigo antes de começar aqui. As Fases A–F abaixo são a "camada premium" por cima de uma base sã.

---

## Como usar cada prompt

Cada bloco é **autocontido**. Para cada um:

1. Abra uma sessão do Claude Code **no modelo indicado** (`/model`).
2. Se houver uma **Skill ECC** indicada, invoque-a antes ou deixe eu invocar — muitas skills de review (`/ecc:react-review`, etc.) já disparam o agente correspondente internamente.
3. Cole o texto do bloco entre crases.
4. Todos terminam pedindo `yarn type-check && yarn lint` (o projeto usa **yarn**). Onde a fase adiciona testes, também `yarn test`.

**Modelos** — heurística usada aqui:
- **Opus 4.8** → arquitetura, design system, features complexas, refactors transversais.
- **Sonnet 5** → implementação focada, passadas diretas de UI/estilo.
- **Haiku 4.5** → mecânico (renomes, sync de docs, changelog).

**Agentes vs skills:** você pediu prompts "com as skills". Onde um agente dedicado agrega (ex.: `ecc:performance-optimizer`, `ecc:silent-failure-hunter`), ele está citado como **companheiro opcional** — só roda se você pedir explicitamente "usa o agente X", porque subagentes não são disparados sozinhos.

---

## Mapa de execução v5.0

| Fase | Prompt | Escopo | Skill ECC | Modelo | Prioridade |
|------|--------|--------|-----------|--------|------------|
| **A — Sustentabilidade** | A.1 | Fundação de testes (Vitest + RTL) | `/ecc:react-test` | Opus 4.8 | 🔴 |
| | A.2 | Type-safety & anti-`any` hardening | `/ecc:react-review` | Sonnet 5 | 🟠 |
| | A.3 | Dead code + consolidação | `/ecc:refactor-clean` | Sonnet 5 | 🟡 |
| | A.4 | Erros silenciosos & error boundaries | `/ecc:error-handling` | Sonnet 5 | 🟠 |
| | A.5 | Codemaps + docs vivas | `/ecc:update-codemaps` · `/ecc:update-docs` | Haiku 4.5 | 🟢 |
| **B — Design System Premium** | B.1 | Tokens semânticos + design system real | `/ecc:design-system` | Opus 4.8 | 🔴 |
| | B.2 | Estética premium (glass, profundidade, tipografia) | `/ecc:liquid-glass-design` · `/ecc:make-interfaces-feel-better` | Opus 4.8 | 🟠 |
| | B.3 | Overhaul de dataviz das estatísticas | `dataviz` | Sonnet 5 | 🟠 |
| **C — Motion & Efeitos** | C.1 | Fundação de motion (tokens, hover/press, page) | `/ecc:motion-ui` | Sonnet 5 | 🟠 |
| | C.2 | Efeitos avançados (flip de carta, ambient, partículas) | `/ecc:motion-advanced` | Opus 4.8 | 🟢 |
| **D — Responsivo & Mobile** | D.1 | Passada mobile-first global | `/ecc:make-interfaces-feel-better` | Sonnet 5 | 🔴 |
| | D.2 | PWA instalável (mobile de verdade) | `/ecc:vite-patterns` | Sonnet 5 | 🟠 |
| | D.3 | Toque, gestos & acessibilidade AA | `/ecc:accessibility` | Sonnet 5 | 🟠 |
| **E — Features v5.0** | E.1 | Deck Doctor (consistência + goldfish) | `/ecc:feature-dev` | Opus 4.8 | 🟢 |
| | E.2 | Coleção, wishlist & preços | `/ecc:feature-dev` | Opus 4.8 | 🟢 |
| | E.3 | Compartilhar & sincronizar deck | `/ecc:feature-dev` | Sonnet 5 | 🟢 |
| | E.4 | Assistente de deck com IA (Claude API) | `/ecc:feature-dev` + `claude-api` | Opus 4.8 | 🟢 |
| **F — Qualidade & Release** | F.1 | Performance & bundle | `/ecc:react-performance` | Opus 4.8 | 🟠 |
| | F.2 | Smoke E2E dos fluxos críticos | `/ecc:e2e-testing` | Sonnet 5 | 🟡 |
| | F.3 | Auditoria de segurança | `/ecc:security-review` | Sonnet 5 | 🟡 |
| | F.4 | Release v5.0 (changelog + versão) | `/ecc:git-workflow` | Haiku 4.5 | 🟢 |

**Ordem sugerida:** A.1 → A.2 → B.1 → B.2 → B.3 → C.1 → D.1 → D.2 → (resto por prioridade). B.1 antes de qualquer coisa visual (mexe em CSS compartilhado). E.* por último. F.* como gate antes do release.

---

# FASE A — Sustentabilidade & Manutenção

### Prompt A.1 — Fundação de testes (Vitest + React Testing Library)
**Modelo:** Opus 4.8 · **Skill:** `/ecc:react-test` · **Prioridade:** 🔴

> O projeto tem **zero testes**. Sem rede de segurança, todo refactor premium é arriscado. Esta é a base de tudo.

```
Invoque a skill /ecc:react-test. O projeto usa Vite + React 19 + TypeScript e NÃO tem nenhum teste ainda (nenhum *.test.* / *.spec.*). Configure a fundação e escreva os primeiros testes de comportamento.

1. Instale e configure Vitest + @testing-library/react + @testing-library/jest-dom + jsdom (dev deps), integrando com o Vite existente (vitest usa a mesma config). Adicione `test` e `test:watch` aos scripts do package.json. Configure ambiente jsdom e setup file com jest-dom.
2. Priorize testar LÓGICA pura primeiro (mais barato, mais valioso):
   - src/utils/deckGrouping.ts, deckValidator (agrupamento, contagem, validação de formato)
   - src/store/useDeckStore.ts (adicionar/remover carta, quantidades, zonas)
   - src/hooks/usePlaytestSimulator.ts (comprar, embaralhar, mover entre zonas)
   - src/utils/symbolHelper e translationHelper
3. Depois, 2–3 testes de componente focados em comportamento acessível (getByRole/getByText), não em detalhes de implementação: CardItem (render + clique adiciona ao deck), DeckStats (render sem crash com deck vazio e com deck real).
4. NÃO mire cobertura 100% agora — mire nas partes que os prompts seguintes vão refatorar (Fase A.3, B, C). Deixe um comentário TODO listando o que ficou sem teste.

Regras: nada de snapshots frágeis de árvore inteira; teste comportamento. Use dados de card mockados mínimos (não chame a Scryfall real). Ao final, `yarn test` deve passar 100% verde e `yarn type-check && yarn lint` limpos.
```

---

### Prompt A.2 — Type-safety & hardening anti-`any`
**Modelo:** Sonnet 5 · **Skill:** `/ecc:react-review` · **Prioridade:** 🟠

> React 19 + TS: eliminar `any`, props frouxas e hooks com deps erradas antes de crescer a base de código.

```
Invoque /ecc:react-review focado em type-safety e correção de hooks em src/. NÃO mude comportamento; só endureça tipos e corrija bugs latentes que o review encontrar.

1. Rode `grep -rn ": any\|as any\|@ts-ignore\|@ts-expect-error" src` e liste cada ocorrência. Substitua por tipos reais (use os tipos em src/types/*). Onde for genuinamente dinâmico (resposta Scryfall), crie um tipo mínimo em src/types/ em vez de `any`.
2. Verifique arrays de dependência de useEffect/useMemo/useCallback nos 18 hooks (src/hooks/*) — reporte e corrija deps faltando/sobrando que causem stale closures ou re-render extra. Cuidado com usePlaytestSimulator e useDeckManager (os mais complexos).
3. Confirme que todo componente exportado tem props tipadas explicitamente (nada de props implícitas). Marque como readonly onde couber.
4. Ative/tightene flags do tsconfig se ainda não estiverem: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes — mas SÓ se der pra deixar o type-check verde no mesmo PR; senão, reporte quantos erros cada flag geraria e não ative.

Companheiro opcional: se eu pedir, use o agente ecc:typescript-reviewer para uma segunda passada.
Ao final: `yarn type-check && yarn lint && yarn test` verdes.
```

---

### Prompt A.3 — Dead code & consolidação
**Modelo:** Sonnet 5 · **Skill:** `/ecc:refactor-clean` · **Prioridade:** 🟡

> Depois da modularização recente (muitos arquivos novos), sobra código morto e duplicações. Limpar reduz superfície de manutenção.

```
Invoque /ecc:refactor-clean no projeto. Objetivo: remover código morto com verificação após cada mudança (o projeto já tem testes da Fase A.1 — use-os como rede).

1. Rode as ferramentas de análise (knip / ts-prune / depcheck conforme a skill) e liste: exports não usados, componentes órfãos, imports mortos, deps do package.json não referenciadas.
2. Procure duplicação real de lógica entre os hooks/utils criados na modularização (ex.: helpers de zona do playtest, formatação de mana, agrupamento de deck). Consolide numa fonte única — atenção ao Prompt 1.1 do PROJECT_IMPROVEMENT_PLAN.md (moveCard central) se ainda não foi feito; não conflite com ele.
3. Remova SÓ o que as ferramentas + leitura confirmam morto. Nada de remover algo "que parece não usado" sem grep confirmando. Uma remoção por commit lógico, rodando `yarn type-check && yarn lint && yarn test` entre cada.

Reporte no fim: o que removeu, o que suspeitou mas manteve (e por quê).
```

---

### Prompt A.4 — Erros silenciosos & error boundaries
**Modelo:** Sonnet 5 · **Skill:** `/ecc:error-handling` · **Prioridade:** 🟠

> Chamadas à Scryfall, import de deck e Dexie podem falhar silenciosamente. App premium não engole erro.

```
Invoque /ecc:error-handling. Foque em caminhos que hoje falham em silêncio (catch vazio, fallback ruim, promise sem tratamento).

1. Rode `grep -rn "catch" src` e revise cada catch: nenhum deve engolir erro sem (a) logar e (b) dar feedback ao usuário via useToast/dispatchToast (que já existe). Alvos prováveis: src/hooks/useCardSearch, useCardPrints, useDeckTextImport; src/services/deckImportService.ts, fileDownload.ts; acesso Dexie em src/db.
2. Adicione um React Error Boundary de topo em src/App.tsx (ou src/components/layout/RootLayout.tsx) com um ErrorState amigável (o componente ErrorState já existe) e botão "recarregar", para que um crash de componente não deixe tela branca.
3. Import de deck (deckImportService): erros de parse/linha inválida devem virar mensagens acionáveis no DeckImportProgressModal, não console.error mudo.
4. Chamadas Scryfall: trate rate limit/offline com retry leve OU mensagem clara + estado de erro (não spinner infinito).

Companheiro opcional: se eu pedir, rode o agente ecc:silent-failure-hunter para varrer o resto.
Ao final: `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt A.5 — Codemaps + documentação viva
**Modelo:** Haiku 4.5 · **Skills:** `/ecc:update-codemaps` · `/ecc:update-docs` · **Prioridade:** 🟢

> Manutenção de longo prazo: um mapa de arquitetura que se atualiza sozinho e docs sincronizadas com o código.

```
1. Invoque /ecc:update-codemaps para gerar docs/CODEMAPS/* com o mapa atual de src/ (componentes card/deck/playtest/stats/layout/ui, hooks, store, services, tipos).
2. Invoque /ecc:update-docs para sincronizar o README.md com o estado real: scripts do package.json (dev, build, dist, build:win/mac/linux, type-check, lint, test), stack, e como rodar em web vs Electron.
3. Atualize (ou crie) um docs/ARCHITECTURE.md curto: fluxo de dados Zustand (useDeckStore) → componentes, camada Dexie (persistência de deck), integração Scryfall, i18n (3 locales).

Não invente features que não existem. É doc mecânica; mantenha enxuto.
```

---

# FASE B — Design System Premium

### Prompt B.1 — Tokens semânticos vivos + design system real
**Modelo:** Opus 4.8 · **Skill:** `/ecc:design-system` · **Prioridade:** 🔴

> A base de todo o "premium". Sem tokens semânticos funcionando, cada tela vira gambiarra de cor. (Já mapeado: tokens `--color-primary/danger/...` estão MORTOS e o `font-serif` do Tailwind resolve pra Georgia em vez de `--font-family-serif`.)

```
Invoque /ecc:design-system. Objetivo: transformar src/style/*.css num design system coeso e semântico em Tailwind v4 (@theme) + CSS custom, SEM regressão visual perceptível — só consolidação e ativação de tokens.

Estado conhecido (auditado):
- src/style/variables.css define --color-primary/secondary/success/danger/warning MAS os componentes hardcodam bg-blue-600/bg-indigo-600/bg-red-600/bg-green-600/bg-amber-600. Os tokens estão mortos.
- O token de fonte serif está morto: `font-serif` do Tailwind cai em Georgia, não em --font-family-serif (Playfair está carregada mas não propaga). Investigue o @theme/config antes de assumir que aplicar a classe resolve.
- .modal-overlay e escala de z-index já foram consolidados (ver Prompt 2.1 do PROJECT_IMPROVEMENT_PLAN.md) — só valide.

Faça:
1. Garanta que o @theme do Tailwind v4 gere utilitários a partir dos tokens: bg-primary/bg-danger/bg-success/bg-warning, text-*, border-*, e font-serif → --font-family-serif de verdade.
2. Troque SÓ os usos SEMÂNTICOS de cor (botões primary/danger/success/warning, badges de status, links) pelos tokens. NÃO toque em cinzas neutros de texto/borda.
3. Defina uma escala de elevação/sombra premium (--shadow-sm/md/lg/xl com camadas suaves), raios (--radius-*), e uma paleta dark/light coerente (o app tem useDarkMode). Tudo via tokens.
4. Documente os tokens num docs/DESIGN_TOKENS.md curto (nome → uso → valor light/dark).

Valide light E dark em: DeckManager, DeckPreview, DeckStats, CardDetailModal, PlaytestSimulator. Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt B.2 — Estética premium: glass, profundidade e tipografia
**Modelo:** Opus 4.8 · **Skills:** `/ecc:liquid-glass-design` · `/ecc:make-interfaces-feel-better` · **Prioridade:** 🟠

> O salto de "app funcional" para "app que parece caro". Depende de B.1 (tokens) pronto.

```
Invoque /ecc:liquid-glass-design e /ecc:make-interfaces-feel-better. Objetivo: dar acabamento premium à casca do app e às superfícies principais, usando os tokens da Fase B.1. Reaproveite o que já existe (AmbientGlow, useRipple) — não crie libs.

1. Superfícies com profundidade: aplique glassmorphism SUTIL (backdrop-blur + borda 1px translúcida + sombra em camadas) em barras, modais e cards de painel — sem exagero, mantendo contraste AA. Alvos: src/components/layout/RootLayout, ProfileMenu, CommandPalette, CardDetailModal, os *Panel.tsx de stats, DeckActionBar.
2. Hierarquia tipográfica premium: título de marca (.app-brand-title) na serif REAL (--font-family-serif, corrigida em B.1); escala tipográfica consistente (display/heading/body/caption) via tokens; tracking e leading afinados. Números de estatística com tabular-nums.
3. Card do MTG como herói: a arte da carta é o produto. Garanta cantos arredondados corretos, sombra de elevação no hover, e proporção fiel em CardItem/CardGrid. Estado de foco visível e elegante.
4. Espaçamento e ritmo: padronize gaps/paddings numa escala de 4px via tokens; elimine espaçamentos mágicos soltos nas telas principais.
5. Microcópia e vazios: todo empty-state (busca, deck, tokens, pilhas) com ilustração/ícone + frase i18n + CTA (reuse EmptyState).

Mantenha 100% dark/light e i18n. Nada de cor fora dos tokens. Valide em ~360px e ~1280px. Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt B.3 — Overhaul de dataviz das estatísticas
**Modelo:** Sonnet 5 · **Skill:** `dataviz` · **Prioridade:** 🟠

> Já existem 8 painéis em `src/components/stats/*Panel.tsx` com recharts. Falta coesão visual de "um sistema só".

```
Invoque a skill dataviz (leia references/palette.md antes de escolher cores). Objetivo: unificar os gráficos de src/components/stats/*Panel.tsx (ManaCurvePanel, ColorDistributionPanel, ManaPipAnalysisPanel, RarityPanel, TypesBreakdownPanel, ConsistencyPanel, BudgetEstimatorPanel, ManaBaseOptimizerPanel) num sistema visual único usando recharts (já é dependência).

1. Paleta categórica consistente derivada dos tokens de B.1 e das cores de mana do MTG (W/U/B/R/G) — mapeie cor de mana → cor do gráfico de forma fiel e acessível (não use vermelho/verde como único diferenciador).
2. Eixos, grid, legendas e tooltips padronizados entre todos os painéis (mesma tipografia tabular, mesmos raios, mesmo espaçamento). Respeite dark/light.
3. Estados: cada painel precisa de empty-state (deck vazio) e skeleton de loading coerentes.
4. Acessibilidade: contraste AA, rótulos legíveis, tooltip navegável.
5. Mantenha os cálculos existentes (deckGrouping/symbolHelper); isto é camada visual. i18n em todos os rótulos.

Rode `yarn type-check && yarn lint && yarn test`.
```

---

# FASE C — Motion & Efeitos

### Prompt C.1 — Fundação de motion
**Modelo:** Sonnet 5 · **Skill:** `/ecc:motion-ui` · **Prioridade:** 🟠

> Movimento com propósito (feedback, orientação), tokenizado, respeitando `prefers-reduced-motion`.

```
Invoque /ecc:motion-ui. Objetivo: uma camada de movimento coesa usando as transições já tokenizadas (--transition-fast/base em src/style) e CSS/react-icons — SEM adicionar biblioteca de animação nova.

1. Tokens de motion: defina durações e easings padrão (--ease-out, --ease-spring-ish) via tokens e use em todo hover/press/focus. Padronize os estados dos botões (hover elevar+brilho, active afundar, focus-visible anel).
2. Transições de entrada/saída de modais e drawers (CardDetailModal, PileExplorerModal, CommandPalette, drawer de log do playtest) — fade+scale/slide suave, com foco preso (focus trap) e ESC.
3. Feedback de ação: ripple (useRipple já existe) nos botões primários; animação sutil ao adicionar/remover carta do deck (a linha entra/sai, não pisca).
4. RESPEITE `prefers-reduced-motion: reduce` — desligue transições não-essenciais. Isso é obrigatório.

Nada de jank: anime só transform/opacity. Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt C.2 — Efeitos avançados (flip, ambient, partículas)
**Modelo:** Opus 4.8 · **Skill:** `/ecc:motion-advanced` · **Prioridade:** 🟢

> O "wow" — efeitos que dão identidade, sem virar poluição nem custar performance. Reusa AmbientGlow/PlaytestParticles já existentes.

```
Invoque /ecc:motion-advanced. Objetivo: efeitos de alto impacto e baixo custo, opcionais e desligáveis. Reaproveite AmbientGlow e PlaytestParticles que já existem.

1. Flip 3D de carta dupla-face (transform: rotateY) em CardItem/CardDetailModal para cartas com duas faces (MDFC/transform) — a Scryfall traz card_faces. Botão "virar". Sem lib.
2. Foil/holográfico sutil: efeito de brilho gradiente que segue o cursor (CSS custom prop + mousemove) em cartas raras/míticas no CardDetailModal — ligado por raridade, desligável.
3. Ambient premium no playtest e na home: intensifique AmbientGlow reagindo ao contexto (cor de identidade do deck / vida baixa no playtest fica avermelhado). PlaytestParticles em eventos (comprar mão inicial, ganhar/perder).
4. Transição de tela suave entre busca ↔ deck ↔ playtest (view transition/crossfade).

REGRAS: tudo respeita prefers-reduced-motion; ofereça um toggle "efeitos visuais" nas preferências (persistir em localStorage, como idioma/tema); anime só transform/opacity; meça que não cai frame no playtest com 40+ cartas. Rode `yarn type-check && yarn lint && yarn test`.
```

---

# FASE D — Responsivo & Mobile

### Prompt D.1 — Passada mobile-first global
**Modelo:** Sonnet 5 · **Skill:** `/ecc:make-interfaces-feel-better` · **Prioridade:** 🔴

> "Melhorar o app para celular." Passada sistemática por breakpoint; complementa o Prompt 2.2 do plano antigo, sem repetir.

```
Invoque /ecc:make-interfaces-feel-better com foco em responsividade mobile-first (base → sm → md → lg). Não altere lógica de negócio. Se o Prompt 2.2 do PROJECT_IMPROVEMENT_PLAN.md já rodou, audite o estado e cubra só o que faltou.

Telas e regras:
1. Navegação: em mobile, a navegação principal (busca/decks/playtest/perfil) deve virar uma bottom-tab bar ou menu compacto acessível com o polegar — não uma top-bar cortada.
2. DeckManager / DeckPreview / DeckStats: colunas empilham no mobile; tabelas densas e proxy print vão para container com `overflow-x-auto` próprio (a PÁGINA nunca rola horizontal).
3. Modais grandes (CardDetailModal, PileExplorerModal, DeckExportDialog, DeckImportProgressModal, TokenSearchModal): full-screen ou bottom-sheet no mobile, com max-height + scroll interno, largura fluida.
4. Playtest: já tratado o log no Prompt 0.3; garanta que TODA ação essencial (scry/surveil, contadores, atalhos) tenha acesso no mobile via menu "mais" — nada de `hidden md:` escondendo função sem alternativa.
5. Grids de card (CardGrid) e CardSizeSelector: colunas fluidas, alvos de toque ≥ 44px.

Teste em 360 / 390 / 768 / 1280px. Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt D.2 — PWA instalável (mobile de verdade)
**Modelo:** Sonnet 5 · **Skill:** `/ecc:vite-patterns` · **Prioridade:** 🟠

> O projeto já tem `vite-plugin-pwa` nas devDeps mas provavelmente não está configurado. Transformar em app instalável no celular é o caminho real para "app de celular" (o Electron é desktop).

```
Invoque /ecc:vite-patterns. O projeto tem vite-plugin-pwa instalado. Configure um PWA instalável e offline-capaz para uso no celular (o build Electron continua sendo o desktop).

1. Configure VitePWA no vite.config: registerType autoUpdate, manifest completo (name "DeckForge", short_name, theme_color/background_color alinhados aos tokens, display standalone, orientation, ícones 192/512 + maskable). Gere/registre os ícones em src/assets (a partir da logo.svg existente).
2. Service worker (Workbox via plugin): precache do app shell; runtime caching para imagens de carta da Scryfall (CacheFirst com expiração) e para as respostas de busca (StaleWhileRevalidate) — respeitando o rate limit deles.
3. Offline: o Dexie já persiste decks localmente; garanta que abrir decks salvos e navegar funcione offline. Mostre um indicador "offline" quando a rede cair (reuse toast/estado).
4. Prompt de instalação: capture o beforeinstallprompt e ofereça um botão "Instalar app" discreto (some se já instalado).
5. NÃO quebre o build Electron — separe o que é web-PWA do que é Electron (a config já tem vite-plugin-electron). Valide `yarn build:vite` (web/PWA) e `yarn build` (electron) ambos ok.

Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt D.3 — Toque, gestos & acessibilidade AA
**Modelo:** Sonnet 5 · **Skill:** `/ecc:accessibility` · **Prioridade:** 🟠

> Premium de verdade = acessível. WCAG 2.2 AA + interações de toque decentes.

```
Invoque /ecc:accessibility (WCAG 2.2 AA). O projeto já usa eslint-plugin-jsx-a11y — trate os warnings e vá além.

1. Rode o lint a11y e zere os warnings de jsx-a11y. Garanta labels/roles/aria corretos em todos os controles (botões-ícone precisam de aria-label i18n; modais com role=dialog + aria-modal + foco preso + retorno de foco ao fechar).
2. Navegação por teclado completa: tab order lógico, focus-visible sempre visível (casando com B.1/C.1), atalhos documentados (overlay `?`). Command palette 100% teclado.
3. Contraste AA em light E dark (texto, ícones, estados de foco) — verifique especialmente badges de status e cores de mana.
4. Toque: alvos ≥ 44px; onde há drag&drop (playtest, reordenar), forneça alternativa acessível (menu de contexto já existe — garanta paridade). Suporte swipe para fechar bottom-sheets no mobile.
5. Respeite prefers-reduced-motion e prefers-color-scheme.

Companheiro opcional: se eu pedir, use o agente ecc:a11y-architect para auditoria formal.
Rode `yarn type-check && yarn lint && yarn test`.
```

---

# FASE E — Novas Funcionalidades v5.0

### Prompt E.1 — Deck Doctor (consistência + goldfish)
**Modelo:** Opus 4.8 · **Skill:** `/ecc:feature-dev` · **Prioridade:** 🟢

> Feature-assinatura da v5.0: transforma estatística passiva em conselho acionável.

```
Invoque /ecc:feature-dev. Construa um "Deck Doctor" que analisa o deck ativo e dá recomendações acionáveis. Prefira fazer após a Fase A.1 (testes) e B.3 (dataviz). Reaproveite src/utils/deckGrouping, deckValidator, symbolHelper e recharts.

Funcionalidades:
1. Diagnóstico de base de mana: probabilidade hipergeométrica de X terrenos na mão inicial e no turno N; sugestão de contagem ideal de terrenos por curva; alertas de "poucas fontes da cor Y para os pips exigidos". (ManaBaseOptimizerPanel/ConsistencyPanel já existem — evolua-os, não duplique.)
2. Goldfish rápido: simule N mãos iniciais (reuse a lógica de embaralhar/comprar de usePlaytestSimulator) e mostre % de mãos jogáveis, curva média, chance de "no-lander"/"flood".
3. Score de consistência (0–100) com breakdown explicável, não caixa-preta.
4. Recomendações em linguagem natural i18n ("adicione ~1–2 fontes de azul", "sua curva está pesada no 4").

Não invente dados de carta que a Scryfall não fornece. Testes para a matemática (hipergeométrica, contagem de fontes). Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt E.2 — Coleção, wishlist & preços
**Modelo:** Opus 4.8 · **Skill:** `/ecc:feature-dev` · **Prioridade:** 🟢

> Vira de "buscador de cartas" para "gerenciador de coleção". Dexie já dá a persistência local.

```
Invoque /ecc:feature-dev. Adicione gestão de coleção pessoal, persistida localmente com Dexie (src/db) — mesmo padrão dos decks salvos.

1. Marcar cartas como "possuo" (quantidade por edição) e "wishlist". Botão em CardItem/CardDetailModal.
2. Nova tela "Coleção": lista/grid com filtro (cor, tipo, raridade, set) reusando CardFilterBar; total de cartas e valor estimado.
3. Integração com deck: no DeckPreview, mostrar quais cartas do deck você já possui vs faltam comprar ("faltam 3 cartas ~$X"). Preços vêm do campo `prices` da Scryfall (USD/EUR) — já disponível no card, sem API nova.
4. Import/export da coleção (CSV) reusando src/services/fileDownload.ts e o padrão de deckImportService.

Persistência via Dexie com migração de schema versionada (não quebre decks já salvos). Testes para o cálculo de "faltantes" e valor. Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt E.3 — Compartilhar & sincronizar deck
**Modelo:** Sonnet 5 · **Skill:** `/ecc:feature-dev` · **Prioridade:** 🟢

> QoL de alto valor: tirar o deck do app sem fricção.

```
Invoque /ecc:feature-dev. Facilite compartilhar e mover decks entre dispositivos, SEM backend (tudo client-side).

1. Exportar deck como link compartilhável: serialize a lista (nomes + quantidades + zonas) para uma string compacta (base64/URL-safe) num query param ou arquivo .deck. Ao abrir, o app importa. Reuse DeckExportDialog e deckImportService.
2. Formatos de export já suportados devem ganhar cobertura: texto (Arena/MTGO) e o novo link. Botão "copiar" com toast.
3. QR code do link para escanear no celular (gere via canvas simples, sem lib nova pesada — ou uma lib mínima só se necessário; prefira sem).
4. "Duplicar deck" e "novo deck a partir deste" no DeckManager.

Valide roundtrip: exportar → importar reconstrói o deck idêntico (teste automatizado do encode/decode). Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt E.4 — Assistente de deck com IA (Claude API)
**Modelo:** Opus 4.8 · **Skills:** `/ecc:feature-dev` + `claude-api` · **Prioridade:** 🟢

> Diferencial premium. Opcional e desligável (requer chave do usuário). LEIA a skill `claude-api` antes de escrever qualquer chamada.

```
Invoque /ecc:feature-dev e LEIA a skill claude-api antes de codar qualquer chamada (modelos, pricing, streaming, tool use — não chute nada de cabeça). Objetivo: um assistente opcional de deckbuilding com a Claude API.

1. Config: campo para a chave de API do usuário (armazenada localmente/keychain no Electron; NUNCA hardcode nem commite chave). Feature 100% opcional e desligável; se sem chave, esconda a UI.
2. Use o modelo mais capaz atual (ver skill claude-api para o id correto — família Claude 5 / Opus 4.8). Streaming para resposta responsiva.
3. Casos de uso: "sugira 5 cartas para melhorar este deck no formato X", "explique a estratégia deste deck", "o que cortar para baixar o custo?". Passe a lista do deck ativo como contexto. Se usar ferramentas/estrutura, siga tool use da skill.
4. Segurança: não vaze a chave em logs; trate erro/limite/refusal com mensagem clara (reuse error handling da Fase A.4). No Electron, faça a chamada pelo processo main se possível, não expondo a chave ao renderer.

Rode `yarn type-check && yarn lint && yarn test`.
```

---

# FASE F — Qualidade Final & Release

### Prompt F.1 — Performance & bundle
**Modelo:** Opus 4.8 · **Skill:** `/ecc:react-performance` · **Prioridade:** 🟠

```
Invoque /ecc:react-performance. Otimize render e bundle sem mudar comportamento.

1. Render: encontre re-renders desnecessários (React DevTools/profiler mental) — memoize listas grandes (CardGrid, DeckCardList, PlaytestBattlefield com muitas cartas). Virtualização só se medir ganho real; não adicione lib sem justificativa.
2. Zustand: garanta selectors granulares em useDeckStore (evite componente inteiro re-renderizar por mudança de um campo).
3. Bundle: rode o build e analise o tamanho; code-split rotas pesadas (playtest, stats, proxy print) com lazy/Suspense; confirme que recharts e outras libs pesadas não vão no chunk inicial.
4. Imagens de carta: lazy loading + tamanho certo (não puxar PNG grande onde cabe small/normal da Scryfall).

Companheiro opcional: se eu pedir, use o agente ecc:performance-optimizer.
Meça antes/depois (tamanho de bundle, tempo de interação no playtest com 40+ cartas). Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt F.2 — Smoke E2E dos fluxos críticos
**Modelo:** Sonnet 5 · **Skill:** `/ecc:e2e-testing` · **Prioridade:** 🟡

```
Invoque /ecc:e2e-testing. Cubra os fluxos críticos ponta-a-ponta na versão web (Vite dev server).

Jornadas mínimas:
1. Buscar carta → adicionar ao deck → ver estatística atualizar.
2. Salvar deck → recarregar → deck persiste (Dexie).
3. Abrir playtest → comprar mão → jogar carta no campo → exilar → abrir explorador de pilha → mover de volta.
4. Trocar idioma (pt/en/es) e tema (dark/light) sem crash.
5. Exportar deck (texto) e reimportar reconstrói igual.

Mantenha os testes estáveis (selecione por role/label acessível, não por classe CSS). Quarentene flaky se houver. Rode junto do `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt F.3 — Auditoria de segurança
**Modelo:** Sonnet 5 · **Skill:** `/ecc:security-review` · **Prioridade:** 🟡

```
Invoque /ecc:security-review. Foco: app Electron + web que lida com input do usuário (import de deck), chamadas externas (Scryfall) e, se a Fase E.4 rodou, chave de API.

1. Electron: contextIsolation ligado, nodeIntegration desligado, sem exposição desnecessária de APIs Node ao renderer; valide o preload.
2. Input do usuário: parse de import de deck e de link compartilhável não deve permitir injeção nem quebrar o app com input malicioso.
3. Segredos: nenhuma chave/token hardcoded ou commitada; a chave da Claude API (E.4) fica em storage seguro, fora do renderer/logs.
4. Deps: rode auditoria de dependências e reporte vulnerabilidades conhecidas.

Companheiro opcional: se eu pedir, use o agente ecc:security-reviewer. Rode `yarn type-check && yarn lint && yarn test`.
```

---

### Prompt F.4 — Release v5.0
**Modelo:** Haiku 4.5 · **Skill:** `/ecc:git-workflow` · **Prioridade:** 🟢

```
Invoque /ecc:git-workflow. Prepare o release da v5.0 (NÃO publique nada externo sem eu confirmar).

1. Bump de versão para 5.0.0 no package.json (hoje 0.1.0).
2. Gere/atualize um CHANGELOG.md com as mudanças das Fases A–F agrupadas (Sustentabilidade, Design, Motion, Mobile/PWA, Features, Qualidade).
3. Confira que `yarn type-check && yarn lint && yarn test` e os builds (`yarn build:vite`, `yarn build`, e ao menos um `yarn build:win/mac/linux`) passam.
4. Prepare a mensagem de commit/tag seguindo o padrão de commits do repo (Conventional Commits — o projeto tem commitlint.config.js). NÃO faça push nem crie release no GitHub sem eu autorizar.
```

---

## ✅ Checklist "Premium v5.0" (defina como pronto)

- [ ] Testes rodando e verdes; refactors com rede de segurança (A.1)
- [ ] Zero `any`/`@ts-ignore`; hooks corretos (A.2)
- [ ] Sem código morto; erros nunca silenciosos + error boundary (A.3, A.4)
- [ ] Tokens semânticos e serif VIVOS; design system documentado (B.1)
- [ ] Glass/profundidade/tipografia premium em light e dark (B.2)
- [ ] Gráficos coesos como um sistema só (B.3)
- [ ] Motion com propósito + `prefers-reduced-motion` respeitado (C.1)
- [ ] Efeitos de carta (flip/foil/ambient) desligáveis e performáticos (C.2)
- [ ] Mobile-first sem scroll horizontal; navegação com o polegar (D.1)
- [ ] Instalável como PWA no celular, offline-capaz (D.2)
- [ ] WCAG 2.2 AA; teclado e toque completos (D.3)
- [ ] Deck Doctor, coleção, compartilhar, (IA opcional) (E.*)
- [ ] Bundle enxuto, playtest fluido com 40+ cartas (F.1)
- [ ] Smoke E2E dos fluxos críticos verde (F.2)
- [ ] Segurança Electron + segredos ok (F.3)
- [ ] v5.0.0 tagueada com changelog (F.4)

---

> **Nota sobre invocação:** quando você me mandar "roda o prompt B.2" (ou colar o bloco), eu invoco a(s) skill(s) indicada(s) automaticamente. Os **agentes** citados como "companheiro opcional" só rodam se você pedir explicitamente ("usa o agente X"). Ajuste o modelo com `/model` conforme a coluna Modelo antes de cada prompt pesado.
