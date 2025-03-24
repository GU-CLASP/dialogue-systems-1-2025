import { puzzle } from "./types.ts"

/* puzzle adapted from https://www.template.net/editable/118924/small-crossword */
const words0En: puzzle = {
  finger: {
    definition: {
      english: "Part of your hand",
      french: "Une partie de ta main"
    },
    connections: {
      luggage: {letter: "G", position: 3}
    },
    location: "1.3",
    across: false
  },
  watch: {
    definition: {
      english: "Worn on your wrist that tells time",
      french: "À ton poignet, elle donne l'heure"
    },
    connections: {
      hour: {letter: "H", position: 1},
      luggage: {letter: "A", position: 5},
    },
    location: "3.5",
    across: false
  },
  laptop: {
    definition: {
      english: "Portable computer",
      french: "Ordinateur portable"
    },
    connections: {
      luggage: {letter: "L", position: 1}
    },
    location: "4.1",
    across: false
  },
  luggage: {
    definition: {
      english: "Travel bag",
      french: "Sac de voyage"
    },
    connections: {
      laptop: {letter: "L", position: 1},
      watch: {letter: "A", position: 2},
      finger: {letter: "G", position: 4},
    },
    location: "4.1",
    across: true
  },
  hour: {
    definition: {
      english: "A period of 60 minutes",
      french: "Une durée de 60 minutes"},
    connections: {
      watch: {letter: "H", position: 5}
    },
    location: "7.5",
    across: true
  },
}

/* puzzle adapted from https://www.fiche-maternelle.com/mots-croises-printemps.jpg */
const words0Fr: puzzle = {
  oiseau: {
    definition: {
      english: "an animal with feathers and wings",
      french: "un animal couverts de plumes et qui a des ailes"
    },
    connections: {
      printemps: {letter: "I", position: 3}
    },
    location: "2.3",
    across: false
  },
  fleur: {
    definition: {
      english: "the part of a plant that is coloured and has a pleasant smell",
      french: "la partie d'une plante qui est colorée et parfumée"
    },
    connections: {
      printemps: {letter: "E", position: 6},
    },
    location: "1.6",
    across: false
  },
  papillon: {
    definition: {
      english: "an insect with large, coloured wings",
      french: "un insecte avec de larges ailes colorées"
    },
    connections: {
      printemps: {letter: "P", position: 8},
      bourgeon: {letter: "O", position: 7}
    },
    location: "3.8",
    across: false
  },
  fraise: {
    definition: {
      english: "a juicy red fruit that can be found in the woods",
      french: "un fruit rouge juteux que l'on peut trouver dans les bois"
    },
    connections: {
      bourgeon: {letter: "R", position: 4},
      miel: {letter: "I", position: 2},
    },
    location: "8.5",
    across: false
  },
  printemps: {
    definition: {
      english: "the season of the year between winter and summer",
      french: "la saison entre l'hiver et l'été"},
    connections: {
      oiseau: {letter: "I", position: 2},
      fleur: {letter: "E", position: 3},
      papillon: {letter: "P", position: 1}
    },
    location: "3.1",
    across: true
  },
  bourgeon: {
    definition: {
      english: "newly formed leaf or flower that has not yet unfolded",
      french: "bouton de fleur"},
    connections: {
      fraise: {letter: "R", position: 2},
      papillon: {letter: "O", position: 7}
    },
    location: "9.2",
    across: true 
  },
  miel: {
    definition: {
      english: "some sweet made by bees",
      french: "une douceur préparée par les abeilles"},
    connections: {
      fraise: {letter: "I", position: 4},
    },
    location: "11.4",
    across: true 
  },
}

