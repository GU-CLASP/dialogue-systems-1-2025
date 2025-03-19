import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.ts";
import { DMContext, DMEvents, clue, puzzle } from "./types.ts";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://nlult2216.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "crosswords" /** your Azure CLU deployment */,
  projectName: "crosswords" /** your Azure CLU project name */,
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisMultilingualNeural",
  /* speechRecognitionEndpointId: "9fb1d792-feb6-47ef-aac9-ec2e46998109" */
};

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
      french: "la partie d'une plante qui est colorée et qui sent bon"
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
      printemps: {letter: "P", position: 8}
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

const puzzles: {[index: number] : {[language: string] : puzzle}} = {
  0: {english: words0En, french: words0Fr},
  1: {english: words1En, french: words0Fr},
}
const discovered: { [word: string]: boolean } = {}


function detectedLanguage(entities: any) {
  return !!entities.find( x => x.category === "language")
}

function getLanguage(entities: any) {
  let obj_lang = entities.find( x => x.category === "language")
  let index_lang = entities.indexOf(obj_lang)
  return entities[index_lang].text.toLowerCase()
}

function detectedLevel(entities: any) {
  return !!entities.find( x => x.category === "level")
}

function getLevel(entities: any) {
  let obj_level = entities.find( x => x.category === "level")
  let index_level = entities.indexOf(obj_level)
  return entities[index_level].text.toLowerCase()
}

/* function below needed because can't find a way to access the entity list key from CLU */
function getLevelAsNumber(level: string) {
  let levelAsNumber = undefined
  if (level == "0" || level == "zero" || level == "0th" || level == "zeroth" || level == "training" || level == "train") {
    levelAsNumber = 0
  }
  else if (level == "1" || level == "one" || level == "1st" || level == "first" || level == "beginner" || level == "beginners") {
    levelAsNumber = 1
  }
  else if (level == "2" || level == "two" || level == "2nd" || level == "second" || level == "advanced") {
    levelAsNumber = 0
  }
  return levelAsNumber
  }

function detectedYes(entities: any) {
 return !!entities.find( x => x.category === "yes")
}

function detectedNo(entities: any) {
  return !!entities.find( x => x.category === "no")
}

function initPuzzle(element: HTMLElement, words: puzzle){
  let lastColumns : number[] = []
  let lastRows : number[] = []
  let whites: string[] = []
  for (let word of Object.keys(words)) {
    if (words[word].across == true) {
      let row: number = Number(words[word].location.split(".")[0])
      let firstColumn: number = Number(words[word].location.split(".")[1])
      let lastColumn: number = firstColumn + word.length
      lastColumns.push(lastColumn)
      for (let step = 0; step < word.length; step++) {
        let tileColumn: number = firstColumn + step
        let tileId: string = row + "." + tileColumn.toString()
        whites.push(tileId)
      }
    }
    else {
      let column: number = Number(words[word].location.split(".")[1])
      let firstRow: number = Number(words[word].location.split(".")[0])
      let lastRow: number = firstRow + word.length
      lastRows.push(lastRow)
      for (let step = 0; step < word.length; step++) {
        let tileRow: number = firstRow + step
        let tileId: string = tileRow.toString() + "." + column
        whites.push(tileId)
      }
    }
  }
  let numberColumns: number = Math.max(...lastColumns)
  let numberRows: number = Math.max(...lastRows)
  let stringHTML: string = `<div id="crossword"><table><tbody>`
  for (let row = 1; row < numberRows; row++) {
    stringHTML += `<tr>`
    for (let column = 1; column < numberColumns; column++) {
      if (whites.includes(`${row}.${column}`)) {
        stringHTML += `<td id="${row}.${column}" class="white"></td>`
      }
      else {
        stringHTML += `<td class="dark"></td>`
      }
    }
    stringHTML += `</tr>`
  }
  stringHTML += `</tbody></table></div>`
  element.innerHTML = stringHTML
}


