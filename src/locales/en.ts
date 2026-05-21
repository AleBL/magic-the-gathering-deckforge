const en = {
  translations: {
    // Header
    appTitle: 'Magic: The Gathering Search',
    searchTab: 'Search Cards',
    decksTab: 'My Decks',
    selectLanguage: 'Language',

    // Search
    searchPlaceholder: 'Search cards...',
    searchButton: 'Search',
    advancedFilters: 'Advanced Filters',
    clearFilters: 'Clear Filters',

    // Filters
    colors: 'Colors:',
    white: 'White',
    blue: 'Blue',
    black: 'Black',
    red: 'Red',
    green: 'Green',

    types: 'Types:',
    creature: 'Creature',
    instant: 'Instant',
    sorcery: 'Sorcery',
    enchantment: 'Enchantment',
    artifact: 'Artifact',
    planeswalker: 'Planeswalker',
    land: 'Land',

    rarity: 'Rarity:',
    all: 'All',
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    mythic: 'Mythic',

    cmc: 'Converted Mana Cost (CMC):',
    cmcPlaceholder: 'Ex: 3',

    // Card sizes
    cardSize: 'Card size:',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    extraLarge: 'Extra Large',

    // Deck actions
    addToDeck: '+ Deck',
    remove: 'Remove',

    // Deck Manager
    deckManager: 'Deck Manager',
    saveCurrentDeck: 'Save Current Deck',
    clearCurrentDeck: 'Clear Current Deck',
    importDeck: 'Import Deck',
    exportAllDecks: 'Export All Decks',

    savedDecks: 'Saved Decks',
    currentDeck: 'Current Deck',
    noSavedDecks: 'No saved decks',
    addCardsMessage: 'Add cards to the current deck or select a saved deck',

    saveDeck: 'Save Deck',
    deckNamePlaceholder: 'Deck name',
    save: 'Save',
    cancel: 'Cancel',

    cards: 'cards',

    // Messages
    loading: 'Loading...',
    noResults: 'No cards found',
    error: 'Error loading cards',

    deckSaved: 'Deck saved successfully!',
    deckImported: 'Deck imported successfully!',
    deckExported: 'Deck exported successfully!',
    invalidFile: 'Invalid file format',

    confirmClear: 'Are you sure you want to clear the current deck?',
    confirmDelete: 'Are you sure you want to delete this deck?',

    // Formats & Validation
    format: 'Format',
    standard: 'Standard',
    modern: 'Modern',
    commander: 'Commander',
    vintage: 'Vintage',
    pauper: 'Pauper',
    freeform: 'Freeform',
    valid: 'Valid',
    invalid: 'Invalid',
    edit: 'Edit',
    saveChanges: 'Save Changes',
    saveAsNew: 'Save as New',
    editingDeck: 'Editing Deck',
    activeEditingMode: 'Active Editing Mode',
    cardAdded: 'Card added to deck!',
    deckValidation: 'Deck Validation',
    deckRulesExplanation:
      'Standard, Modern, Vintage, Pauper require min 60 cards & max 4 copies. Commander requires exactly 100 cards & max 1 copy (singletons). Pauper allows only common rarity.',
    savedLocationNote:
      "Decks are securely stored locally on this machine using your browser's localStorage. You can also export them as JSON to backup or share.",

    validationEmptyDeck: 'The deck is empty.',
    validationMinCards: 'The deck must have at least 60 cards (currently has {{count}}).',
    validationMaxCopies: 'Limit of copies exceeded: "{{name}}" has {{count}} copies (maximum allowed is {{max}}).',
    validationCommanderExactCards: 'Commander decks must have exactly 100 cards (currently has {{count}}).',
    validationCommanderSingleton:
      'Duplicate found: "{{name}}" has {{count}} copies (maximum allowed in Commander is 1).',
    validationPauperCommonsOnly: 'Pauper allows only common cards. The following cards are not common: {{list}}.',
    validationFormatSuccess: '✓ Deck complies with all format requirements!',

    manaCostLabel: 'Mana Cost',
    textLabel: 'Text',
    powerToughnessLabel: 'Power/Toughness',
    rarityLabel: 'Rarity',
    setLabel: 'Set',
    close: 'Close',
    export: 'Export',
    delete: 'Delete'
  }
};

export default en;