/* puzzle adapted from https://www.studyvillage.com/attachments/3949-solution-general-crossword-puzzle-1 */
const words1En: puzzle = {
  walk: {
    definition: {
      english: "Eyes is to see as leg is to...",
      french: "Les yeux pour voir et les jambes pour..."
    },
    connections: {
      library: {letter: "L", position: 1}
    },
    location: "1.3",
    across: true
  },
  sunday: {
    definition: {
      english: "Holiday of the week",
      french: "Congé hebdomadaire"
    },
    connections: {
      smooth: {letter: "S", position: 1},
      library: {letter: "A", position: 5},
    },
    location: "5.1",
    across: true
  },
  team: {
    definition: {
      english: "Playing game together",
      french: "Joue ensemble"
    },
    connections: {
      tiger: {letter: "T", position: 1},
      september: {letter: "M", position: 6}
    },
    location: "8.9",
    across: true
  },
  teacher: {
    definition: {
      english: "A person who teaches in school",
      french: "Une personne qui enseigne à l'école"
    },
    connections: {
      smooth: {letter: "T", position: 5},
      house: {letter: "H", position: 1},
      four: {letter: "R", position: 4},
    },
    location: "9.1",
    across: true
  },
  hundred: {
    definition: {
      english: "58 + 42 =",
      french: "58 + 42 ="},
    connections: {
      house: {letter: "U", position: 3},
      tiger: {letter: "E", position: 4}
    },
    location: "11.4",
    across: true
  },
  red: {
    definition: {
      english: "Traffic color light which means stop",
      french: "Couleur de feu qui signale l'arrêt obligatoire"},
    connections: {
      september: {letter: "R", position: 9},
    },
    location: "11.12",
    across: true
  },
  camel: {
    definition: {
      english: "Ship of the desert",
      french: "Vaisseau du désert"},
    connections: {
      house: {letter: "E", position: 5},
    },
    location: "13.2",
    across: true
  },
  library: {
    definition: {
      english: "Collection of books",
      french: "Collection de livres"},
    connections: {
      walk: {letter: "L", position: 3},
      sunday: {letter: "A", position: 5}
    },
    location: "1.5",
    across: false
  },
  september: {
    definition: {
      english: "Ninth month of the year",
      french: "Neuvième mois de l'année"},
    connections: {
      team: {letter: "M", position: 4},
      red: {letter: "R", position: 1}
    },
    location: "3.12",
    across: false
  },
  smooth: {
    definition: {
      english: "Opposite of rough",
      french: "Contraire de rugueux"},
    connections: {
      sunday: {letter: "S", position: 1},
      teacher: {letter: "T", position: 1}
    },
    location: "5.1",
    across: false
  },
  four: {
    definition: {
      english: "How many bails are required in cricket?",
      french: "Combien faut-il de barrettes au cricket ?"},
    connections: {
      teacher: {letter: "R", position: 7},
    },
    location: "6.7",
    across: false
  },
  tiger: {
    definition: {
      english: "National animal of India",
      french: "Animal national de l´Inde"},
    connections: {
      team: {letter: "T", position: 1},
      hundred: {letter: "E", position: 6}
    },
    location: "8.9",
    across: false
  },
  house: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "9.5",
    across: false
  },
}