function selectWord(words: puzzle, wordToFind: string|null) {
  let filteredWords = Object.keys(words!).filter((word)=> !discovered[word])
  if (Object.keys(discovered).length < Object.keys(words!).length -1) {
    filteredWords = filteredWords.filter((word)=> !(word==wordToFind))
  }
  const i = Math.floor(Math.random()*filteredWords.length);
  return filteredWords[i];
}

function StillConnectedWordsToDiscover(words: puzzle, word:string) {
  const connectedWords = Object.keys(words[word].connections)
  const ConnectedWordsToDiscover = connectedWords.filter((word)=> !discovered[word])
  return !!ConnectedWordsToDiscover.length
}

function selectConnectedWord(words: puzzle, word: string) {
  const connectedWords = Object.keys(words[word].connections)
  const filteredConnectedWords = connectedWords.filter((word)=> !discovered[word])
  const i = Math.floor(Math.random()*filteredConnectedWords.length);
  return filteredConnectedWords[i]
}

function anyClues(words: puzzle, word: string) {
  const connectedWords = Object.keys(words[word].connections)
  const discoveredConnectedWords = connectedWords.filter((word)=> discovered[word])
  return !!discoveredConnectedWords.length
}

function getClues(words: puzzle, word:string) {
  const connectedWords = Object.keys(words[word].connections)
  const discoveredConnectedWords = connectedWords.filter((word) => discovered[word])
  const clues : clue[] = []
  for (let connectedWord of discoveredConnectedWords) {
    let thisclue: clue = {letter: words[connectedWord].connections[word].letter, position: words[connectedWord].connections[word].position}
    clues.push(thisclue)
  }
  return clues
}

function sayClues(clues: clue[]) {
  clues.sort((a, b) => a.position - b.position);
  let utterance : string = ""
  for (let clue of clues) {
    let thisutterance: string  = `letter "${clue.letter}" in position ${clue.position}, `
    utterance += thisutterance
  }
  return utterance
}

function getDefinition(words: puzzle, word: string, language: string) {
  let utterance : string = words[word].definition[language]
  if (language == 'french'){
    utterance = '<lang xml:lang="fr-FR">' + utterance + '</lang>'
  }
  return utterance
}

function updateDiscovered(word: string) {
  discovered[word] = true
}

function displayWord(words: puzzle, word:string) {
  let location: string = words[word].location
  let row: string = location.split(".")[0]
  let column: string = location.split(".")[1]
  let across: boolean = words[word].across
  let length : number = word.length
  if (across == true) {
    for (let step = 0; step < length; step++) {
      let tileColumn: number = Number(column) + step
      let tileId: string = row + "." + tileColumn.toString()
      let tile: HTMLElement = document.getElementById(tileId)!
      tile.textContent = word[step].toUpperCase()
    }
  }
  else {
    for (let step = 0; step < length; step++) {
      let tileRow: number = Number(row) + step
      let tileId: string = tileRow.toString() + "." + column
      let tile: HTMLElement = document.getElementById(tileId)!
      tile.textContent = word[step].toUpperCase()
    }
  }
}

function highlightWord(words: puzzle, word: string) {
  let location: string = words[word].location
  let row: string = location.split(".")[0]
  let column: string = location.split(".")[1]
  let across: boolean = words[word].across
  let length : number = word.length
  if (across == true) {
    for (let step = 0; step < length; step++) {
      let tileColumn: number = Number(column) + step
      let tileId: string = row + "." + tileColumn.toString()
      let tile: HTMLElement = document.getElementById(tileId)!
      tile.setAttribute("class", "yellow")
    }
  }
  else {
    for (let step = 0; step < length; step++) {
      let tileRow: number = Number(row) + step
      let tileId: string = tileRow.toString() + "." + column
      let tile: HTMLElement = document.getElementById(tileId)!
      tile.setAttribute("class", "yellow")
    }
  }
}

