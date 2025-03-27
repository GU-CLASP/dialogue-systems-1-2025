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

/* puzzle adapted from https://weekly.kingfeatures.com/?team=games-and-puzzles */
const words2En: puzzle = {
  gap: {
    definition: {
      english: "space",
      french: "espace"
    },
    connections: {
      gas: {letter: "G", position: 1},
      aga: {letter: "A", position: 1},
      pot: {letter: "P", position: 1},
    },
    location: "1.1",
    across: true
  },
  halos: {
    definition: {
      english: "angel's illuminants",
      french: "lumières des anges"
    },
    connections: {
      helped: {letter: "H", position: 1},
      allstar: {letter: "A", position: 1},
      lei: {letter: "L", position: 1},
      octet: {letter: "O", position: 1},
      steres: {letter: "S", position: 1},
    },
    location: "1.5",
    across: true
  },
  sum: {
    definition: {
      english: "total",
      french: "total"
    },
    connections: {
      satisfied: {letter: "S", position: 1},
      upon: {letter: "U", position: 1},
      mete: {letter: "M", position: 1},
    },
    location: "1.11",
    across: true
  },
  ago: {
    definition: {
      english: "past",
      french: "passé"
    },
    connections: {
      gas: {letter: "A", position: 2},
      aga: {letter: "G", position: 2},
      pot: {letter: "O", position: 2},
    },
    location: "2.1",
    across: true
  },
  elect: {
    definition: {
      english: "vote into office",
      french: "voter"
    },
    connections: {
      helped: {letter: "E", position: 2},
      allstar: {letter: "L", position: 2},
      lei: {letter: "E", position: 2},
      octet: {letter: "C", position: 2},
      steres: {letter: "T", position: 2},
    },
    location: "2.5",
    across: true
  },
  ape: {
    definition: {
      english: "gorilla",
      french: "gorille"
    },
    connections: {
      satisfied: {letter: "A", position: 2},
      upon: {letter: "P", position: 2},
      mete: {letter: "E", position: 2},
    },
    location: "2.11",
    across: true
  },
  satellite: {
    definition: {
      english: "moon, for instance",
      french: "la lune, par exemple"
    },
    connections: {
      gas: {letter: "S", position: 3},
      aga: {letter: "A", position: 3},
      pot: {letter: "T", position: 3},
      elk: {letter: "E", position: 1},
      helped: {letter: "L", position: 3},
      allstar: {letter: "L", position: 3},
      lei: {letter: "I", position: 3},
      octet: {letter: "T", position: 3},
      steres: {letter: "E", position: 3},
    },
    location: "3.1",
    across: true
  },
  tot: {
    definition: {
      english: "youngster",
      french: "bambin"
    },
    connections: {
      satisfied: {letter: "T", position: 3},
      upon: {letter: "O", position: 3},
      mete: {letter: "T", position: 3},
    },
    location: "3.11",
    across: true
  },
  lps: {
    definition: {
      english: "CD's forerunners",
      french: "ancêtres du CD"
    },
    connections: {
      elk: {letter: "L", position: 2},
      helped: {letter: "P", position: 4},
      allstar: {letter: "S", position: 4},
    },
    location: "4.4",
    across: true
  },
  ermine: {
    definition: {
      english: "winter weasel",
      french: "belette d'hiver"
    },
    connections: {
      octet: {letter: "E", position: 4},
      steres: {letter: "R", position: 4},
      mead: {letter: "M", position: 1},
      satisfied: {letter: "I", position: 4},
      upon: {letter: "N", position: 4},
      mete: {letter: "E", position: 4},
    },
    location: "4.8",
    across: true
  },
  basket: {
    definition: {
      english: "easter egg container",
      french: "on y met les oeufs de pâques"
    },
    connections: {
      bars: {letter: "B", position: 1},
      abel: {letter: "A", position: 1},
      saturdays: {letter: "S", position: 1},
      elk: {letter: "K", position: 3},
      helped: {letter: "E", position: 5},
      allstar: {letter: "T", position: 5},
    },
    location: "5.1",
    across: true
  },
  tees: {
    definition: {
      english: "golf props",
      french: "chevilles de golf"
    },
    connections: {
      octet: {letter: "T", position: 5},
      steres: {letter: "E", position: 5},
      mead: {letter: "E", position: 2},
      satisfied: {letter: "S", position: 5},
    },
    location: "5.8",
    across: true
  },
  aba: {
    definition: {
      english: "American Bankers Association",
      french: "American Bankers Association"
    },
    connections: {
      bars: {letter: "A", position: 2},
      abel: {letter: "B", position: 2},
      saturdays: {letter: "A", position: 2},
    },
    location: "6.1",
    across: true
  },
  dam: {
    definition: {
      english: "water barrier",
      french: "barrière à eau"
    },
    connections: {
      helped: {letter: "D", position: 6},
      allstar: {letter: "A", position: 6},
      meg: {letter: "M", position: 1},
    },
    location: "6.5",
    across: true
  },
  safes: {
    definition: {
      english: "vaults",
      french: "chambres fortes"
    },
    connections: {
      steres: {letter: "S", position: 6},
      mead: {letter: "A", position: 3},
      satisfied: {letter: "F", position: 6},
      erne: {letter: "E", position: 1},
      seer: {letter: "S", position: 1},
    },
    location: "6.9",
    across: true
  },
  retd: {
    definition: {
      english: "abbreviation for 'on pension' ",
      french: "retraité abrégé"
    },
    connections: {
      bars: {letter: "R", position: 3},
      abel: {letter: "E", position: 3},
      saturdays: {letter: "T", position: 3},
      drug: {letter: "D", position: 1},
    },
    location: "7.1",
    across: true
  },
  res: {
    definition: {
      english: "in medias...",
      french: "in medias..."
    },
    connections: {
      allstar: {letter: "R", position: 7},
      meg: {letter: "E", position: 2},
      saltine: {letter: "S", position: 1},
    },
    location: "7.6",
    across: true
  },
  dire: {
    definition: {
      english: "tragic",
      french: "tragique"
    },
    connections: {
      mead: {letter: "D", position: 4},
      satisfied: {letter: "I", position: 7},
      erne: {letter: "R", position: 2},
      seer: {letter: "E", position: 2},
    },
    location: "7.10",
    across: true
  },
  slurs: {
    definition: {
      english: "speaks unclearly",
      french: "articule mal"
    },
    connections: {
      bars: {letter: "S", position: 4},
      abel: {letter: "L", position: 4},
      saturdays: {letter: "U", position: 4},
      drug: {letter: "R", position: 2},
      seesaw: {letter: "S", position: 1},
    },
    location: "8.1",
    across: true
  },
  gal: {
    definition: {
      english: "guy's counterpart",
      french: "une femme, familièrement"
    },
    connections: {
      meg: {letter: "G", position: 3},
      saltine: {letter: "A", position: 2},
      leaned: {letter: "L", position: 1},
    },
    location: "8.7",
    across: true
  },
  ene: {
    definition: {
      english: "away from WSW",
      french: "à l'opposé de OSO"
    },
    connections: {
      satisfied: {letter: "E", position: 8},
      erne: {letter: "N", position: 3},
      seer: {letter: "E", position: 3},
    },
    location: "8.11",
    across: true
  },
  rued: {
    definition: {
      english: "regretted",
      french: "regretté"
    },
    connections: {
      saturdays: {letter: "R", position: 5},
      drug: {letter: "U", position: 3},
      seesaw: {letter: "E", position: 2},
      drama: {letter: "D", position: 1},
    },
    location: "9.3",
    across: true
  },
  leader: {
    definition: {
      english: "maestro",
      french: "maestro"
    },
    connections: {
      saltine: {letter: "L", position: 3},
      leaned: {letter: "E", position: 2},
      add: {letter: "A", position: 1},
      satisfied: {letter: "D", position: 9},
      erne: {letter: "E", position: 4},
      seer: {letter: "R", position: 4},
    },
    location: "9.8",
    across: true
  },
  badger: {
    definition: {
      english: "animal for the Wisconsin",
      french: "blaireau"
    },
    connections: {
      bram: {letter: "B", position: 1},
      anna: {letter: "A", position: 1},
      saturdays: {letter: "D", position: 6},
      drug: {letter: "G", position: 4},
      seesaw: {letter: "E", position: 3},
      drama: {letter: "R", position: 2},
    },
    location: "10.1",
    across: true
  },
  tad: {
    definition: {
      english: "slight amount",
      french: "une petite quantité"
    },
    connections: {
      saltine: {letter: "T", position: 4},
      leaned: {letter: "A", position: 3},
      add: {letter: "D", position: 2},
    },
    location: "10.8",
    across: true
  },
  rna: {
    definition: {
      english: "genetic messenger",
      french: "messager génétique"
    },
    connections: {
      bram: {letter: "R", position: 2},
      anna: {letter: "N", position: 2},
      saturdays: {letter: "A", position: 7},
    },
    location: "11.1",
    across: true
  },
  satindoll: {
    definition: {
      english: "Duke Ellington classic",
      french: "un classique de Duke Ellington"
    },
    connections: {
      seesaw: {letter: "S", position: 4},
      drama: {letter: "A", position: 3},
      tin: {letter: "T", position: 1},
      saltine: {letter: "I", position: 5},
      leaned: {letter: "N", position: 4},
      add: {letter: "D", position: 3},
      owe: {letter: "O", position: 1},
      low: {letter: "L", position: 1},
      lee: {letter: "L", position: 1},
    },
    location: "11.5",
    across: true
  },
  any: {
    definition: {
      english: "whatever number",
      french: "n'importe quel nombre"
    },
    connections: {
      bram: {letter: "A", position: 3},
      anna: {letter: "N", position: 3},
      saturdays: {letter: "Y", position: 8},
    },
    location: "12.1",
    across: true
  },
  amine: {
    definition: {
      english: "derivative of ammonia",
      french: "dérivé de l'ammoniac"
    },
    connections: {
      seesaw: {letter: "A", position: 5},
      drama: {letter: "M", position: 4},
      tin: {letter: "I", position: 2},
      saltine: {letter: "N", position: 6},
      leaned: {letter: "E", position: 5},
    },
    location: "12.5",
    across: true
  },
  woe: {
    definition: {
      english: "trouble",
      french: "gros problème"
    },
    connections: {
      owe: {letter: "W", position: 2},
      low: {letter: "O", position: 2},
      lee: {letter: "E", position: 2},
    },
    location: "12.11",
    across: true
  },
  mas: {
    definition: {
      english: "'more' in Spanish",
      french: "'plus' en Espagnol"
    },
    connections: {
      bram: {letter: "M", position: 4},
      anna: {letter: "A", position: 4},
      saturdays: {letter: "S", position: 9},
    },
    location: "13.1",
    across: true
  },
  waned: {
    definition: {
      english: "subsided",
      french: "affaibli"
    },
    connections: {
      seesaw: {letter: "W", position: 6},
      drama: {letter: "A", position: 5},
      tin: {letter: "N", position: 3},
      saltine: {letter: "E", position: 7},
      leaned: {letter: "D", position: 6},
    },
    location: "13.5",
    across: true
  },
  ewe: {
    definition: {
      english: "ram's mate",
      french: "partenaire du bélier"
    },
    connections: {
      owe: {letter: "E", position: 3},
      low: {letter: "W", position: 3},
      lee: {letter: "E", position: 3},
    },
    location: "13.11",
    across: true
  },
  gas: {
    definition: {
      english: "petrol",
      french: "essence"
    },
    connections: {
      gap: {letter: "G", position: 1},
      ago: {letter: "A", position: 1},
      satellite: {letter: "S", position: 1},
    },
    location: "1.1",
    across: false
  },
  bars: {
    definition: {
      english: "behind them in jail",
      french: "en prison, on est derrière"
    },
    connections: {
      basket: {letter: "B", position: 1},
      aba: {letter: "A", position: 1},
      retd: {letter: "R", position: 1},
      slurs: {letter: "S", position: 1},
    },
    location: "5.1",
    across: false
  },
  bram: {
    definition: {
      english: "first name of Stoker, author of 'Dracula'",
      french: "prénom de Stoker, auteur de 'Dracula'"
    },
    connections: {
      badger: {letter: "B", position: 1},
      rna: {letter: "R", position: 1},
      any: {letter: "A", position: 1},
      mas: {letter: "M", position: 1},
    },
    location: "10.1",
    across: false
  },
  aga: {
    definition: {
      english: "khan title",
      french: "titre Khan"
    },
    connections: {
      gap: {letter: "A", position: 2},
      ago: {letter: "G", position: 2},
      satellite: {letter: "A", position: 2},
    },
    location: "1.2",
    across: false
  },
  abel: {
    definition: {
      english: "first victim",
      french: "première victime"
    },
    connections: {
      basket: {letter: "A", position: 2},
      aba: {letter: "B", position: 2},
      retd: {letter: "E", position: 2},
      slurs: {letter: "L", position: 2},
    },
    location: "5.2",
    across: false
  },
  anna: {
    definition: {
      english: "actress Paquin",
      french: "prénom de Paquin, actrice"
    },
    connections: {
      badger: {letter: "A", position: 2},
      rna: {letter: "N", position: 2},
      any: {letter: "N", position: 2},
      mas: {letter: "A", position: 2},
    },
    location: "10.2",
    across: false
  },
  pot: {
    definition: {
      english: "cauldron",
      french: "chaudron"
    },
    connections: {
      gap: {letter: "P", position: 3},
      ago: {letter: "O", position: 3},
      satellite: {letter: "T", position: 3},
    },
    location: "1.3",
    across: false
  },
  saturdays: {
    definition: {
      english: "halves of weekends",
      french: "des moitiés de weekends"
    },
    connections: {
      basket: {letter: "S", position: 3},
      aba: {letter: "A", position: 3},
      retd: {letter: "T", position: 3},
      slurs: {letter: "U", position: 3},
      rued: {letter: "R", position: 1},
      badger: {letter: "D", position: 3},
      rna: {letter: "A", position: 3},
      any: {letter: "Y", position: 3},
      mas: {letter: "S", position: 3},
    },
    location: "5.3",
    across: false
  },
  elk: {
    definition: {
      english: "wapiti",
      french: "wapiti"
    },
    connections: {
      satellite: {letter: "E", position: 4},
      lps: {letter: "L", position: 1},
      basket: {letter: "K", position: 4},
    },
    location: "3.4",
    across: false
  },
  drug: {
    definition: {
      english: "pharmaceutical",
      french: "médicament"
    },
    connections: {
      retd: {letter: "D", position: 4},
      slurs: {letter: "R", position: 4},
      rued: {letter: "U", position: 2},
      badger: {letter: "G", position: 4},
    },
    location: "7.4",
    across: false
  },
  helped: {
    definition: {
      english: "lent a hand",
      french: "donné un coup de main"
    },
    connections: {
      halos: {letter: "H", position: 1},
      elect: {letter: "E", position: 1},
      satellite: {letter: "L", position: 5},
      lps: {letter: "P", position: 2},
      basket: {letter: "E", position: 5},
      dam: {letter: "D", position: 1},
    },
    location: "1.5",
    across: false
  },
  seesaw: {
    definition: {
      english: "teeter-totter",
      french: "balançoire"
    },
    connections: {
      slurs: {letter: "S", position: 5},
      rued: {letter: "E", position: 3},
      badger: {letter: "E", position: 5},
      satindoll: {letter: "S", position: 1},
      amine: {letter: "A", position: 1},
      waned: {letter: "W", position: 1},
    },
    location: "8.5",
    across: false
  },
  allstar: {
    definition: {
      english: "outstanding athlete",
      french: "joueur exceptionnel"
    },
    connections: {
      halos: {letter: "A", position: 2},
      elect: {letter: "L", position: 2},
      satellite: {letter: "L", position: 6},
      lps: {letter: "S", position: 3},
      basket: {letter: "T", position: 6},
      dam: {letter: "A", position: 2},
      res: {letter: "R", position: 1},
    },
    location: "1.6",
    across: false
  },
  drama: {
    definition: {
      english: "Pulitzer prize category",
      french: "categorie de prix Pulitzer"
    },
    connections: {
      rued: {letter: "D", position: 4},
      badger: {letter: "R", position: 6},
      satindoll: {letter: "A", position: 2},
      amine: {letter: "M", position: 2},
      waned: {letter: "A", position: 2},
    },
    location: "9.6",
    across: false
  },
  lei: {
    definition: {
      english: "islander's neckwear",
      french: "collier de fleurs hawaïen"
    },
    connections: {
      halos: {letter: "L", position: 3},
      elect: {letter: "E", position: 3},
      satellite: {letter: "I", position: 7},
    },
    location: "1.7",
    across: false
  },
  meg: {
    definition: {
      english: "informal for megabyte",
      french: "megaoctet informel"
    },
    connections: {
      dam: {letter: "M", position: 3},
      res: {letter: "E", position: 2},
      gal: {letter: "G", position: 1},
    },
    location: "6.7",
    across: false
  },
  tin: {
    definition: {
      english: "can material",
      french: "métal pour canette"
    },
    connections: {
      satindoll: {letter: "T", position: 3},
      amine: {letter: "I", position: 3},
      waned: {letter: "N", position: 3},
    },
    location: "11.7",
    across: false
  },
  octet: {
    definition: {
      english: "group of eight",
      french: "groupe de huit"
    },
    connections: {
      halos: {letter: "O", position: 4},
      elect: {letter: "C", position: 4},
      satellite: {letter: "T", position: 8},
      ermine: {letter: "E", position: 1},
      tees: {letter: "T", position: 1},
    },
    location: "1.8",
    across: false
  },
  saltine: {
    definition: {
      english: "cracker type",
      french: "sorte de buiscuit salé"
    },
    connections: {
      res: {letter: "S", position: 3},
      gal: {letter: "A", position: 2},
      leader: {letter: "L", position: 1},
      tad: {letter: "T", position: 1},
      satindoll: {letter: "I", position: 4},
      amine: {letter: "N", position: 4},
      waned: {letter: "E", position: 4},
    },
    location: "7.8",
    across: false
  },
  steres: {
    definition: {
      english: "cordwood measures",
      french: "unités de mesure du bois"
    },
    connections: {
      halos: {letter: "S", position: 5},
      elect: {letter: "T", position: 5},
      satellite: {letter: "E", position: 9},
      ermine: {letter: "R", position: 2},
      tees: {letter: "E", position: 2},
      safes: {letter: "S", position: 1},
    },
    location: "1.9",
    across: false
  },
  leaned: {
    definition: {
      english: "tilted",
      french: "incliné"
    },
    connections: {
      gal: {letter: "L", position: 3},
      leader: {letter: "E", position: 2},
      tad: {letter: "A", position: 2},
      satindoll: {letter: "N", position: 5},
      amine: {letter: "E", position: 5},
      waned: {letter: "D", position: 5},
    },
    location: "8.9",
    across: false
  },
  mead: {
    definition: {
      english: "an alcoholic drink made from honey",
      french: "boisson alcoolisé à base de miel"
    },
    connections: {
      ermine: {letter: "M", position: 3},
      tees: {letter: "E", position: 3},
      safes: {letter: "A", position: 2},
      dire: {letter: "D", position: 1},
    },
    location: "4.10",
    across: false
  },
  add: {
    definition: {
      english: "find the sum",
      french: "trouver la somme"
    },
    connections: {
      leader: {letter: "A", position: 3},
      tad: {letter: "D", position: 3},
      satindoll: {letter: "D", position: 6}
    },
    location: "9.10",
    across: false
  },
  satisfied: {
    definition: {
      english: "content",
      french: "content"
    },
    connections: {
      sum: {letter: "S", position: 1},
      ape: {letter: "A", position: 1},
      tot: {letter: "T", position: 1},
      ermine: {letter: "I", position: 4},
      tees: {letter: "S", position: 4},
      safes: {letter: "F", position: 3},
      dire: {letter: "I", position: 2},
      ene: {letter: "E", position: 1},
      leader: {letter: "D", position: 4},
    },
    location: "1.11",
    across: false
  },
  owe: {
    definition: {
      english: "have bills",
      french: "doit payer des factures"
    },
    connections: {
      satindoll: {letter: "O", position: 7},
      woe: {letter: "W", position: 1},
      ewe: {letter: "E", position: 1},
    },
    location: "11.11",
    across: false
  },
  upon: {
    definition: {
      english: "on",
      french: "sur"
    },
    connections: {
      sum: {letter: "U", position: 2},
      ape: {letter: "P", position: 2},
      tot: {letter: "O", position: 2},
      ermine: {letter: "N", position: 5},
    },
    location: "1.12",
    across: false
  },
  erne: {
    definition: {
      english: "sea eagle",
      french: "aigle de mer"
    },
    connections: {
      safes: {letter: "E", position: 4},
      dire: {letter: "R", position: 3},
      ene: {letter: "N", position: 2},
      leader: {letter: "E", position: 5},
    },
    location: "6.12",
    across: false
  },
  low: {
    definition: {
      english: "depressed",
      french: "déprimé"
    },
    connections: {
      satindoll: {letter: "L", position: 8},
      woe: {letter: "O", position: 2},
      ewe: {letter: "W", position: 2},
    },
    location: "11.12",
    across: false
  },
  mete: {
    definition: {
      english: "apportion (out)",
      french: "avec 'out', signifie 'imputer' "
    },
    connections: {
      sum: {letter: "M", position: 3},
      ape: {letter: "E", position: 3},
      tot: {letter: "T", position: 3},
      ermine: {letter: "E", position: 6},
    },
    location: "1.13",
    across: false
  },
  seer: {
    definition: {
      english: "prognosticator",
      french: "devin"
    },
    connections: {
      safes: {letter: "S", position: 5},
      dire: {letter: "E", position: 4},
      ene: {letter: "E", position: 3},
      leader: {letter: "R", position: 6},
    },
    location: "6.13",
    across: false
  },
  lee: {
    definition: {
      english: "shelter wire",
      french: "côté à l'abri du vent"
    },
    connections: {
      satindoll: {letter: "L", position: 9},
      woe: {letter: "E", position: 3},
      ewe: {letter: "E", position: 3},
    },
    location: "11.13",
    across: false
  },
}
/* puzzle adapted from CROISÉS Niveau 4/5, Nº122, page 3 (2025). Sport Cérébral. */
const words2Fr: puzzle = {
  barrique: {
    definition: {
      english: "it's filled with wine",
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
      english: "used to express a purpose",
      french: "peut accompagner un dessein"
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
      english: "we want to get rid of the dark one",
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
      english: "doesn't miss anything",
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
      english: "tahitian port",
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
      english: "ridiculous old man",
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
      english: "a law against the law",
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
      english: "a lofty one in Spain",
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
      english: "if it's big, it's the jackpot",
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
      english: "atmospheric disturbances",
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
      english: "on the stave",
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
      english: "old coin",
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
      english: "to interweave three strips in a pattern",
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
      english: "looks mutinous",
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
      english: "ruler of the winds",
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
      english: "small island",
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
      english: "they are admired, especially by young people",
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
      english: "Bruce, movie star ",
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
      english: "abrasive powder",
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
      english: "raised",
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
      english: "affected by mood disorders",
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
      english: "he sings 'la nuit'",
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
      english: "has conquered western palates",
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
      english: "previewed",
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
      english: "to sound like a roe deer",
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
      english: "treated animal skin",
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
      english: "dizzy",
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
      english: "OPEC member",
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
      english: "short gigabyte",
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
      english: "worn out",
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
      english: "more monkey than spider",
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
      english: "in the paradigm of 'to be'",
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
      english: "to approve",
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
      english: "ablaze",
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
      english: "allows to dream",
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
      english: "transmits",
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
      english: "lacks courage",
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
      english: "often touches bottom",
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
      english: "formed from a plastic substance",
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
      english: "come to term",
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
      english: "edges of the forest",
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
  2: {english: words2En, french: words2Fr},
}