/* puzzle adapted from https://i.pinimg.com/originals/b0/7b/10/b07b10b196ecb8fcc22ec45f07fcb9dc.png */
const words1Fr: puzzle = {
  équerre: {
    definition: {
      english: "used for drawing right angles",
      french: "pour tracer des angles droits"
    },
    connections: {
      élu: {letter: "E", position: 1}
    },
    location: "1.3",
    across: true
  },
  parapluie: {
    definition: {
      english: "protection against the rain",
      french: "protège de la pluie"
    },
    connections: {
      ami: {letter: "A", position: 1},
      lettres: {letter: "L", position: 1},
      élu: {letter: "U", position: 3},
    },
    location: "3.3",
    across: true
  },
  fraise: {
    definition: {
      english: "a red fruit",
      french: "fruit rouge"
    },
    connections: {
      neuf: {letter: "F", position: 4},
      armoire: {letter: "A", position: 1},
      ami: {letter: "I", position: 3},
    },
    location: "5.1",
    across: true
  },
  toit: {
    definition: {
      english: "covers a building",
      french: "couvre la maison"
    },
    connections: {
      lettres: {letter: "T", position: 4},
      singe: {letter: "I", position: 2},
    },
    location: "6.8",
    across: true
  },
  mentir: {
    definition: {
      english: "to say something untrue",
      french: "tromper"},
    connections: {
      armoire: {letter: "M", position: 3},
      tuyau: {letter: "T", position: 1},
      lettres: {letter: "R", position: 5},
    },
    location: "7.3",
    across: true
  },
  suer: {
    definition: {
      english: "to have sweat come through the skin's pores",
      french: "mouiller sa chemise"},
    connections: {
      lettres: {letter: "S", position: 7},
      singe: {letter: "E", position: 5}
    },
    location: "9.8",
    across: true
  },
  mur: {
    definition: {
      english: "separates rooms in the house",
      french: "sépare les pièces d'une maison"},
    connections: {
      film: {letter: "M", position: 4},
      armoire: {letter: "R", position: 6},
    },
    location: "10.1",
    across: true
  },
  enfumer: {
    definition: {
      english: "to fill with smoke",
      french: "remplir de fumée"},
    connections: {
      armoire: {letter: "E", position: 7},
      tuyau: {letter: "U", position: 5}
    },
    location: "11.3",
    across: true
  },
  élu: {
    definition: {
      english: "chosen by voting",
      french: "choisi par vote"},
    connections: {
      équerre: {letter: "E", position: 7},
      parapluie: {letter: "U", position: 7}
    },
    location: "1.9",
    across: false
  },
  neuf: {
    definition: {
      english: "odd number",
      french: "chiffre impair"},
    connections: {
      fraise: {letter: "F", position: 1},
    },
    location: "2.1",
    across: false
  },
  ami: {
    definition: {
      english: "a person you like",
      french: "mon meilleur copain"},
    connections: {
      parapluie: {letter: "A", position: 2},
      fraise: {letter: "I", position: 4},
    },
    location: "3.4",
    across: false
  },
  lettres: {
    definition: {
      english: "they are delivered by the postman",
      french: "le facteur les distribue"},
    connections: {
      parapluie: {letter: "L", position: 6},
      toit: {letter: "T", position: 1},
      mentir: {letter: "R", position: 6},
      suer: {letter: "S", position: 1},
    },
    location: "3.8",
    across: false
  },
  armoire: {
    definition: {
      english: "furniture for storing clothes",
      french: "on y range nos vêtements"},
    connections: {
      fraise: {letter: "A", position: 3},
      mentir: {letter: "M", position: 1},
      mur: {letter: "R", position: 3},
      enfumer : {letter: "E", position: 1},
    },
    location: "5.3",
    across: false
  },
  singe: {
    definition: {
      english: "swing from branch to branch",
      french: "saute de branche en branche"},
    connections: {
      toit: {letter: "I", position: 3},
      suer: {letter: "E", position: 3},
    },
    location: "5.10",
    across: false
  },
  film: {
    definition: {
      english: "shown in a cinema",
      french: "on le regarde au cinéma"},
    connections: {
      mur: {letter: "M", position: 1},
    },
    location: "7.1",
    across: false
  },
  tuyau: {
    definition: {
      english: "supplies water into the house",
      french: "amène l'eau dans la maison"},
    connections: {
      mentir: {letter: "T", position: 4},
      enfumer: {letter: "U", position: 5},
    },
    location: "7.6",
    across: false
  }
}


