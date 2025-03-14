import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure.ts";
import { DMContext, DMEvents } from "./types.ts";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const settings: Settings = {
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisMultilingualNeural",
  /* speechRecognitionEndpointId: "9fb1d792-feb6-47ef-aac9-ec2e46998109" */
};

interface clue {letter: string, position: number}
interface connection { [word: string]: clue }
interface definition { [language: string]: string }

const words: { [word: string]: {definition: definition, connections: connection }} = {
  finger: {
    definition: {
      english: "Part of your hand",
      french: "Une partie de ta main"
    },
    connections: {
      luggage: {letter: "G", position: 3}
    }
  },
  watch: {
    definition: {
      english: "Worn on your wrist that tells time",
      french: "À ton poignet, elle donne l'heure"
    },
    connections: {
      hour: {letter: "H", position: 1},
      luggage: {letter: "A", position: 5},
    }
  },
  laptop: {
    definition: {
      english: "Portable computer",
      french: "Ordinateur portable"
    },
    connections: {
      luggage: {letter: "L", position: 1}
    }
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
    }
  },
  hour: {
    definition: {
      english: "A period of 60 minutes",
      french: "Une durée de 60 minutes"},
    connections: {
      watch: {letter: "H", position: 5}
    }
  },
}

const discovered: { [word: string]: boolean } = {}

function selectWord(wordToFind: string|null) {
  let filteredWords = Object.keys(words).filter((word)=> !discovered[word])
  if (Object.keys(discovered).length < Object.keys(words).length -1) {
    filteredWords = filteredWords.filter((word)=> !(word==wordToFind))
  }
  const i = Math.floor(Math.random()*filteredWords.length);
  return filteredWords[i];
}

function StillConnectedWordsToDiscover(word:string) {
  const connectedWords = Object.keys(words[word].connections)
  const ConnectedWordsToDiscover = connectedWords.filter((word)=> !discovered[word])
  return !!ConnectedWordsToDiscover.length
}

function selectConnectedWord(word: string) {
  const connectedWords = Object.keys(words[word].connections)
  const filteredConnectedWords = connectedWords.filter((word)=> !discovered[word])
  const i = Math.floor(Math.random()*filteredConnectedWords.length);
  return filteredConnectedWords[i]
}

function anyClues(word: string) {
  const connectedWords = Object.keys(words[word].connections)
  const discoveredConnectedWords = connectedWords.filter((word)=> discovered[word])
  return !!discoveredConnectedWords.length
}


