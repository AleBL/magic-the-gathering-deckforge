const es = {
  translations: {
    // Header
    appTitle: 'Magic: The Gathering Search',
    searchTab: 'Buscar Cartas',
    decksTab: 'Mis Mazos',
    selectLanguage: 'Idioma',

    // Search
    searchPlaceholder: 'Buscar cartas...',
    searchButton: 'Buscar',
    advancedFilters: 'Filtros Avanzados',
    clearFilters: 'Limpiar Filtros',

    // Filters
    colors: 'Colores:',
    white: 'Blanco',
    blue: 'Azul',
    black: 'Negro',
    red: 'Rojo',
    green: 'Verde',

    types: 'Tipos:',
    creature: 'Criatura',
    instant: 'Instantáneo',
    sorcery: 'Conjuro',
    enchantment: 'Encantamiento',
    artifact: 'Artefacto',
    planeswalker: 'Planeswalker',
    land: 'Tierra',

    rarity: 'Rariedad:',
    all: 'Todas',
    common: 'Común',
    uncommon: 'Infrecuente',
    rare: 'Rara',
    mythic: 'Mítica',

    cmc: 'Coste de Maná Convertido (CMC):',
    cmcPlaceholder: 'Ej: 3',

    // Card sizes
    cardSize: 'Tamaño de cartas:',
    small: 'Pequeño',
    medium: 'Mediano',
    large: 'Grande',
    extraLarge: 'Extra Grande',

    // Deck actions
    addToDeck: '+ Mazo',
    remove: 'Eliminar',

    // Deck Manager
    deckManager: 'Gestor de Mazos',
    saveCurrentDeck: 'Guardar Mazo Actual',
    clearCurrentDeck: 'Limpiar Mazo Actual',
    importDeck: 'Importar Mazo',
    exportAllDecks: 'Exportar Todos los Mazos',

    savedDecks: 'Mazos Guardados',
    currentDeck: 'Mazo Actual',
    noSavedDecks: 'No hay mazos guardados',
    addCardsMessage: 'Añade cartas al mazo actual o selecciona un mazo guardado',

    saveDeck: 'Guardar Mazo',
    deckNamePlaceholder: 'Nombre del mazo',
    save: 'Guardar',
    cancel: 'Cancelar',

    cards: 'cartas',

    // Messages
    loading: 'Cargando...',
    noResults: 'No se encontraron cartas',
    error: 'Error al cargar las cartas',

    deckSaved: '¡Mazo guardado con éxito!',
    deckImported: '¡Mazo importado con éxito!',
    deckExported: '¡Mazo exportado con éxito!',
    invalidFile: 'Formato de archivo inválido',

    confirmClear: '¿Estás seguro de que quieres limpiar el mazo actual?',
    confirmDelete: '¿Estás seguro de que quieres eliminar este mazo?',

    // Formats & Validation
    format: 'Formato',
    standard: 'Estándar (Standard)',
    modern: 'Moderno (Modern)',
    commander: 'Commander',
    vintage: 'Vintage',
    pauper: 'Pauper',
    freeform: 'Formato Libre',
    valid: 'Válido',
    invalid: 'Inválido',
    edit: 'Editar',
    saveChanges: 'Guardar Cambios',
    saveAsNew: 'Guardar como Nuevo',
    editingDeck: 'Editando el Mazo',
    activeEditingMode: 'Modo de Edición Activo',
    cardAdded: '¡Carta añadida al mazo!',
    deckValidation: 'Validación del Mazo',
    deckRulesExplanation:
      'Estándar, Moderno, Vintage y Pauper requieren al menos 60 cartas y un máximo de 4 copias. Commander requiere exactamente 100 cartas y un máximo de 1 copia (singleton). Pauper permite solo cartas de rareza común.',
    savedLocationNote:
      'Tus mazos se guardan de forma segura y local en este equipo utilizando el recurso localStorage del navegador. También puedes exportarlos en formato JSON como copia de seguridad o para compartirlos.',

    // New translations (validation and labels)
    validationEmptyDeck: 'El mazo está vacío.',
    validationMinCards: 'El mazo debe tener al menos 60 cartas (actualmente tiene {{count}}).',
    validationMaxCopies: 'Límite de copias excedido: "{{name}}" tiene {{count}} copias (máximo permitido es {{max}}).',
    validationCommanderExactCards:
      'Los mazos de Commander deben tener exactamente 100 cartas (actualmente tiene {{count}}).',
    validationCommanderSingleton:
      'Duplicado encontrado: "{{name}}" tiene {{count}} copias (máximo permitido en Commander es 1).',
    validationPauperCommonsOnly: 'Pauper permite solo cartas comunes. Las siguientes cartas no son comunes: {{list}}.',
    validationFormatSuccess: '✓ ¡El mazo cumple con todos los requisitos del formato!',

    manaCostLabel: 'Coste de maná',
    textLabel: 'Texto',
    powerToughnessLabel: 'Poder/Resistencia',
    rarityLabel: 'Rareza',
    setLabel: 'Colección',
    close: 'Cerrar',
    export: 'Exportar',
    delete: 'Eliminar'
  }
};

export default es;