const words2En: puzzle = {
  UN: {
    definition: {
      english: "international organization set up after WWII to encourage political and economic cooperation",
      french: ""
    },
    connections: {
      library: {letter: "L", position: 1}
    },
    location: "1.1",
    across: true
  },
  share: {
    definition: {
      english: "part ownership of a company that can be bought and sold in stock markets",
      french: ""
    },
    connections: {
      smooth: {letter: "S", position: 1},
      library: {letter: "A", position: 5},
    },
    location: "1.4",
    across: true
  },
  growth: {
    definition: {
      english: "increase in goods and services production often used to define an economy's success",
      french: ""
    },
    connections: {
      tiger: {letter: "T", position: 1},
      september: {letter: "M", position: 6}
    },
    location: "1.10",
    across: true
  },
  aid: {
    definition: {
      english: "anything given from one country to another for helping people in need",
      french: ""
    },
    connections: {
      smooth: {letter: "T", position: 5},
      house: {letter: "H", position: 1},
      four: {letter: "R", position: 4},
    },
    location: "2.16",
    across: true
  },
  monopoly: {
    definition: {
      english: "when a single business controls most of a market or supply chain",
      french: ""},
    connections: {
      house: {letter: "U", position: 3},
      tiger: {letter: "E", position: 4}
    },
    location: "3.1",
    across: true
  },
  informal: {
    definition: {
      english: "an economy where buying and selling isn't regulated by the government",
      french: ""},
    connections: {
      september: {letter: "R", position: 9},
    },
    location: "4.10",
    across: true
  },
  utility: {
    definition: {
      english: "Ship of the desert",
      french: "Vaisseau du désert"},
    connections: {
      house: {letter: "E", position: 5},
    },
    location: "5.3",
    across: true
  },
  exports: {
    definition: {
      english: "Collection of books",
      french: "Collection de livres"},
    connections: {
      walk: {letter: "L", position: 3},
      sunday: {letter: "A", position: 5}
    },
    location: "7.5",
    across: true
  },
  employs: {
    definition: {
      english: "Ninth month of the year",
      french: "Neuvième mois de l'année"},
    connections: {
      team: {letter: "M", position: 4},
      red: {letter: "R", position: 1}
    },
    location: "7.13",
    across: true
  },
  costs: {
    definition: {
      english: "Opposite of rough",
      french: "Contraire de rugueux"},
    connections: {
      sunday: {letter: "S", position: 1},
      teacher: {letter: "T", position: 1}
    },
    location: "9.1",
    across: true
  },
  bailout: {
    definition: {
      english: "How many bails are required in cricket?",
      french: "Combien faut-il de barrettes au cricket ?"},
    connections: {
      teacher: {letter: "R", position: 7},
    },
    location: "9.11",
    across: true
  },
  asia: {
    definition: {
      english: "National animal of India",
      french: "Animal national de l´Inde"},
    connections: {
      team: {letter: "T", position: 1},
      hundred: {letter: "E", position: 6}
    },
    location: "11.1",
    across: true
  },
  labour: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "11.6",
    across: true
  },
  unit: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "11.15",
    across: true
  },
  me: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.3",
    across: true
  },
  monetary: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.11",
    across: true
  },
  wages: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "14.5",
    across: true
  },
  vote: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "15.1",
    across: true
  },
  bbc: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "15.11",
    across: true
  },
  snp: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "15.16",
    across: true
  },
  NGO: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "1.2",
    across: false
  },
  happiness: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "1.5",
    across: false
  },
  gini: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "1.10",
    across: false
  },
  GDP: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "1.18",
    across: false
  },
  adam: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "2.16",
    across: false
  },
  marx: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "3.1",
    across: false
  },
  competition: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "3.13",
    across: false
  },
  no: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "4.11",
    across: false
  },
  two: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "5.8",
    across: false
  },
  ft: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "6.10",
    across: false
  },
  soft: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "6.17",
    across: false
  },
  goods: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "7.2",
    across: false
  },
  pay: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "7.7",
    across: false
  },
  subprime: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "7.11",
    across: false
  },
  product: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "7.15",
    across: false
  },
  trade: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "9.4",
    across: false
  },
  boom: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "9.9",
    across: false
  },
  global: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "10.6",
    across: false
  },
  toy: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "11.18",
    across: false
  },
  guv: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.1",
    across: false
  },
  MMT: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.3",
    across: false
  },
  fee: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.8",
    across: false
  },
  EEC: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.14",
    across: false
  },
  run: {
    definition: {
      english: "A place where we live",
      french: "Un lieu de vie"},
    connections: {
      teacher: {letter: "H", position: 5},
      hundred: {letter: "U", position: 2},
      camel: {letter: "E", position: 4},
    },
    location: "13.17",
    across: false
  },
}

