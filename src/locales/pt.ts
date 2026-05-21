const pt = {
  translations: {
    // Header
    appTitle: 'Magic: The Gathering Search',
    searchTab: 'Buscar Cartas',
    decksTab: 'Meus Decks',
    selectLanguage: 'Idioma',

    // Search
    searchPlaceholder: 'Buscar cartas...',
    searchButton: 'Buscar',
    advancedFilters: 'Filtros Avançados',
    clearFilters: 'Limpar Filtros',

    // Filters
    colors: 'Cores:',
    white: 'Branco',
    blue: 'Azul',
    black: 'Preto',
    red: 'Vermelho',
    green: 'Verde',

    types: 'Tipos:',
    creature: 'Criatura',
    instant: 'Instantânea',
    sorcery: 'Feitiço',
    enchantment: 'Encantamento',
    artifact: 'Artefato',
    planeswalker: 'Planeswalker',
    land: 'Terreno',

    rarity: 'Raridade:',
    all: 'Todas',
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Rara',
    mythic: 'Mítica',

    cmc: 'Custo de Mana Convertido (CMC):',
    cmcPlaceholder: 'Ex: 3',

    // Card sizes
    cardSize: 'Tamanho das cartas:',
    small: 'Pequeno',
    medium: 'Médio',
    large: 'Grande',
    extraLarge: 'Extra Grande',

    // Deck actions
    addToDeck: '+ Deck',
    remove: 'Remover',

    // Deck Manager
    deckManager: 'Gerenciador de Decks',
    saveCurrentDeck: 'Salvar Deck Atual',
    clearCurrentDeck: 'Limpar Deck Atual',
    importDeck: 'Importar Deck',
    exportAllDecks: 'Exportar Todos os Decks',

    savedDecks: 'Decks Salvos',
    currentDeck: 'Deck Atual',
    noSavedDecks: 'Nenhum deck salvo',
    addCardsMessage: 'Adicione cartas ao deck atual ou selecione um deck salvo',

    saveDeck: 'Salvar Deck',
    deckNamePlaceholder: 'Nome do deck',
    save: 'Salvar',
    cancel: 'Cancelar',

    cards: 'cartas',

    // Messages
    loading: 'Carregando...',
    noResults: 'Nenhuma carta encontrada',
    error: 'Erro ao carregar cartas',

    deckSaved: 'Deck salvo com sucesso!',
    deckImported: 'Deck importado com sucesso!',
    deckExported: 'Deck exportado com sucesso!',
    invalidFile: 'Formato de arquivo inválido',

    confirmClear: 'Tem certeza que deseja limpar o deck atual?',
    confirmDelete: 'Tem certeza que deseja excluir este deck?',

    // Formats & Validation
    format: 'Formato',
    standard: 'Padrão (Standard)',
    modern: 'Moderno (Modern)',
    commander: 'Commander',
    vintage: 'Vintage',
    pauper: 'Pauper',
    freeform: 'Formato Livre',
    valid: 'Válido',
    invalid: 'Inválido',
    edit: 'Editar',
    saveChanges: 'Salvar Alterações',
    saveAsNew: 'Salvar como Novo',
    editingDeck: 'Editando o Deck',
    activeEditingMode: 'Modo de Edição Ativo',
    cardAdded: 'Carta adicionada ao deck!',
    deckValidation: 'Validação do Deck',
    deckRulesExplanation:
      'Padrão, Moderno, Vintage e Pauper exigem no mínimo 60 cartas e no máximo 4 cópias. Commander exige exatamente 100 cartas e no máximo 1 cópia (singleton). Pauper permite apenas cartas de raridade comum.',
    savedLocationNote:
      'Os seus decks são salvos de forma segura e local neste computador utilizando o recurso localStorage do navegador. Você também pode exportá-los em formato JSON como cópia de segurança ou para compartilhamento.',

    validationEmptyDeck: 'O deck está vazio.',
    validationMinCards: 'O deck deve ter no mínimo 60 cartas (atualmente tem {{count}}).',
    validationMaxCopies: 'Limite de cópias excedido: "{{name}}" tem {{count}} cópias (máximo permitido é {{max}}).',
    validationCommanderExactCards: 'Decks de Commander devem ter exatamente 100 cartas (atualmente tem {{count}}).',
    validationCommanderSingleton:
      'Duplicata encontrada: "{{name}}" tem {{count}} cópias (máximo permitido em Commander é 1).',
    validationPauperCommonsOnly: 'Pauper permite apenas cartas comuns. As seguintes cartas não são comuns: {{list}}.',
    validationFormatSuccess: '✓ Deck cumpre todos os requisitos do formato!',

    manaCostLabel: 'Custo',
    textLabel: 'Texto',
    powerToughnessLabel: 'Poder/Resistência',
    rarityLabel: 'Raridade',
    setLabel: 'Coleção',
    close: 'Fechar',
    export: 'Exportar',
    delete: 'Excluir'
  }
};

export default pt;
