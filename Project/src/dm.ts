import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY, NLU_KEY } from "./azure";
import { DMContext, DMEvents, room, Intent, Entity, NLUObject } from "./types";
import { getEntity, randomize, randomizeAttributes } from "./utils";
import { imageSources, catColors, catEyeColors, catAccessories, personNames, voiceNames, greetings, intentAskings, catAskings, confirmations, goodByes, roomNamesAndPrepositions} from "./data"
import { randomizeRooms, generatePath, putPersons } from "./world_generation";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://erkoo.cognitiveservices.azure.com/sts/v1.0/issuetoken", // insert your own endpoint
  key: KEY, // insert your own key is azure.ts
};

const azureLanguageCredentials = {
  endpoint: "https://erkk.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview" /** your Azure CLU prediction URL */,
  key: NLU_KEY /** reference to your Azure CLU key */,
  deploymentName: "cat-nlu" /** your Azure CLU deployment */,
  projectName: "find-the-cat" /** your Azure CLU project name */,
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-AvaNeural",
};
     
const rooms = randomizeRooms(roomNamesAndPrepositions);
const catPath = generatePath(rooms, 10);
putPersons(rooms, personNames, 4)
     
const attributes = randomizeAttributes(catColors, catEyeColors, catAccessories);
     
const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    /** define your actions here */
    "spst.speak": ({ context }, params: { utterance: string, voice?: string }) =>
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
          voice: params.voice,
        },
      }),
    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
        value: { nlu: true},
      }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    interpretation: null,
    dir: null, // where the player wants to go (direction)
    place: null, // where the player wants to go (place)
    catColor: null,
    catEyeColor: null,
    catAccessory: null,
    currentRoom: null, 
    greeting: randomize(greetings),
    intentAsking: randomize(intentAskings),
    catAsking: randomize(catAskings),
    confirmation: randomize(confirmations),
    goodBye: randomize(goodByes),
    noAnswerCount: 0,
    visitedRooms: new Set<number>(),
    imageSource: null,
    menu: true,
  }),
  id: "DM",
  initial: "Prepare",

  on: {
    RECOGNISED: {
      actions: assign(({ event }) => {
        return { lastResult: event.value ,
                 interpretation: event.nluValue,
        };
      }),
    },
    ASR_NOINPUT: {
      actions: assign({ lastResult: null, interpretation: null }),
    },
  },
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },

    WaitToStart: {
      on: { CLICK: {target: "Greeting",
        }}
    },
    
    Greeting: {
      entry: { type: "spst.speak", params: { utterance: `Hello. To start the game, say 'start'. If you want to get instructions about how to play the game, say 'instructions'.` } },
      on: {SPEAK_COMPLETE: "ListenToStart"}
    },

    ListenToStart: {
      entry: {type: "spst.listen"},
      on: {LISTEN_COMPLETE:
        [{target: "Game",
          actions: assign({menu: false, catColor: attributes.color,
          catEyeColor: attributes.eyeColor,
          catAccessory: attributes.accessory,
          currentRoom: rooms[0],
          imageSource : imageSources[rooms[0].name].source}),
          guard: ({ context }) => !!context.lastResult && context.lastResult![0].utterance.toLowerCase() == 'start'
        },
        {
          target: "Instructions",
          guard: ({ context }) => !!context.lastResult && context.lastResult![0].utterance.toLowerCase() == 'instructions'
        },
        {
          target: "WaitToStart"
        }
        ]
      }
    },

    Instructions: {
      entry: {type:"spst.speak", params: {utterance: "This is a game in which you need to find your cat which is lost. You interact with the game narrator (me) using your voice. At the start of the game you will hear a description of what your cat looks like. Remember this information! During the game, you can tell me in which direction you want to go, or that you want to talk to a person you see. You can also ask me to repeat information about the current place you are in. Do you want me to repeat the instructions?"}},
      on: {SPEAK_COMPLETE: "RepeatInstructionsOrStart"}
    },

    RepeatInstructionsOrStart: {
      entry: {type:"spst.listen"},
      on: {LISTEN_COMPLETE: [
        {
          target: "Instructions",
          guard: ({ context }) => !!context.lastResult && context.lastResult![0].utterance.toLowerCase() == "yes"
        },
        {
          target: "Game",
          guard: ({ context }) => !!context.lastResult && context.lastResult![0].utterance.toLowerCase() == "no"
        },
        {
          target: "WaitToStart",
        }
      ]}
    },

    Game : {
      initial: "GameIntroduction",
      states: {
        GameIntroduction : {
          entry: {type: "spst.speak", params: ({context}) => ({utterance: `You are looking for your cat which has gone missing. It is ${context.catColor}, has ${context.catEyeColor} eyes and wears a ${context.catAccessory}.`})},
          on : { SPEAK_COMPLETE : {target: "Navigation",actions: assign(({context})=>({imageSource : imageSources[context.currentRoom!.name].source}))}}
        },
        Navigation: {
          initial: "RoomDescription",
          states: {
            RoomDescription : {
              entry: {type: "spst.speak", params:  ({context}) => ({utterance: context.currentRoom!.catDirection == "here" ? `You found the cat!` : `You are now ${context.currentRoom!.preposition} ${context.currentRoom!.name}.`})},
              
              on: {SPEAK_COMPLETE: 
                [
                  {
                    target: "AskForCommand",
                    guard: ({ context }) => context.visitedRooms.has(context.currentRoom!.idx)
                  },
                  {target: "#DM.Game.Won",
                    guard: ({ context }) => context.currentRoom!.catDirection == "here"
                  },
                  
                  {target: "DirectionDescription"}
                ]
              }
            },
            DirectionDescription: {
              entry: {type: "spst.speak", params: ({context}) => ({utterance: (context.currentRoom!.n != -1 ? `To the north is ${rooms[context.currentRoom!.n].name}. ` : ``)+(context.currentRoom!.s != -1 ? `To the south is ${rooms[context.currentRoom!.s].name}. ` : ``)+(context.currentRoom!.w != -1 ? `To the west is ${rooms[context.currentRoom!.w].name}. ` : ``)+(context.currentRoom!.e != -1 ? `To the east is ${rooms[context.currentRoom!.e].name}. ` : ``)})},
              on: {SPEAK_COMPLETE: [
                {target: "PeopleDescription",
                  guard: ({context}) => !!context.currentRoom!.person
                },
                {target: "AskForCommand",
                actions: assign(({context})=>({visitedRooms : context.visitedRooms.add(context.currentRoom!.idx)}))
                }]
                }
            },
            PeopleDescription : {
              entry: {type: "spst.speak", params: ({context}) => ({utterance: !!context.currentRoom!.person ? `You see a person named ${context.currentRoom!.person}, maybe you can talk to them?` : ``})},
              on: {SPEAK_COMPLETE: {target: "AskForCommand",
                actions: assign(({context})=>({visitedRooms : context.visitedRooms.add(context.currentRoom!.idx)}))
                }}
            },
            ShortDescription : {
              entry: {type: "spst.speak", params: ({context}) => ({utterance: `You are ${context.currentRoom!.preposition} ${context.currentRoom!.name}`})},
              on : {SPEAK_COMPLETE: "AskForCommand"}
            },
            AskForCommand : {
              entry: {type: "spst.listen"},
              on: {LISTEN_COMPLETE:
                [
                  {
                    target: "DirectionDescription",
                    guard: ({context}) => !!context.interpretation && context.interpretation.topIntent == "DescribeRoom"
                  },
                  {
                    target: "TryToMove", 
                    actions: assign(({ context }) => ({ dir : getEntity("direction",context.interpretation!.entities), place : getEntity("place",context.interpretation!.entities)})),
                    guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "Move"
                  },
                  {
                    target: "#DM.Game.Conversation",
                    guard: ({ context }) => !!context.interpretation && !!context.currentRoom?.person && (context.interpretation.topIntent == "TalkToPerson" || context.interpretation.topIntent == "Greeting") && getEntity("person",context.interpretation.entities) == context.currentRoom.person
                  },
                  {
                    target: "CannotConverse", 
                    guard: ({ context }) => !!context.interpretation && !!context.currentRoom?.person && context.interpretation.topIntent == "TalkToPerson" && getEntity("person",context.interpretation.entities) != context.currentRoom.person
                  },
                  {
                    target: "IncomprehensibleInput",
                    guard: ({ context }) => !!context.lastResult
                  },
                  {
                    target: "NoInput"
                  }
                ]}
              },
            TryToMove : {
              entry: {type: "spst.speak", params : ({context}) => ({utterance : ((context.dir == "north" && context.currentRoom!.n!=-1) || (context.dir == "south" && context.currentRoom!.s!=-1) || (context.dir == "west" && context.currentRoom!.w!=-1) || (context.dir == "east" && context.currentRoom!.e!=-1)) ? `Going ${context.dir}.` : `You cannot go that way`})},
              on: {SPEAK_COMPLETE: [
                {
                  target: "#DM.Game.Navigation",
                  actions : assign(({ context }) => ({currentRoom : rooms[context.currentRoom!.n], imageSource : imageSources[rooms[context.currentRoom!.n].name].source})),
                  guard: ({ context }) => (context.currentRoom!.n != -1 && (context.dir == "north" || context.place == rooms[context.currentRoom!.n].name))
                },
                {
                  target: "#DM.Game.Navigation",
                  actions : assign(({ context }) => ({currentRoom : rooms[context.currentRoom!.s], imageSource : imageSources[rooms[context.currentRoom!.s].name].source})),
                  guard: ({ context }) => (context.currentRoom!.s != -1 && (context.dir == "south" || context.place == rooms[context.currentRoom!.s].name))
                },
                {
                  target: "#DM.Game.Navigation",
                  actions : assign(({ context }) => ({currentRoom : rooms[context.currentRoom!.w], imageSource : imageSources[rooms[context.currentRoom!.w].name].source})),
                  guard: ({ context }) => (context.currentRoom!.w != -1 && (context.dir == "west" || context.place == rooms[context.currentRoom!.w].name))
                },
                {
                  target: "#DM.Game.Navigation",
                  actions : assign(({ context }) => ({currentRoom : rooms[context.currentRoom!.e], imageSource : imageSources[rooms[context.currentRoom!.e].name].source})),
                  guard: ({ context }) => (context.currentRoom!.e != -1 && (context.dir == "east" || context.place == rooms[context.currentRoom!.e].name))
                },
                {
                  target: "AskForCommand"
                },
              ]}
            },
            CannotMove : {
              entry: {type: "spst.speak", params : {utterance : "You cannot go that way."}},
              on : {SPEAK_COMPLETE: "AskForCommand"}
            },
            CannotConverse : {
              entry: {type: "spst.speak", params : {utterance : "That person isn't here."}},
              on : {SPEAK_COMPLETE: "AskForCommand"}
            },
            IncomprehensibleInput: {
              entry: {type: "spst.speak", params : {utterance : "I couldn't understand what you said."}},
              on : {SPEAK_COMPLETE: "AskForCommand"}
            },
            NoInput: {
              entry: {type: "spst.speak", params: {utterance: "Just press the button whenever you want to say something."}},
              on : {SPEAK_COMPLETE: "Idle"}
            },
            Idle: {
              on: {CLICK: "AskForCommand"}
            }
          }
        },
        
        
        Conversation : {
          initial: "Greeting",
          on: {LISTEN_COMPLETE: [
            {
              target: "#DM.Game.UnintelligibleResponse",
              guard: ({context}) => !!context.lastResult
            },
            {
              target: ".LastUtterance",
              guard: ({context}) => !context.lastResult && context.noAnswerCount >= 2
            },
            {
              target: "#DM.Game.NoResponse",
            }
          ]},
          states: {
            Greeting: {
              entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!], utterance: context.greeting})},
              on: {SPEAK_COMPLETE: {target: "AwaitResponse", actions: assign({ greeting: randomize(greetings)})}}
            },
            AwaitResponse: {
              entry: {type: "spst.listen"},
              on: {LISTEN_COMPLETE:
                [
                {
                  target: "AskAboutIntent",
                  guard: ({ context}) => !!context.interpretation && context.interpretation.topIntent == "Greeting"
                },  
                { target: "AskAboutCatAttribute",
                  guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "AskAboutCat" && !!context.currentRoom!.catDirection
                },
                {
                  target: "HasNotSeenAtAll",
                  guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "AskAboutCat" && !context.currentRoom!.catDirection
                },
                ]
              }
            },
            AskAboutIntent: {
              entry: {type: "spst.speak", params: ({context}) => ({voice: voiceNames[context.currentRoom!.person!], utterance: context.intentAsking})},
              on: {SPEAK_COMPLETE: {target: "AwaitIntent", actions: assign({ intentAsking: randomize(intentAskings)})}}
            },
            AwaitIntent: {
              entry: {type: "spst.listen"},
              on: {LISTEN_COMPLETE:
                [
                { target: "AskAboutCatAttribute",
                  guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "AskAboutCat" && !!context.currentRoom!.catDirection//!!context.lastResult && (grammar[context.lastResult![0].utterance.toLowerCase()] || {}).question == "have you seen my cat",
                },
                {
                  target: "HasNotSeenAtAll",
                  guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "AskAboutCat" && !context.currentRoom!.catDirection
                },
                ]
              }
            },
            AskAboutCatAttribute: {
              entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!], utterance: context.catAsking})},
              on: {SPEAK_COMPLETE: {target: "GetAttribute", actions: assign({ catAsking: randomize(catAskings)})}}
            },
            GetAttribute: {
              entry: {type: "spst.listen"},
              on: {LISTEN_COMPLETE:
                [{ target: "RecognisedCat",
                  guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "GiveInfo" && (getEntity("color",context.interpretation.entities) == context.catColor || getEntity("eyeColor",context.interpretation.entities) == context.catEyeColor || getEntity("accessory",context.interpretation.entities) == context.catAccessory)
                },
                {
                  target: "HasNotSeen",
                  guard: ({ context }) => !!context.interpretation && context.interpretation.topIntent == "GiveInfo" && getEntity("color",context.interpretation.entities) != context.catColor
                },
                {
                  target: "#DM.Game.UnintelligibleResponse",
                  guard: ({context}) => !!context.lastResult
                },
                {
                  target: "#DM.Game.NoResponse",
                }
                ]
              }
            },
            RecognisedCat: {
              entry: {type: "spst.speak", params: ({context}) => ({voice: voiceNames[context.currentRoom!.person!], utterance: context.confirmation + `I saw a ` + (!!getEntity("color",context.interpretation!.entities) ? `${context.catColor} ` : ``) + `cat ` + (!!getEntity("eyeColor",context.interpretation!.entities) ? `with ${context.catEyeColor} eyes ` : ``) + (!!getEntity("eyeColor",context.interpretation!.entities) ? `wearing a ${context.catAccessory} ` : ``) + `walking by. It went ${{'n':'north','s':'south','w':'west','e':'east'}[context.currentRoom!.catDirection!]}.`})},
              on: {SPEAK_COMPLETE: {target: "PossibleGoodBye", actions: assign({ confirmation: randomize(confirmations)})}}
            },
            HasNotSeenAtAll: {
              entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!],utterance : `No, I haven't seen any cat, sorry.`})},
              on: {SPEAK_COMPLETE: "PossibleGoodBye"}
            },
            HasNotSeen: {
              entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!],utterance : `No, I haven't seen a cat like that, sorry.`})},
              on: {SPEAK_COMPLETE: "PossibleGoodBye"}
            },
            PossibleGoodBye: {
              entry: {type: "spst.listen"},
              on: {LISTEN_COMPLETE:
                [
                  {target: "SayGoodBye",
                    guard: ({ context }) => !!context.interpretation && (context.interpretation.topIntent == "Bye" || context.interpretation.topIntent == "Thanks")
                  },
                  {target: "#DM.Game.Navigation", actions: assign(({context})=>({imageSource : imageSources[context.currentRoom!.name].source}))}
                ]
              }
            },
            SayGoodBye: {
              entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!],utterance : context.goodBye})},
              on: {SPEAK_COMPLETE: {target: "#DM.Game.Navigation", actions: assign(({context})=>({imageSource : imageSources[context.currentRoom!.name].source, goodBye: randomize(goodByes)}))}}
            },
            
            LastUtterance: {
              entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!],utterance : `Hey! You are just ignoring me!`})},
              on: {SPEAK_COMPLETE: "NarratorsComment"}
            },
            NarratorsComment: {
              entry: {type: "spst.speak", params: ({context})=> ({utterance: `${context.currentRoom!.person} walked away...`})},
              on: {SPEAK_COMPLETE: {target: "#DM.Game.Navigation", actions: assign(({context})=>({imageSource : imageSources[context.currentRoom!.name].source, noAnswerCount: 0}))}}
            },
            Last: {
              type: "history"
            }
          }
        },
        UnintelligibleResponse: {
          entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!],utterance : `Sorry, what did you say?`})},
          on: {SPEAK_COMPLETE: {target: "#DM.Game.Conversation.Last"}}
        },
        NoResponse: {
          entry: {type: "spst.speak", params: ({ context }) => ({voice: voiceNames[context.currentRoom!.person!],utterance : `Sorry, did you say something?`})},
          on: {SPEAK_COMPLETE: {target: "#DM.Game.Conversation.Last", actions: assign(({ context }) => ({ noAnswerCount : context.noAnswerCount + 1}))}}
        },
        
        Won : {
          entry: {type: "spst.speak", params: {voice: "en-US-GuyNeural", utterance : "Thank you for finding me. Now let's go home. I am very hungry."
          }}
        }
      }
    }

  },
});

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