function getClues(word:string) {
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

function getDefinition(word: string, language: string) {
  let utterance : string = words[word].definition[language]
  if (language == 'french'){
    utterance = '<lang xml:lang="fr-FR">' + utterance + '</lang>'
  }
  return utterance
}

function updateDiscovered(word: string) {
  discovered[word] = true
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
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
      }),
    
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    language: null,
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
          initial: "AskSettings",
          on: { SPEAK_COMPLETE:
            [ 
              { target: "Instructions",
                guard: ({ context }) => (context.language! == "english" || context.language! == "french"),
              },
              { target: ".AskSettings" },
            ],
          },
          states: {
            AskSettings: {
              entry: { type: "spst.speak", params: { utterance: `Why not combine fun and learning?
                Puzzles are invariably in English, but you can choose to have definitions either in English or in French.
                Which language do you want to select for definitions?` } },
              on: { SPEAK_COMPLETE: "ListenSettings" },
            },
            ListenSettings: {
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: { 
                  actions: assign(({ event }) => { 
                    return { language: event.value[0].utterance.toLowerCase() }; 
                  }),
                },
                ASR_NOINPUT: { 
                  actions: assign({ language: null })
                },
                LISTEN_COMPLETE: [ 
                  {
                    target: "CheckSettings",
                    guard: ({ context }) => !!context.language,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
            },
            CheckSettings: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: `You just said: ${context.language}, ${
                      context.language! == "english" || context.language! == "french" ?
                      "OK, well noted" :"Please, reply 'English' or 'French'"}`})
              },
            },
          }
        },
        Instructions: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ( { utterance: `Before to start, please listen carefully the following instructions.
              After selecting a word randomly, I will give you the length of the word along with previously found letters if any.
              The definition will be given in ${context.language}, and you will have 5 seconds of thinking before giving your answer in English.
              If your answer is correct, we go on with a word connected to the previous one. Otherwise you can either try again or continue with another word.
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
                return { wordToFind: selectConnectedWord(context.wordToFind!) }}),
                always: [
                  { target: "GetClues",
                    guard: ({ context }) => anyClues(context.wordToFind!) 
                  },
                  { target: "GiveDefinition" },
                ],
            },
            SelectWord: {
              id: "SelectWord",
              entry: assign(({ context }) => { 
                return { wordToFind: selectWord(context.wordToFind!) }}),
              always: [
                { target: "GetClues",
                  guard: ({ context }) => anyClues(context.wordToFind!) 
                },
                { target: "GiveDefinition" },
              ],
            },
            GetClues: {
              id: "GetClues",
              entry: assign(({ context }) => { 
                return { clues: getClues(context.wordToFind!) }}),
              always: { target: "GiveDefinition" },
            },
            GiveDefinition:{
              id: "GiveDefinition",
              entry: { type: "spst.speak",
                params: ({ context }) => ( { utterance: `In ${context.wordToFind!.length} letters ${
                  anyClues(context.wordToFind!)? `and with ${sayClues(context.clues!)}:`: ":"} ${
                    getDefinition(context.wordToFind!, context.language!)}` }) },
              on: { SPEAK_COMPLETE: "LetThink" },
            },
            LetThink:{
              after: { 5000: { target: "ListenAnswer" }}
            },
            ListenAnswer:{
              id: "ListenAnswer",
              entry: { type: "spst.listen" },
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
                    guard: ({ context }) => Object.keys(discovered).length == Object.keys(words).length -1
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
              on: { SPEAK_COMPLETE: "GiveDefinition"},
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
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: { 
                  actions: assign(({ event }) => { 
                    return { lastResult: event.value[0].utterance.toLowerCase() }; 
                  }),
                },
                ASR_NOINPUT: { 
                  actions: assign({ lastResult: null })
                },
                LISTEN_COMPLETE: [ 
                  {
                    target: "CheckTryAgain",
                    guard: ({ context }) => !!context.lastResult,
                  },
                  { target: "#DM.NoInput" },
                ],
              },
            },
            CheckTryAgain: {
              id: "CheckTryAgain",
              entry: {
                type: "spst.speak",
                params: ({ context }) => ( { utterance: `You just said: ${context.lastResult!}, ${
                  context.lastResult! == "yes" || context.lastResult! == "no" ? context.lastResult! == "yes" ?
                  "OK, let me repeat": "OK, let's move on to the next word then": "Please, reply yes or no"}`})
                },
              on: { SPEAK_COMPLETE: [ 
                { target: "GiveDefinition",
                  guard: ({ context }) => (context.lastResult! == "yes"),
                },
                { target: "SelectWord",
                  guard: ({ context }) => (context.lastResult! == "no"),
                },
                { target: "AskTryAgain" },
              ],},
            },    
            UpdateDiscovered: {
              id: "UpdateDiscovered",
              entry: ({ context }) => updateDiscovered(context.wordToFind!),
              always: [
                { target: "Done",
                  guard: ({ context }) => (Object.keys(discovered).length == Object.keys(words).length)
                },
                {
                  target: "SelectConnectedWord",
                  guard: ({ context }) => StillConnectedWordsToDiscover(context.wordToFind!),
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

export function initPuzzle(element: HTMLElement){
    element.innerHTML = "<p>blabla</p>"
}