function clearHighlighting(words: puzzle, word: string | null) {
  if (word ==  null) {
  }
  else {
    let location: string = words[word!].location
    let row: string = location.split(".")[0]
    let column: string = location.split(".")[1]
    let across: boolean = words[word!].across
    let length : number = word!.length
    if (across == true) {
      for (let step = 0; step < length; step++) {
        let tileColumn: number = Number(column) + step
        let tileId: string = row + "." + tileColumn.toString()
        let tile: HTMLElement = document.getElementById(tileId)!
        tile.setAttribute("class", "white")
      }
    }
    else {
      for (let step = 0; step < length; step++) {
        let tileRow: number = Number(row) + step
        let tileId: string = tileRow.toString() + "." + column
        let tile: HTMLElement = document.getElementById(tileId)!
        tile.setAttribute("class", "white")
      }
    }
  }
}

const dmMachine = setup({
  types: {
    /** you might need to extend these */
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    /** define your actions here */
    "spst.speak": ({ context }, params: { utterance: string }) =>
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      }),
      "spst.speak.fr": ({ context }, params: { utterance: string }) =>
        context.spstRef.send({
          type: "SPEAK",
          value: {
            utterance: params.utterance,
            voice: "fr-FR-HenriNeural"
          },
      }),
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),
      "spst.listen.fr": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
        value: {
          locale: "fr-FR"
        }
      }),
    "spst.listen.nlu": ({ context }) =>
       context.spstRef.send({
         type: "LISTEN",
         value: { nlu: true } /** Local activation of NLU */,
       }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    languageDef: null,
    level: null,
    words: null,
    lastResult: null,
    wordToFind: null,
    givenAnswer: null,
    clues: null,
  }),
  id: "DM",
  initial: "Prepare",
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      on: { CLICK: "Greeting" },
    },
    Greeting: {
      id: "Greeting",
      entry: { type: "spst.speak", params: { utterance: `Hi! Welcome to the voiced crosswords!` } },
      on: { SPEAK_COMPLETE: "Main" },
    },
    NoInput: {
      entry: {
        type: "spst.speak",
        params: { utterance: `I can't hear you!` },
      },
      on: { SPEAK_COMPLETE: "Main.hist" },
    },
    Main:{
      id: "Main",
      initial: "Settings",
      states: {
        hist:{
          type: "history",
          history: "deep"
        },
        Settings: {
          id: "Settings",
          initial: "AskLanguageSol",
          states: {
            AskLanguageSol: {
              entry: { type: "spst.speak", params: { utterance: `Why not combine fun and learning?
                In puzzles, both solutions and definitions are available in English and French.
                You can choose any combinations of those two languages.
                Which language do you want to select for solutions?` } },
              on: { SPEAK_COMPLETE: "ListenLanguageSol" },
            },
            ListenLanguageSol: {
              entry: { type: "spst.listen.nlu" },
              on: {
                RECOGNISED: [
                  { 
                  actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, languageSol: getLanguage(event.nluValue.entities) }; 
                  }),
                  guard: (({ event }) => event.nluValue.topIntent == "set language" && detectedLanguage(event.nluValue.entities))
                  },
                  { 
                  actions: assign({ languageSol: "notDetected" })
                  },
                ],
                ASR_NOINPUT: { 
                  actions: assign({ languageSol: null })
                },
                LISTEN_COMPLETE: [ 
                  {
                    target: "CheckLanguageSol",
                    guard: ({ context }) => !!context.languageSol,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
            },
            CheckLanguageSol: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: ` ${
                      context.languageSol! == "english" || context.languageSol! == "french" || context.languageSol! != "notDetected"?
                      context.languageSol! == "english" || context.languageSol! == "french" ?
                      "OK, well noted" : "Solutions are available only in English or French" :
                      "Sorry, I didn't get the language. Do you want the solutions in English or French?"}`}),
              },
              on: { SPEAK_COMPLETE:
                [ 
                  { target: "AskLanguageDef",
                    guard: ({ context }) => (context.languageSol! == "english" || context.languageSol! == "french"),
                  },
                  { target: "ListenLanguageSol" },
                ],
              },
            },
            AskLanguageDef: {
              entry: { type: "spst.speak", params: { utterance: `Which language do you want to select for definitions?` } },
              on: { SPEAK_COMPLETE: "ListenLanguageDef" },
            },
            ListenLanguageDef: {
              entry: { type: "spst.listen.nlu" },
              on: {
                RECOGNISED: [
                  { 
                  actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, languageDef: getLanguage(event.nluValue.entities) }; 
                  }),
                  guard: (({ event }) => event.nluValue.topIntent == "set language" && detectedLanguage(event.nluValue.entities))
                  },
                  { 
                  actions: assign({ languageDef: "notDetected" })
                  },
                ],
                ASR_NOINPUT: { 
                  actions: assign({ languageDef: null })
                },
                LISTEN_COMPLETE: [ 
                  {
                    target: "CheckLanguageDef",
                    guard: ({ context }) => !!context.languageDef,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
            },
            CheckLanguageDef: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: ` ${
                      context.languageDef! == "english" || context.languageDef! == "french" || context.languageDef! != "notDetected"?
                      context.languageDef! == "english" || context.languageDef! == "french" ?
                      "OK, well noted" : "Definitions are available only in English or French" :
                      "Sorry, I didn't get the language. Do you want the definitions in English or French?"}`}),
              },
              on: { SPEAK_COMPLETE:
                [ 
                  { target: "AskLevel",
                    guard: ({ context }) => (context.languageDef! == "english" || context.languageDef! == "french"),
                  },
                  { target: "ListenLanguageDef" },
                ],
              },
            },
            AskLevel: {
              entry: { type: "spst.speak", params: { utterance: `There are 3 different levels of difficulty.
                Level 0 - to train and familiarize yourself with the game.
                Level 1 - for beginners. And Level 2 - for more advanced players.
                Which level do you want to play?` } },
              on: { SPEAK_COMPLETE: "ListenLevel" },
            },
            ListenLevel: {
              entry: { type: "spst.listen.nlu" },
              on: {
                RECOGNISED: [
                  { 
                  actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, level: getLevel(event.nluValue.entities) }; 
                  }),
                  guard: (({ event }) => event.nluValue.topIntent == "set level" && detectedLevel(event.nluValue.entities))
                  },
                  { 
                  actions: assign({ level: "notDetected" })
                  }
                ],
                ASR_NOINPUT: { 
                  actions: assign({ level: null })
                },
                LISTEN_COMPLETE: [ 
                  {
                    target: "CheckLevel",
                    guard: ({ context }) => !!context.level
                  },
                  { target: "#DM.NoInput" },
                ],
              },
            },
            CheckLevel: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: ` ${
                      getLevelAsNumber(context.level!) == 0 || getLevelAsNumber(context.level!) == 1 || getLevelAsNumber(context.level!) == 2 || context.level! != "notDetected"?
                      getLevelAsNumber(context.level!) == 0 || getLevelAsNumber(context.level!) == 1 || getLevelAsNumber(context.level!) == 2 ?
                      `You selected level ${getLevelAsNumber(context.level!)}.` : "Only levels 0, 1 and 2 are available" :
                      "Sorry, I didn't get the level. Do you want to play level 0, level 1 or level 2?"}`})
              },
              on: { SPEAK_COMPLETE:
                [ 
                  { actions: assign(({ context }) => { return { words: puzzles[getLevelAsNumber(context.level!)!][context.languageSol!] }}),
                    target: "#DM.Main.InitializePuzzle",
                    guard: ({ context }) => 
                      (getLevelAsNumber(context.level!) == 0 || getLevelAsNumber(context.level!) == 1 || getLevelAsNumber(context.level!) == 2),
                  },
                  { target: "ListenLevel" },
                ],
              },
            },
          }
        },
        InitializePuzzle: {
          entry: ({ context }) => initPuzzle(document.querySelector<HTMLDivElement>("#puzzle")!, context.words!),
          always: { target: "Instructions" },
        },
        Instructions: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ( { utterance: `Before we start, please listen carefully to the following instructions.
              Level ${getLevelAsNumber(context.level!)} puzzle in ${context.languageSol!} counts ${
                Object.keys(puzzles[getLevelAsNumber(context.level!)!][context.languageSol!]).length} words to find.
              After selecting a word randomly, I will give you the length of the word along with previously found letters if any.
              The definition will be given in ${context.languageDef}, and you will have 5 seconds of thinking before giving your answer in ${context.languageSol!}.
              If your answer is correct, we go on with the next word, connected to the previous one if any. Otherwise you can either try again or continue with another word.
              Now, let's play some crosswords!!`})
          },
          on: { SPEAK_COMPLETE: "Play" },
        },
        Play: {
          id: "Play",
          initial: "SelectWord",
          states: {
            SelectConnectedWord: {
              id: "SelectConnectedWord",
              entry: assign(({ context }) => { 
                return { wordToFind: selectConnectedWord(context.words!, context.wordToFind!) }}),
              always: { target: "HighlightWord" },
            },
            SelectWord: {
              id: "SelectWord",
              entry: assign(({ context }) => { 
                return { wordToFind: selectWord(context.words!, context.wordToFind!) }}),
              always: { target: "HighlightWord" },
            },
            HighlightWord: {
              entry: ({ context }) => highlightWord(context.words!, context.wordToFind!),
              always: [
                { target: "GetClues",
                  guard: ({ context }) => anyClues(context.words!, context.wordToFind!) 
                },
                { target: "GiveLengthClues" },
              ],
            },
            GetClues: {
              id: "GetClues",
              entry: assign(({ context }) => { 
                return { clues: getClues(context.words!, context.wordToFind!) }}),
              always: { target: "GiveLengthClues" },
            },
            GiveLengthClues:{
              id: "GiveLengthClues",
              entry: { type: "spst.speak",
                params: ({ context }) => ( { utterance: `In ${context.wordToFind!.length} letters ${
                  anyClues(context.words!, context.wordToFind!)? `and with ${sayClues(context.clues!)}:`: ":"}` }) },
              on: { SPEAK_COMPLETE: [ 
                {
                  target: "GiveDefinitionEn",
                  guard: ({ context }) => context.languageDef == "english"
                },
                { target: "GiveDefinitionFr" },
            ], },
            },
            GiveDefinitionEn:{
              id: "GiveDefinitionEn",
              entry: { type: "spst.speak",
                params: ({ context }) => ( { utterance: `${getDefinition(context.words!, context.wordToFind!, context.languageDef!)}` }) },
              on: { SPEAK_COMPLETE: "LetThink" },
            },
            GiveDefinitionFr:{
              id: "GiveDefinitionFr",
              entry: { type: "spst.speak",
                params: ({ context }) => ( { utterance: ` ${ getDefinition(context.words!, context.wordToFind!, context.languageDef!)}` }) },
              on: { SPEAK_COMPLETE: "LetThink" },
            },
            LetThink:{
              after: { 5000: { target: "ListenAnswer" }}
            },
            ListenAnswer:{
              id: "ListenAnswer",
              entry: { type: "spst.listen.fr" },
              on: {
                RECOGNISED: { 
                  actions: assign(({ event }) => { 
                    return { givenAnswer: event.value[0].utterance.toLowerCase() }; 
                  }),
                },
                ASR_NOINPUT: { 
                  actions: assign({ givenAnswer: null })
                },
                LISTEN_COMPLETE: [ 
                    {
                      target: "CheckAnswer",
                      guard: ({ context }) => !!context.givenAnswer,
                    },
                    { target: "#DM.NoInput" },
                ],
              },
            },
            CheckAnswer: {
              id: "CheckAnswer",
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: `You just said: ${context.givenAnswer}, and ${
                  context.givenAnswer! == context.wordToFind ? "that's": "that's not"} correct`})
                },
              on: { SPEAK_COMPLETE:
                [ 
                  { target: "UpdateDiscovered",
                    guard: ({ context }) => (context.givenAnswer! == context.wordToFind),
                  },
                  { target: "Encourage",
                    guard: ({ context }) => Object.keys(discovered).length == Object.keys(context.words!).length -1
                  },
                  {
                    target: "AskTryAgain"
                  }
                ],
              },
            },
            Encourage:{
              entry: { type: "spst.speak",
                params: { utterance: `Keep trying, you're almost there! That's the last word to find!` } },
              on: { SPEAK_COMPLETE: "GiveLengthClues"},
            },
            AskTryAgain:{
              id: "AskTryAgain",
              entry: {
                type: "spst.speak",
                params: { utterance: "Do you want to try again and propose another answer?"},
              },
              on: { SPEAK_COMPLETE: "ListenTryAgain"},
            },
            ListenTryAgain:{
              id: "ListenTryAgain",
              entry: { type: "spst.listen.nlu" },
              on: {
                RECOGNISED: [
                  { 
                  actions: assign(({ event }) => { 
                    return { lastResult: event.nluValue, yn: "yes" }; 
                  }),
                  guard: (({ event }) => detectedYes(event.nluValue.entities) && !detectedNo(event.nluValue.entities))
                  },
                  { 
                    actions: assign(({ event }) => { 
                      return { lastResult: event.nluValue, yn: "no" }; 
                    }),
                    guard: (({ event }) => detectedNo(event.nluValue.entities) && !detectedYes(event.nluValue.entities))
                    },
                  { 
                  actions: assign({ yn: "notDetected" })
                  }
                ],
                ASR_NOINPUT: { 
                  actions: assign({ yn: null })
                },
                LISTEN_COMPLETE: [  
                  {
                    target: "CheckTryAgain",
                    guard: ({ context }) => !!context.yn,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
            },
            CheckTryAgain: {
              id: "CheckTryAgain",
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: ` ${
                  context.yn! == "yes" || context.yn! == "no" ? context.yn! == "yes" ?
                  "OK, let me repeat": "OK, let's move on to the next word then": "Please, reply yes or no"}`})
                },
              on: { SPEAK_COMPLETE: [ 
                { target: "GiveLengthClues",
                  guard: ({ context }) => (context.yn! == "yes"),
                },
                { actions: ({ context }) => clearHighlighting(context.words!, context.wordToFind!),
                  target: "SelectWord",
                  guard: ({ context }) => (context.yn! == "no"),
                },
                { target: "AskTryAgain" },
              ],},
            },    
            UpdateDiscovered: {
              id: "UpdateDiscovered",
              entry: ({ context }) => (updateDiscovered(context.wordToFind!),
              displayWord(context.words!, context.wordToFind!), clearHighlighting(context.words!, context.wordToFind!)),
              always: [
                { target: "Done",
                  guard: ({ context }) => (Object.keys(discovered).length == Object.keys(context.words!).length)
                },
                {
                  target: "SelectConnectedWord",
                  guard: ({ context }) => StillConnectedWordsToDiscover(context.words!, context.wordToFind!),
                },
                { target: "SelectWord" },
              ]
            },
            Done: {
              entry: {type: "spst.speak",
              params: {utterance: `Well done! You just completed the crossword puzzle!`}
              },
              on: {
                CLICK: "#DM.Greeting",
              },
            },
          }
        },
      },
    }
  }
})

const dmActor = createActor(dmMachine, {
  inspect: inspector.inspect,
}).start();

dmActor.subscribe((state) => {
  console.group("State update");
  console.log("State value:", state.value);
  console.log("State context:", state.context);
  console.groupEnd();
});

export function setupButton(element: HTMLButtonElement) {
  element.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  });
  dmActor.subscribe((snapshot) => {
    const meta: { view?: string } = Object.values(
      snapshot.context.spstRef.getSnapshot().getMeta(),
    )[0] || {
      view: undefined,
    };
    element.innerHTML = `${meta.view}`;
  });
}