export function setupBackground(element: HTMLImageElement) {
  dmActor.subscribe((snapshot) => {
    //element.src = `${imageSources[snapshot.context.currentRoom.name || "none"].source}`;
    element.src = `${snapshot.context.menu ? imageSources["menu"].source : (snapshot.context.imageSource || imageSources["none"].source)}`;
  });
}

export function setupPerson(element: HTMLImageElement) {
  dmActor.subscribe((snapshot) => {
    element.src = `${imageSources[snapshot.context.currentRoom?.person || "none"].source}`;
  });
}

export function setupCat(element: HTMLImageElement) {
  dmActor.subscribe((snapshot) => {
    element.src = `${imageSources[snapshot.context.currentRoom?.catDirection == "here" ? snapshot.context.catColor! : "none"].source}`;
  });
}

export function setupEyes(element: HTMLImageElement) {
  dmActor.subscribe((snapshot) => {
    element.src = `${imageSources[snapshot.context.currentRoom?.catDirection == "here" ? snapshot.context.catEyeColor! : "none"].source}`;
  });
}

export function setupAccessory(element: HTMLImageElement) {
  dmActor.subscribe((snapshot) => {
    element.src = `${imageSources[snapshot.context.currentRoom?.catDirection == "here" ? snapshot.context.catAccessory! : "none"].source}`;
  });
}

export function setupText(element: HTMLHeadingElement) {
  dmActor.subscribe((snapshot) => {
    element.innerHTML = `${snapshot.context.currentRoom?.name || ""}`;
  });
}
