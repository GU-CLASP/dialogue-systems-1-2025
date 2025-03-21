import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure.ts";
import { DMContext, DMEvents, clue, puzzle } from "./types.ts";
import { puzzles } from "./puzzles.ts";
import { detectedLanguage, getLanguage, detectedLevel, getLevel, getLevelAsNumber,
          detectedYes, detectedNo, initPuzzle, selectWord, StillConnectedWordsToDiscover,
          selectConnectedWord, anyClues, getClues, sayClues, getDefinition, updateDiscovered,
          displayWord, highlightWord, clearHighlighting, repeatAnswer, IsCorrectAnswer, getHelp } from "./functions.ts";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://nlult2216.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: NLU_KEY,
  deploymentName: "crosswords",
  projectName: "crosswords",
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisMultilingualNeural",
};

console.log(IsCorrectAnswer('toi ?', 'toit', 'french'))
console.log(IsCorrectAnswer('mentir\xA0?', 'mentir', 'french'))
console.log(IsCorrectAnswer('en fumée', 'enfumer', 'french'))

export const discovered: { [word: string]: boolean } = {}

const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
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
            voice: "fr-FR-HenriNeural",
            locale: "fr-FR"
          },
      }),
    "spst.listen.en": ({ context }) =>
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
         value: { nlu: true },
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
    clues: [],
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
                Both puzzles'solutions and definitions are available in English and French.
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
                      "Got it." : "Definitions are available only in English or French" :
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
          always: { target: "Play" }, /* TO BE REDIRECTED TO INSTRUCTIONS */
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
              In case you can't find an answer, just say 'help' and I will give you some hint.
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
                  anyClues(context.words!, context.wordToFind!) || context.clues!.length != 0 ? `and with ${sayClues(context.clues!)}:`: ":"}` }) },
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
              after: { 5000:
                [
                { target: "ListenAnswerEn",
                  guard: ({ context }) => context.languageSol! == "english" },
                { target: "ListenAnswerFr"}
                ]
              }
            },
            ListenAnswerEn:{
              id: "ListenAnswerEn",
              entry: { type: "spst.listen.en" },
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
            ListenAnswerFr:{
              id: "ListenAnswerFr",
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
                      target: "LogVariables",
                      guard: ({ context }) => !!context.givenAnswer,
                    },
                    { target: "#DM.NoInput" },
                ],
              },
            },
            LogVariables :{
              entry: ({ context }) => (console.log('givenAnswer:', context.givenAnswer!, ',', 'wordTofind:', context.wordToFind!,',', 'languageSol:', context.languageSol!), 
              console.log('IsCorrectAnswer:', IsCorrectAnswer(context.givenAnswer!, context.wordToFind!, context.languageSol!))),
              always: 'CheckAnswer'
            },
            CheckAnswer: {
              id: "CheckAnswer",
              entry: {
                 type: "spst.speak",
                params: ({ context }) => ( { utterance: `You just said: ${repeatAnswer(context.givenAnswer!, context.languageSol!)} ${
                  IsCorrectAnswer(context.givenAnswer!, context.wordToFind!, context.languageSol!) || context.givenAnswer == 'help'?
                  context.givenAnswer == 'help' ? "." : ", and that's correct" : ", and that's not correct"}`})
                },
              on: { SPEAK_COMPLETE:
                [ 
                  { actions: assign(({ context }) => { return { help: getHelp(context.wordToFind!, context.words!, context.clues!) }}),
                    target: "GiveHelp",
                    guard: ({ context }) => context.givenAnswer! == 'help' && context.clues!.length < context.wordToFind!.length,
                  },
                  { target: "RefuseHelp",
                    guard: ({ context }) => context.givenAnswer! == 'help' && context.clues!.length == context.wordToFind!.length,
                  },
                  { target: "UpdateDiscovered",
                    guard: ({ context }) => (IsCorrectAnswer(context.givenAnswer!, context.wordToFind!, context.languageSol!)),
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
            RefuseHelp: {
              entry: {
                type: "spst.speak",
                params:  { utterance: `I already gave you all the clues! Let's recap'` }
                },
                on: { SPEAK_COMPLETE: "GiveLengthClues" },
            },
            GiveHelp: {
             entry: {
              type: "spst.speak",
              params: ({ context }) => ( { utterance: `I'm happy to help you. Here is some additional clue: ${
                sayClues([context.help!])}. You have now 5 more seconds to think.`})
              },
              on: { SPEAK_COMPLETE: 
                {actions: ({ context }) => context.clues!.push(context.help!) ,
                target: "LetThink" },}
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
                { actions: ({ context }) => (clearHighlighting(context.words!, context.wordToFind!), context.clues = []),
                  target: "SelectWord",
                  guard: ({ context }) => (context.yn! == "no"),
                },
                { target: "AskTryAgain" },
              ],},
            },    
            UpdateDiscovered: {
              id: "UpdateDiscovered",
              entry: ({ context }) => (updateDiscovered(context.wordToFind!), context.clues = [],
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
            ProposeNextLevel: {

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