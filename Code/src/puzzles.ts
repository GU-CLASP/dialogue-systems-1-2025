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

export const puzzles: {[index: number] : {[language: string] : puzzle}} = {
  0: {english: words0En, french: words0Fr},
  1: {english: words1En, french: words1Fr},
}