/* puzzle adapted from CROISÉS Niveau 4/5, Nº122, page 3 (2025). Sport Cérébral. */
const words2Fr: puzzle = {
  barrique: {
    definition: {
      english: "",
      french: "est remplie de vin"
    },
    connections: {
      bipolaire: {letter: "B", position: 1},
      adamo: {letter: "A", position: 1},
      répétés: {letter: "R", position: 1},
      réer: {letter: "R", position: 1},
      qatar: {letter: "Q", position: 1},
      usé: {letter: "U", position: 1},
      es: {letter: "E", position: 1}
    },
    location: "1.1",
    across: true
  },
  afin: {
    definition: {
      english: "",
      french: "peut accompagner un desseim"
    },
    connections: {
      adresse: {letter: "A", position: 1},
      fuit: {letter: "F", position: 1},
      née: {letter: "N", position: 1},
    },
    location: "1.10",
    across: true
  },
  idée: {
    definition: {
      english: "",
      french: "on chasse la noire"
    },
    connections: {
      bipolaire: {letter: "I", position: 2},
      adamo: {letter: "D", position: 2},
      répétés: {letter: "E", position: 2},
      réer: {letter: "E", position: 2},
    },
    location: "2.1",
    across: true
  },
  assidu: {
    definition: {
      english: "",
      french: "qui ne rate rien"
    },
    connections: {
      qatar: {letter: "A", position: 2},
      usé: {letter: "S", position: 2},
      es: {letter: "S", position: 2},
      ignée: {letter: "I", position: 1},
      adresse: {letter: "D", position: 2},
      fuit: {letter: "U", position: 2},
    },
    location: "2.6",
    across: true
  },
  papeete: {
    definition: {
      english: "",
      french: "port de Vahinés"},
    connections: {
      bipolaire: {letter: "P", position: 3},
      adamo: {letter: "A", position: 3},
      répétés: {letter: "P", position: 3},
      réer: {letter: "E", position: 3},
      étourdi: {letter: "E", position: 1},
      qatar: {letter: "T", position: 3},
      usé: {letter: "E", position: 3},
    },
    location: "3.1",
    across: true
  },
  grime: {
    definition: {
      english: "",
      french: "vieillard ridicule"},
    connections: {
      ignées: {letter: "G", position: 2},
      adresse: {letter: "R", position: 3},
      fuit: {letter: "I", position: 3},
      modelée: {letter: "M", position: 1},
      née: {letter: "E", position: 3},
    },
    location: "3.9",
    across: true 
  },
  omerta: {
    definition: {
      english: "",
      french: "une loi contraire à la loi"},
    connections: {
      bipolaire: {letter: "O", position: 4},
      adamo: {letter: "M", position: 4},
      répétés: {letter: "E", position: 4},
      réer: {letter: "R", position: 4},
      étourdi: {letter: "T", position: 2},
      qatar: {letter: "A", position: 4},
    },
    location: "4.1",
    across: true 
  },
  aneto: {
    definition: {
      english: "",
      french: "grand d'Espagne"},
    connections: {
      agréer: {letter: "A", position: 1},
      ignée: {letter: "N", position: 3},
      adresse: {letter: "E", position: 4},
      fuit: {letter: "T", position: 4},
      modelée: {letter: "O", position: 2},
    },
    location: "4.8",
    across: true 
  },
  lot: {
    definition: {
      english: "",
      french: "on peut tirer le gros"},
    connections: {
      bipolaire: {letter: "L", position: 5},
      adamo: {letter: "O", position: 5},
      répétés: {letter: "T", position: 5},
    },
    location: "5.1",
    across: true 
  },
  orages: {
    definition: {
      english: "",
      french: "perturbations atmosphériques"},
    connections: {
      étourdi: {letter: "O", position: 3},
      qatar: {letter: "R", position: 5},
      atèle: {letter: "A", position: 1},
      agréer: {letter: "G", position: 2},
      ignée: {letter: "E", position: 4},
      adresse: {letter: "S", position: 5},
    },
    location: "5.5",
    across: true 
  },
  do: {
    definition: {
      english: "",
      french: "sur la portée"},
    connections: {
      modelée: {letter: "D", position: 3},
      orées: {letter: "O", position: 1},
    },
    location: "5.12",
    across: true 
  },
  écu: {
    definition: {
      english: "",
      french: "sonnait et trébuchait"},
    connections: {
      répétés: {letter: "E", position: 6},
      cuir: {letter: "C", position: 1},
      étourdi: {letter: "U", position: 4},
    },
    location: "6.3",
    across: true 
  },
  tresser: {
    definition: {
      english: "",
      french: "bosser pour obtenir du galon"},
    connections: {
      atèle: {letter: "T", position: 2},
      agréer: {letter: "R", position: 3},
      ignée: {letter: "E", position: 5},
      adresse: {letter: "S", position: 6},
      sole: {letter: "S", position: 1},
      modelée: {letter: "E", position: 4},
      orées: {letter: "R", position: 2},
    },
    location: "6.7",
    across: true 
  },
  insurgée: {
    definition: {
      english: "",
      french: "a un air mutin"},
    connections: {
      bipolaire: {letter: "I", position: 7},
      nem: {letter: "N", position: 1},
      répétés: {letter: "S", position: 7},
      cuir: {letter: "U", position: 2},
      étourdi: {letter: "R", position: 5},
      go: {letter: "G", position: 1},
      atèle: {letter: "E", position: 3},
      agréer: {letter: "E", position: 4},
    },
    location: "7.1",
    across: true 
  },
  éole: {
    definition: {
      english: "",
      french: "un type dans le vent"},
    connections: {
      adresse: {letter: "E", position: 7},
      sole: {letter: "O", position: 2},
      modelée: {letter: "L", position: 5},
      orées: {letter: "E", position: 3},
    },
    location: "7.10",
    across: true 
  },
  ré: {
    definition: {
      english: "",
      french: "petite terre"},
    connections: {
      bipolaire: {letter: "R", position: 8},
      nem: {letter: "E", position: 2},
    },
    location: "8.1",
    across: true 
  },
  idoles: {
    definition: {
      english: "",
      french: "les jeunes ont les leurs"},
    connections: {
      cuir: {letter: "I", position: 3},
      étourdi: {letter: "D", position: 6},
      go: {letter: "O", position: 2},
      atèle: {letter: "L", position: 4},
      agréer: {letter: "E", position: 5},
      si: {letter: "S", position: 1},
    },
    location: "8.4",
    across: true 
  },
  lee: {
    definition: {
      english: "",
      french: "bruce au cinéma"},
    connections: {
      sole: {letter: "L", position: 3},
      modelée: {letter: "E", position: 6},
      orées: {letter: "E", position: 4},
    },
    location: "8.11",
    across: true 
  },
  emeri: {
    definition: {
      english: "",
      french: "certains y sont bouchés"},
    connections: {
      bipolaire: {letter: "E", position: 9},
      nem: {letter: "M", position: 3},
      cuir: {letter: "R", position: 4},
      étourdi: {letter: "I", position: 7},
    },
    location: "9.1",
    across: true 
  },
  érigées: {
    definition: {
      english: "",
      french: "dressées"},
    connections: {
      atèle: {letter: "E", position: 5},
      agréer: {letter: "R", position: 6},
      si: {letter: "I", position: 2},
      sole: {letter: "E", position: 4},
      modelée: {letter: "E", position: 7},
      orées: {letter: "S", position: 5},
    },
    location: "9.7",
    across: true 
  },
  bipolaire: {
    definition: {
      english: "",
      french: "avec un trouble de l'humeur"},
    connections: {
      barrique: {letter: "B", position: 1},
      idée: {letter: "I", position: 1},
      papeete: {letter: "P", position: 1},
      omerta: {letter: "O", position: 1},
      lot: {letter: "L", position: 1},
      insurgée: {letter: "I", position: 1},
      ré: {letter: "R", position: 1},
      emeri: {letter: "E", position: 1},
    },
    location: "1.1",
    across: false 
  },
  adamo: {
    definition: {
      english: "",
      french: "il chante 'la nuit'"},
    connections: {
      barrique: {letter: "A", position: 2},
      idée: {letter: "D", position: 2},
      papeete: {letter: "A", position: 2},
      omerta: {letter: "M", position: 2},
      lot: {letter: "O", position: 2},
    },
    location: "1.2",
    across: false 
  },
  nem: {
    definition: {
      english: "",
      french: "a conquis les palais occidentaux"},
    connections: {
      insurgée: {letter: "N", position: 2},
      ré: {letter: "E", position: 2},
      emeri: {letter: "M", position: 2},
    },
    location: "7.2",
    across: false 
  },
  répétés: {
    definition: {
      english: "",
      french: "joués en avant première"},
    connections: {
      barrique: {letter: "R", position: 3},
      idée: {letter: "E", position: 3},
      papeete: {letter: "P", position: 3},
      omerta: {letter: "E", position: 3},
      lot: {letter: "T", position: 3},
      écu: {letter: "E", position: 1},
      insurgée: {letter: "S", position: 3},
    },
    location: "1.3",
    across: false 
  },
  réer: {
    definition: {
      english: "",
      french: "faire le chevreuil"},
    connections: {
      barrique: {letter: "R", position: 4},
      idée: {letter: "E", position: 4},
      papeete: {letter: "E", position: 4},
      omerta: {letter: "R", position: 4},
    },
    location: "1.4",
    across: false 
  },
  cuir: {
    definition: {
      english: "",
      french: "peau de vache"},
    connections: {
      écu: {letter: "C", position: 2},
      insurgée: {letter: "U", position: 4},
      idoles: {letter: "I", position: 1},
      emeri: {letter: "R", position: 4},
    },
    location: "6.4",
    across: false 
  },
  étourdi: {
    definition: {
      english: "",
      french: "grisé"},
    connections: {
      papeete: {letter: "E", position: 5},
      omerta: {letter: "T", position: 5},
      orages: {letter: "O", position: 1},
      écu: {letter: "U", position: 3},
      insurgée: {letter: "R", position: 5},
      idoles: {letter: "D", position: 2},
      emeri: {letter: "I", position: 5},
    },
    location: "3.5",
    across: false 
  },
  qatar: {
    definition: {
      english: "",
      french: "membre de l'OPEP"},
    connections: {
      barrique: {letter: "Q", position: 6},
      assidu: {letter: "A", position: 1},
      papeete: {letter: "T", position: 6},
      omerta: {letter: "A", position: 6},
      orages: {letter: "R", position: 2},
    },
    location: "1.6",
    across: false 
  },
  go: {
    definition: {
      english: "",
      french: "en avant à Londres"},
    connections: {
      insurgée: {letter: "G", position: 6},
      idoles: {letter: "O", position: 3},
    },
    location: "7.6",
    across: false 
  },
  usé: {
    definition: {
      english: "",
      french: "répété à maintes reprises"},
    connections: {
      barrique: {letter: "U", position: 7},
      assidu: {letter: "S", position: 2},
      papeete: {letter: "E", position: 7},
    },
    location: "1.7",
    across: false 
  },
  atèle: {
    definition: {
      english: "",
      french: "plus singe qu'araignée"},
    connections: {
      orages: {letter: "A", position: 3},
      tresser: {letter: "T", position: 1},
      insurgée: {letter: "E", position: 7},
      idoles: {letter: "L", position: 4},
      érigées: {letter: "E", position: 1},
    },
    location: "5.7",
    across: false 
  },
  es: {
    definition: {
      english: "",
      french: "forme d'être"},
    connections: {
      barrique: {letter: "E", position: 8},
      assidu: {letter: "S", position: 3},
    },
    location: "1.8",
    across: false 
  },
  agréer: {
    definition: {
      english: "",
      french: "approuver"},
    connections: {
      aneto: {letter: "A", position: 1},
      orages: {letter: "G", position: 4},
      tresser: {letter: "R", position: 2},
      insurgée: {letter: "E", position: 8},
      idoles: {letter: "E", position: 5},
      érigées: {letter: "R", position: 2},
    },
    location: "4.8",
    across: false 
  },
  ignée: {
    definition: {
      english: "",
      french: "embrasée"},
    connections: {
      assidu: {letter: "I", position: 4},
      grime: {letter: "G", position: 1},
      aneto: {letter: "N", position: 2},
      orages: {letter: "E", position: 5},
      tresser: {letter: "E", position: 3},
    },
    location: "2.9",
    across: false 
  },
  si: {
    definition: {
      english: "",
      french: "clef des rêves"},
    connections: {
      idoles: {letter: "S", position: 6},
      érigées: {letter: "I", position: 3},
    },
    location: "8.9",
    across: false 
  },
  adresse: {
    definition: {
      english: "",
      french: "fait parvenir"},
    connections: {
      afin: {letter: "A", position: 1},
      assidu: {letter: "D", position: 5},
      grime: {letter: "R", position: 2},
      aneto: {letter: "E", position: 3},
      orages: {letter: "S", position: 6},
      tresser: {letter: "S", position: 4},
      éole: {letter: "E", position: 1},
    },
    location: "1.10",
    across: false 
  },
  fuit: {
    definition: {
      english: "",
      french: "manque de courage"},
    connections: {
      afin: {letter: "F", position: 2},
      assidu: {letter: "U", position: 6},
      grime: {letter: "I", position: 3},
      aneto: {letter: "T", position: 4}
    },
    location: "1.11",
    across: false 
  },
  sole: {
    definition: {
      english: "",
      french: "elle touche souvent le fond"},
    connections: {
      tresser: {letter: "S", position: 5},
      éole: {letter: "O", position: 2},
      lee: {letter: "L", position: 1},
      érigées: {letter: "E", position: 5},
    },
    location: "6.11",
    across: false 
  },
  modelée: {
    definition: {
      english: "",
      french: "pétrie comme une pâte"},
    connections: {
      grime: {letter: "M", position: 4},
      aneto: {letter: "O", position: 5},
      do: {letter: "D", position: 1},
      tresser: {letter: "E", position: 6},
      éole: {letter: "L", position: 3},
      lee: {letter: "E", position: 2},
      érigées: {letter: "E", position: 6},
    },
    location: "3.12",
    across: false 
  },
  née: {
    definition: {
      english: "",
      french: "venue à terme"},
    connections: {
      afin: {letter: "N", position: 4},
      grime: {letter: "E", position: 5},
    },
    location: "1.13",
    across: false 
  },
  orées: {
    definition: {
      english: "",
      french: "passages forestiers"},
    connections: {
      do: {letter: "O", position: 2},
      tresser: {letter: "R", position: 7},
      éole: {letter: "E", position: 4},
      lee: {letter: "E", position: 3},
      érigées: {letter: "S", position: 7},
    },
    location: "5.13",
    across: false 
  },
}

export const puzzles: {[index: number] : {[language: string] : puzzle}} = {
  0: {english: words0En, french: words0Fr},
  1: {english: words1En, french: words1Fr},
  2: {english: words1En, french: words2Fr},
}