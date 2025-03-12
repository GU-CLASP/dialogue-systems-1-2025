import { assign, createActor, setup } from "xstate";
import { Settings, speechstate } from "speechstate";
import { createBrowserInspector } from "@statelyai/inspect";
import { KEY } from "./azure";
import { NLU_KEY } from "./azure";
import { DMContext, DMEvents } from "./types";

const inspector = createBrowserInspector();

const azureCredentials = {
  endpoint:
    "https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint: "https://timetraveler.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview", /** your Azure CLU prediction URL */
  key: NLU_KEY, /** reference to your Azure CLU key - you will find it in azure.ts */
  deploymentName: "appointment", /** your Azure CLU deployment */
  projectName: "the_time_traveler", /** your Azure CLU project name */
};

const settings: Settings = {
  azureLanguageCredentials: azureLanguageCredentials /** global activation of NLU */,
  azureCredentials: azureCredentials,
  azureRegion: "northeurope",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-AvaMultilingualNeural", //"en-US-DavisNeural"
  //en-US-AvaMultilingualNeural copied from SSML https://speech.microsoft.com/portal/8032a881d1714f93a1097e4d35d8b4a6/audiocontentcreation/folder/602a3e1e-7257-4721-8111-009550c308f6/file/aff29c34-c355-429d-9b7e-3b8bb07db2af
};

interface GrammarEntry {
  person?: string;
  day?: string;
  // confirmation?: string;
  // negation?: string;
  wholeDay?: string;
  time?: string;
  interpretation?: string;
  yes?: string;
  no?: string;
}




const grammar: { [index: string]: GrammarEntry } = {

  // People
  vlad: { person: "Vladislav Maraev" },
  aya: { person: "Nayat Astaiza Soriano" },
  victoria: { person: "Victoria Daniilidou" },
  marco: { person: "Marco Leali"},

  // // Interpretaion
  "harry potter": { person: "He is a famous magician who defeated Lord Voldemort."},
  "harry": { person: "He is a famous magician who defeated Lord Voldemort."},
  "potter": { person: "He is a famous magician who defeated Lord Voldemort."},

  "taylor swift": { person: "She is a famous singer from the United States."},
  "taylor": { person: "She is a famous singer from the United States."},
  "swift": { person: "She is a famous singer from the United States."},

  "spiderman": { person: "He is Peter Parker."},
  "shrek": { person: "He is green ogre whose fearsome appearance belies a kind heart."},
  "albert einstain": { person: "He was a famous scientist."},
  "donald trump": { person: "He is the president of the United States."},
  "elon mask": { person: "He is the inventor of Tesla."},
  "the explorer": { person: "He is Julien."},
  "that mesmerizing guy": { person: "He is Menzi Idol."},
  "billy": { person: "He is the villain of the story."},

  // "hello world": { person: "Marco Leali"}, // Pay attention! You have to write everything in lowercase otherwise the function will not work properly
  
  // Days
  monday: { day: "Monday" },
  "on monday": { day: "Monday" },  // ✅ Synonym
  tuesday: { day: "Tuesday" },
  "on tuesday": { day: "Tuesday" }, // ✅ Synonym
  wednesday: { day: "Wednesday" },
  "on wednesday": { day: "Wednesday" }, // ✅ Synonym
  thursday: { day: "Thursday" },
  "on thursday": { day: "Thursday" }, // ✅ Synonym
  friday: { day: "Friday" },
  "on friday": { day: "Friday" }, // ✅ Synonym
  saturday: { day: "Saturday" },
  "on saturday": { day: "Saturday" }, // ✅ Synonym
  sunday: { day: "Sunday" },
  "on sunday": { day: "Sunday" }, // ✅ Synonym

  // Times 
  "0": { time: "00:00" }, 
  "at 0": { time: "00:00" },
  
  "midnight": { time: "00:00" },
  "at midnight": { time: "00:00" },
  
  "1": { time: "1 AM" }, 
  "at 1": { time: "1 AM" },
  
  "2": { time: "2 AM" },
  "at 2": { time: "2 AM" },
  
  "3": { time: "3 AM" },
  "at 3": { time: "3 AM" },
  
  "4": { time: "4 AM" },
  "at 4": { time: "4 AM" },
  
  "5": { time: "5 AM" },
  "at 5": { time: "5 AM" },
  
  "6": { time: "6 AM" },
  "at 6": { time: "6 AM" },
 
  "7": { time: "7 AM" },
  "at 7": { time: "7 AM" },

  "8": { time: "8 AM" },
  "at 8": { time: "8 AM" },

  "9": { time: "9 AM" },
  "at 9": { time: "9 AM" },

  "10": { time: "10 AM" },
  "at 10": { time: "10 AM" },

  "11": { time: "11 AM" },
  "at 11": { time: "11 AM" },

  "12": { time: "12 PM" },
  "at 12": { time: "12 PM" },

  "noon": { time: "12 PM" },
  "at noon": { time: "12 PM" },

  "13": { time: "1 PM" },
  "at 13": { time: "1 PM" },

  "14": { time: "2 PM" },
  "at 14": { time: "2 PM" },

  "15": { time: "3 PM" },
  "at 15": { time: "3 PM" },

  "16": { time: "4 PM" },
  "at 16": { time: "4 PM" },

  "17": { time: "5 PM" },
  "at 17": { time: "5 PM" },

  "18": { time: "6 PM" },
  "at 18": { time: "6 PM" },

  "19": { time: "7 PM" },
  "at 19": { time: "7 PM" },

  "20": { time: "8 PM" },
  "at 20": { time: "8 PM" },

  "21": { time: "9 PM" },
  "at 21": { time: "9 PM" },

  "22": { time: "10 PM" },
  "at 22": { time: "10 PM" },

  "23": { time: "11 PM" },
  "at 23": { time: "11 PM" },

  "24": { time: "12 AM" },
  "at 24": { time: "12 AM" },

  "midnight": { time: "12 AM" },
  "at midnight": { time: "12 AM" },

  "0:30": { time: "00:30" },
  "at 0:30": { time: "00:30" },

  "1:30": { time: "01:30" },
  "at 1:30": { time: "01:30" },

  "2:30": { time: "02:30" }, 
  "at 2:30": { time: "02:30" },

  "3:30": { time: "03:30" }, 
  "at 3:30": { time: "03:30" },

  "4:30": { time: "04:30" },
  "at 4:30": { time: "04:30" },

  "5:30": { time: "05:30" },
  "at 5:30": { time: "05:30" },

  "6:30": { time: "06:30" },
  "at 6:30": { time: "06:30" },

  "7:30": { time: "07:30" },
  "at 7:30": { time: "07:30" },

  "8:30": { time: "08:30" },
  "at 8:30": { time: "08:30" },

  "9:30": { time: "09:30" },
  "at 9:30": { time: "09:30" },

  "10:30": { time: "10:30" },
  "at 10:30": { time: "10:30" },

  "11:30": { time: "11:30" },
  "at 11:30": { time: "11:30" },

  "12:30": { time: "12:30" },
  "at 12:30": { time: "12:30" },

  "13:30": { time: "13:30" },
  "at 13:30": { time: "13:30" },

  "14:30": { time: "14:30" },
  "at 14:30": { time: "14:30" },

  "15:30": { time: "15:30" },
  "at 15:30": { time: "15:30" },

  "16:30": { time: "16:30" },
  "at 16:30": { time: "16:30" },

  "17:30": { time: "17:30" },
  "at 17:30": { time: "17:30" },

  "18:30": { time: "18:30" },
  "at 18:30": { time: "18:30" },

  "19:30": { time: "19:30" },
  "at 19:30": { time: "19:30" },

  "20:30": { time: "20:30" },
  "at 20:30": { time: "20:30" },

  "21:30": { time: "21:30" },
  "at 21:30": { time: "21:30" },

  "22:30": { time: "22:30" },
  "at 22:30": { time: "22:30" },

  "23:30": { time: "23:30" },
  "at 23:30": { time: "23:30" },

    


  "yes": { yes: "yes" }, 
  "of course": { yes: "yes" }, 
  "for sure": { yes: "yes" },
  
  "no": { no: "no" }, 
  "no way": { no: "no" }, 
  "absolutely not": { no: "no" },

};



function isInGrammar(utterance: string) {
  return utterance.toLowerCase() in grammar;
}

function getPerson(utterance: string) {
  return (grammar[utterance.toLowerCase()] || {}).person; 
}





const dmMachine = setup({

  types: {
    /** you might need to extend these */
    context: {} as DMContext,
    events: {} as DMEvents,
  },

  actions: {
    /** define your actions here */
    "spst.speak": ({ context }, params: { utterance: string }) => {
      // Log the utterance being spoken
      console.log(`🗣️ Speaking: "${params.utterance}"`);

      // Send the SPEAK message to spstRef
      context.spstRef.send({
        type: "SPEAK",
        value: {
          utterance: params.utterance,
        },
      });
    },

    "spst.listen": ({ context }) => {
      console.log("👂 Listening...");
      context.spstRef.send({ type: "LISTEN" });
    },

    "spst.listen": ({ context }) =>
      context.spstRef.send({
        type: "LISTEN",
        value: { nlu: true }, /** Local activation of NLU */ /*lab4*/
      }),
  },

}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    person: null,
    // confirmation: null,
    // negation: null,
    day: null,
    time: null,
    wholeDay: null,
    interpretation: null,
    yes: null,
    no: null,

  }),
  id: "DM",
  initial: "Prepare",
  states: {

       /* STATE */
       Prepare: {
         entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
         on: { ASRTTS_READY: "WaitToStart" },
       },

       /* STATE */
       WaitToStart: {
         on: { CLICK: "Greeting" },
       },


        Greeting: {
          entry: [
            () => console.log("🟢 Entered Greeting state"),
            { type: "spst.speak", params: { utterance: `Hi!` } }
          ],
          on: { SPEAK_COMPLETE: "AskForWho" },
        },


        /* PERSON */

        AskForWho: {
          entry: [
            () => console.log("🟢 Asking for meeting or for person..."),
            { type: "spst.speak", params: { utterance: `Tell me.` } }
          ],
          on: { SPEAK_COMPLETE: "AskForWhoListen" },
        },
        
        AskForWhoListen: {
          initial: "Ask",
          entry: [
            () => console.log("👂 Listening for meeting or for person..."),
            { type: "spst.listen"}
          ],

          on: {

            LISTEN_COMPLETE: [
              {
                target: "CheckGrammarPerson",
                guard: ({ context }) => !!context.person,
              },
              { target: ".NoInput" },
            ],
          },
          states: {
            NoInput: {
              entry: {
                type: "spst.speak",
                params: { utterance: `I can't hear you! Tell me.` },
              },
              on: { SPEAK_COMPLETE: "Ask" },
            },
            Ask: {
              entry: { type: "spst.listen" },
              on: {
                RECOGNISED: {
                  actions: assign(({ event }) => {
                    return { person: event.value, interpretation: event.nluValue };  // This enables RECOGNISED events to contain NLU results (accessible via event.nluValue). // lab4
                  }),
                },
                ASR_NOINPUT: {
                  actions: assign({ person: null }),
                },
              },
            },
          },
        },

        CheckGrammarPerson: {
          entry: [
            ({ context }) => {

              // lab2
              // Safely access the spoken person in context
              const spokenPerson = context.person?.[0]?.utterance || "unknown"; // Safe access
              // Check if the spoken person is in the grammar
              const inGrammar = isInGrammar(spokenPerson);
              // Log information about the spoken person
              console.log(`🔍 You just said: ${spokenPerson}`);
              console.log(`✅ Is "${spokenPerson}" in grammar? ${inGrammar ? "Yes" : "No"}`);


              //lab4
              // Extract entities from recognized context if they exist
              const personEntity = context.interpretation?.entities.find(entity => entity.category === "person");
              const dayEntity = context.interpretation?.entities.find(entity => entity.category === "day");
              const timeEntity = context.interpretation?.entities.find(entity => entity.category === "time");
                // const wholeDayEntity = context.interpretation?.entities.find(entity => entity.category === "wholeDay");

              // Extract top intent
              const topIntent = context.interpretation?.topIntent;
              
              console.log(`👤 Person: ${personEntity?.text}`);
              console.log(`📅 Meeting day: ${dayEntity?.text}`);
              console.log(`⏰ Meeting time: ${timeEntity?.text}`);
              // console.log(`👍 Confirmation/Negation: ${wholeDayEntity?.text}`);
              console.log(`😎 topIntent: ${topIntent}`);




            //   Check if "Create a meeting" is the top intent (EXTRA NOT USED)
            //   const isMeetingIntent = context.recognized?.intents?.some(intent => intent.category === "Create a meeting" && intent.confidenceScore > 0.6);
            //   console.log(`📝 Is this a meeting request? ${isMeetingIntent ? "Yes" : "No"}`);


            },
        
            {
              type: "spst.speak",
              params: ({ context }) => {

                // lab2
                // const spokenPerson = context.person?.[0]?.utterance || "unknown";
                // const fullName = grammar[spokenPerson]?.person || spokenPerson; // Look up full name in grammar

                // console.log(`🔍 You just said: ${spokenPerson}`);
                // console.log(`👤 Full name: ${fullName}`);

                // Extract entities details again
                const personEntity = context.interpretation?.entities.find(entity => entity.category === "person");
                const dayEntity = context.interpretation?.entities.find(entity => entity.category === "day");
                const timeEntity = context.interpretation?.entities.find(entity => entity.category === "time");
                // const wholeDayEntity = context.interpretation?.entities.find(entity => entity.category === "wholeDay");

                // Extract top intent
                const topIntent = context.interpretation?.topIntent;
                


                return {

                  // lab2
                  // utterance: `You just said: ${spokenPerson}. ${
                  //   isInGrammar(spokenPerson) 
                  //     ? `It corresponds to ${getPerson(spokenPerson)}.` 
                  //     : "It is not in the grammar."
                  // }`,

                  utterance: `${
                    topIntent === "Who is X"
                      ? (personEntity?.text ? `You asked for who is ${personEntity.text}.` : `You asked for who is someone.`)
                      : `You requested a meeting ${personEntity?.text ? ` with ${personEntity.text}` : ''}${dayEntity?.text ? ` on ${dayEntity.text}` : ''}${timeEntity?.text ? ` at ${timeEntity.text}` : ''}`.trim()
                  }`,


                };
              },
            },
          ],
        
          on: {
            SPEAK_COMPLETE: [
              {
                target: "AskForCreation",

                // lab2
                // guard: ({ context }) => 
                //   isInGrammar(context.person?.[0]?.utterance),

                // guard: ({ context, interpretation }) => {
                //   const spokenPerson = context.person?.[0]?.utterance;
                //   const personEntity = interpretation.entities.find(entity => entity.category === "person");
                //   return spokenPerson && personEntity && personEntity.text === spokenPerson; // Ensure the person entity matches the spoken input
                // },

                // lab4 (EXTRA NOT USED)
                // guard: ({ context }) => {
                //   const hasDay = context.recognized?.entities?.some(entity => entity.category === "day");
                //   const hasTime = context.recognized?.entities?.some(entity => entity.category === "time");
                //   return hasDay && hasTime;
                // },

              },
              { target: "AskForWho" }, // 🔄 Go back if not in grammar
            ],
          },
        },



    //     /* DAY */

    //     AskForDay: {
    //       entry: [
    //         () => console.log("🟢 Asking for meeting day..."),
    //         { type: "spst.speak", params: { utterance: `On which day is your meeting?` } }
    //       ],
    //       on: { SPEAK_COMPLETE: "AskForDayListen" },
    //     },
        
    //     AskForDayListen: {
    //       initial: "Ask",
    //       entry: [
    //         () => console.log("👂 Listening for a day..."),
    //         { type: "spst.listen"}
    //       ],

    //       on: {

    //         LISTEN_COMPLETE: [
    //           {
    //             target: "CheckGrammarDay",
    //             guard: ({ context }) => !!context.day,
    //           },
    //           { target: ".NoInput" },
    //         ],
    //       },
    //       states: {
    //         NoInput: {
    //           entry: {
    //             type: "spst.speak",
    //             params: { utterance: `I can't hear you! On which day is your meeting?` },
    //           },
    //           on: { SPEAK_COMPLETE: "Ask" },
    //         },
    //         Ask: {
    //           entry: { type: "spst.listen" },
    //           on: {
    //             RECOGNISED: {
    //               actions: assign(({ event }) => {
    //                 return { day: event.value };
    //               }),
    //             },
    //             ASR_NOINPUT: {
    //               actions: assign({ day: null }),
    //             },
    //           },
    //         },
    //       },
    //     },

    //     CheckGrammarDay: {
    //       entry: [
    //         ({ context }) => {
    //           const spokenDay = context.day?.[0]?.utterance || "unknown"; // ✅ Safe access
    //           const inGrammar = isInGrammar(spokenDay);
    //         },
        
    //         {
    //           type: "spst.speak",
    //           params: ({ context }) => {
    //             const spokenDay = context.day?.[0]?.utterance || "unknown";
    //             const fullDay = grammar[spokenDay]?.day || spokenDay; // Look up full day in grammar

    //             console.log(`🔍 You just said: ${spokenDay}`);
    //             console.log(`👤 Full day: ${fullDay}`);


    //             return {
    //               utterance: `You just said: ${spokenDay}. ${
    //                 isInGrammar(spokenDay) ? `It corresponds to ${getDay(spokenDay)}.` : "It is not in the grammar."
    //               }`,

    //             };
    //           },
    //         },
    //       ],
        
    //       on: {
    //         SPEAK_COMPLETE: [
    //           {
    //             target: "AskForWholeDay",
    //             guard: ({ context }) => isInGrammar(context.day?.[0]?.utterance),
    //           },
    //           { target: "AskForDay" }, // 🔄 Go back if not in grammar
    //         ],
    //       },
    //     },


    // /* WHOLE DAY */

    // AskForWholeDay: {
    //   entry: [
    //     () => console.log("🟢 Asking for whole day..."),
    //     { type: "spst.speak", params: { utterance: `Will it take the whole day?` } }
    //   ],
    //   on: { SPEAK_COMPLETE: "AskForWholeDayListen" },
    // },
    


    // AskForWholeDayListen: {
    //   initial: "Ask",
    //   entry: [
    //     () => console.log("👂 Listening for whole day..."),
    //     { type: "spst.listen"}
    //   ],

    //   on: {

    //     LISTEN_COMPLETE: [
    //       {
    //         target: "CheckGrammarWholeDay",
    //         guard: ({ context }) => !!context.wholeDay,
    //       },
    //       { target: ".NoInput" },
    //     ],
    //   },
    //   states: {


    //     NoInput: {
    //       entry: {
    //         type: "spst.speak",
    //         params: { utterance: `I can't hear you! Will it take the whole day?` },
    //       },
    //       on: { SPEAK_COMPLETE: "Ask" },
    //     },
    //     Ask: {
    //       entry: { type: "spst.listen" },
    //       on: {
    //         RECOGNISED: {
    //           actions: assign(({ event }) => {
    //             return { wholeDay: event.value };
    //           }),
    //         },
    //         ASR_NOINPUT: {
    //           actions: assign({ wholeDay: null }),
    //         },
    //       },
    //     },


    //   },
    // },



    // CheckGrammarWholeDay: {
    //   entry: [
    //     ({ context }) => {
    //       const spokenWholeDay = context.wholeDay?.[0]?.utterance || "unknown"; // ✅ Safe access
    //       const inGrammar = isInGrammar(spokenWholeDay);
    //     },
    
    //     {
    //       type: "spst.speak",
    //       params: ({ context }) => {
    //         const spokenWholeDay = context.wholeDay?.[0]?.utterance || "unknown"; // ✅ Safe access
    //         const fullWholeDay = grammar[spokenWholeDay]?.wholeDay || spokenWholeDay; // Look up full whole day in grammar

          


    //         console.log(`🔍 You just said: ${spokenWholeDay}`);
    //         console.log(`👤 Full whole day: ${fullWholeDay}`);


    //         return {
    //           utterance: `You just said: ${spokenWholeDay}. ${
    //             isInGrammar(spokenWholeDay) ? `It corresponds to ${getWholeDay(spokenWholeDay)}.` : "It is not in the grammar."
    //           }`,

    //         };
    //       },
    //     },
    //   ],
    
    //   on: {
    //     SPEAK_COMPLETE: [
    //       {
    //         target: "AskForCreationWholeDay",
    //         guard: ({ context }) => 
    //           isInGrammar(context.wholeDay?.[0]?.utterance) &&
    //           getWholeDay(context.wholeDay?.[0]?.utterance) === "yes",

    //       },

    //       {
    //         target: "AskForTime",
    //         guard: ({ context }) =>
    //           isInGrammar(context.wholeDay?.[0]?.utterance) &&
    //           getWholeDay(context.wholeDay?.[0]?.utterance?.toLowerCase()) === "no",
    //       },

    //       { target: "AskForWholeDay" }, // 🔄 Go back if not in grammar
    //     ],
    //   },
    // },


 

    //     /* TIME */

    //     AskForTime: {
    //       entry: [
    //         () => console.log("🟢 Asking for time..."),
    //         { type: "spst.speak", params: { utterance: `What time is your meeting?` } }
    //       ],
    //       on: { SPEAK_COMPLETE: "AskForTimeListen" },
    //     },
        
    
    
    //     AskForTimeListen: {
    //       initial: "Ask",
    //       entry: [
    //         () => console.log("👂 Listening for time..."),
    //         { type: "spst.listen"}
    //       ],
    
    //       on: {
    
    //         LISTEN_COMPLETE: [
    //           {
    //             target: "CheckGrammarTime",
    //             guard: ({ context }) => !!context.time,
    //           },
    //           { target: ".NoInput" },
    //         ],
    //       },
    //       states: {
    
    
    //         NoInput: {
    //           entry: {
    //             type: "spst.speak",
    //             params: { utterance: `I can't hear you! What time is your meeting?` },
    //           },
    //           on: { SPEAK_COMPLETE: "Ask" },
    //         },
    //         Ask: {
    //           entry: { type: "spst.listen" },
    //           on: {
    //             RECOGNISED: {
    //               actions: assign(({ event }) => {
    //                 return { time: event.value };
    //               }),
    //             },
    //             ASR_NOINPUT: {
    //               actions: assign({ time: null }),
    //             },
    //           },
    //         },
    
    
    //       },
    //     },
    


    //     CheckGrammarTime: {
    //       entry: [
    //         ({ context }) => {
    //           const spokenTime = context.time?.[0]?.utterance || "unknown"; // ✅ Safe access
    //           const inGrammar = isInGrammar(spokenTime);
    //         },
        
    //         {
    //           type: "spst.speak",
    //           params: ({ context }) => {
    //             const spokenTime = context.time?.[0]?.utterance || "unknown";
    //             const fullTime= grammar[spokenTime]?.time || spokenTime; // Look up full time in grammar
                

    //             console.log(`🔍 You just said: ${spokenTime}`);
    //             console.log(`👤 Full time: ${fullTime}`);


    //             return {
    //               utterance: `You just said: ${spokenTime}. ${
    //                 isInGrammar(spokenTime) ? `It corresponds to ${getTime(spokenTime)}.` : "It is not in the grammar."
    //               }`,

    //             };
    //           },
    //         },
    //       ],
        
    //       on: {
    //         SPEAK_COMPLETE: [
    //           {
    //             target: "AskForCreation",
    //             guard: ({ context }) => isInGrammar(context.time?.[0]?.utterance),
    //           },
    //           { target: "AskForTime" }, // 🔄 Go back if not in grammar
    //         ],
    //       },
    //     },


        /* CREATION */


        AskForCreation: {

          // entry: {

          entry: [
            // Store the current topIntent as previousTopIntent
            ({ context }) => {
              context.previousTopIntent = context.interpretation?.topIntent;


            // // const personText = context.person?.[0]?.utterance || "someone unknown"; 
            // context.previousPerson = context.interpretation?.entities.find(entity => entity.category === "person") || "someone unknown";
           
           
            // Store only the text of the person entity
            const personEntity = context.interpretation?.entities.find(entity => entity.category === "person");
            context.previousPerson = personEntity ? personEntity.text : "someone unknown"; // Ensure you store only the text

            },
            {
            type: "spst.speak",
            params: ({ context }) => ({

              // lab2
              // utterance: `Do you want me to create an appointment with ${getPerson(context.person?.[0]?.utterance)} on ${getDay(context.day?.[0]?.utterance)} at ${getTime(context.time?.[0]?.utterance)} ?`,

              utterance: `Is that correct?`,
              
            }),
            },
          ],



          on: { SPEAK_COMPLETE: "AskForCreationListen" },
        },
        
    
    
        AskForCreationListen: {
          initial: "Ask",
          entry: [
            () => console.log("👂 Listening for confirmation..."),
            { type: "spst.listen"}
          ],
    
          on: {
    
            LISTEN_COMPLETE: [
              {
                target: "CheckGrammarCreation",
                guard: ({ context }) =>
                  !!context.yes || !!context.no, // You can modify this guard as needed
        
                // If you want to check for both topIntent and previousTopIntent:
                // guard: ({ context }) =>
                //   context.previousTopIntent === "Confirmation" && context.interpretation?.topIntent === "Create a meeting",
              },
              { target: ".NoInput" },
            ],
          },
          states: {
    
    
            NoInput: {
              entry: {
                type: "spst.speak",
                params: ({ context }) => ({
                  utterance: `I can't hear you! Is that correct?`,
                }),
              },


              on: { SPEAK_COMPLETE: "Ask" },
            },
            Ask: {
              entry: { type: "spst.listen" },
              on: {

                // lab2
                // RECOGNISED: {
                //   actions: assign(({ event }) => {
                //     return { wholeDay: event.value };
                //   }),
                // },

                RECOGNISED: {
                  actions: assign(({ event }) => {
                    return { yes: event.value, 
                             no: event.value, 
                             interpretation: event.nluValue };  // This enables RECOGNISED events to contain NLU results (accessible via event.nluValue). // lab4
                  }),
                },

                ASR_NOINPUT: {
                  actions: assign({ yes: null, no: null }),
                },
              },
            },
    
    
          },
        },
    



        CheckGrammarCreation: {
          entry: [
            ({ context }) => {
              // const spokenwholeDay2 = context.wholeDay?.[0]?.utterance?.toLowerCase() || "unknown"; // ✅ Safe access & lowercase
              // console.log(`🔍 You just said: ${spokenwholeDay2}`);
        
              // const inGrammar = isInGrammar(spokenwholeDay2);
              // console.log(`✅ Is "${spokenwholeDay2}" in grammar? ${inGrammar ? "Yes" : "No"}`);

              const yesEntity = context.interpretation?.entities.find(entity => entity.category === "yes");
              const noEntity = context.interpretation?.entities.find(entity => entity.category === "no");
              const topIntent = context.interpretation?.topIntent;

              console.log(`👍 yes: ${yesEntity?.text}`);
              console.log(`👎 no: ${noEntity?.text}`);
              console.log(`😎 initialtopIntent: ${context.previousTopIntent}`);
              console.log(`😎 topIntent: ${topIntent}`);
              



            },
        
            {
              type: "spst.speak",
              params: ({ context }) => {
                // const spokenwholeDay2 = context.wholeDay?.[0]?.utterance?.toLowerCase() || "unknown";

                const yesEntity = context.interpretation?.entities.find(entity => entity.category === "yes");
                const noEntity = context.interpretation?.entities.find(entity => entity.category === "no");
                const topIntent = context.interpretation?.topIntent;
                
                return {

                  // lab2
                  // utterance: `You just said: ${spokenwholeDay2}. And it ${
                  //   isInGrammar(spokenwholeDay2) ? `It corresponds to ${getWholeDay(spokenwholeDay2)}.` : "is not"
                  // } in the grammar.`,

                  // lab4
                  utterance: `${
                    topIntent === "Confirmation"
                      ? `You just said ${yesEntity?.text || "yes"}.`
                      : `${noEntity?.text ? `You just said ${noEntity.text}.` : "You just said no."}`
                  }`,


                };
              },
            },
          ],
        
          on: {
            SPEAK_COMPLETE: [
              {
                target: "Done",
                guard: ({ context }) =>
                  context.interpretation?.topIntent === "Confirmation"  &&
                  context.previousTopIntent === "Create a meeting",

                  actions: [
                    {
                      type: "spst.speak",
                      params: {
                        utterance: "We received your request of appointment. Thank you.",
                      },
                    },
                  ],

              },


              {
                target: "Done",
                guard: ({ context }) =>
                  context.interpretation?.topIntent === "Confirmation" &&
                  context.previousTopIntent === "Who is X",

                  actions: [
                    {
                      type: "spst.speak", 
                      params: ({ context }) => {  // Context is passed to the action function

                        
                        // return {
                        //   utterance: `I will tell you more about that person! ${getPerson(context.previousPerson)}`, // 

                        const personText = getPerson(context.previousPerson) || "I'm sorry, I don't know that person.";
      
                        return {
                          // utterance: context.previousPerson 
                          //   ? `I will tell you more about that person! ${personText}`
                          //   : personText, 
                          utterance: personText && personText !== "I'm sorry, I don't know that person."
                          ? `I will tell you more about that person! ${personText}`
                          : "I'm sorry, I don't know that person.",
                            
                        };
                      },
                    },
                  ],

              },

              {
                target: "AskForWho",
                guard: ({ context }) =>
                  context.interpretation?.topIntent === "Negation",
                  actions: [
                    {
                      type: "spst.speak", 
                      params: ({ context }) => {  
                        return {
                          utterance: "Let's go back. Tell me again." 
                        };
                      },
                    },
                  ],

              },



              // {
              //   target: "AskForCreation", // 🔄 If not in grammar, go back and ask again
              //   guard: ({ context }) => !isInGrammar(context.person?.[0]?.utterance),
              // },


            ],
          },
        },


        // /* CREATION WHOLE DAY */


        // AskForCreationWholeDay: {

        //   entry: {
        //     type: "spst.speak",
        //     params: ({ context }) => ({
            
              
        //       utterance: `Do you want me to create an appointment with ${getPerson(context.person?.[0]?.utterance)} on ${getDay(context.day?.[0]?.utterance)} for the whole day ?`,


        //     }),
        //   },


        //   on: { SPEAK_COMPLETE: "AskForCreationWholeDayListen" },
        // },
        
    
    
        // AskForCreationWholeDayListen: {
        //   initial: "Ask",
        //   entry: [
        //     () => console.log("👂 Listening for whole day creation..."),
        //     { type: "spst.listen"}
        //   ],
    
        //   on: {
    
        //     LISTEN_COMPLETE: [
        //       {
        //         target: "CheckGrammarWholeDayCreation",
        //         guard: ({ context }) => !!context.wholeDay,
        //       },
        //       { target: ".NoInput" },
        //     ],
        //   },
        //   states: {
    
    
        //     NoInput: {
        //       entry: {
        //         type: "spst.speak",
        //         params: ({ context }) => ({
        //           utterance: `I can't hear you! Do you want me to create an appointment with ${getPerson(context.person?.[0]?.utterance)} on ${getDay(context.day?.[0]?.utterance)} for the whole day ?`,
        //         }),
        //       },


        //       on: { SPEAK_COMPLETE: "Ask" },
        //     },
        //     Ask: {
        //       entry: { type: "spst.listen" },
        //       on: {
        //         RECOGNISED: {
        //           actions: assign(({ event }) => {
        //             return { wholeDay: event.value };
        //           }),
        //         },
        //         ASR_NOINPUT: {
        //           actions: assign({ wholeDay: null }),
        //         },
        //       },
        //     },
    
    
        //   },
        // },


        // CheckGrammarWholeDayCreation: {
        //   entry: [
        //     ({ context }) => {
        //       const spokenwholeDay3 = context.wholeDay?.[0]?.utterance?.toLowerCase() || "unknown"; // ✅ Safe access & lowercase
        //       console.log(`🔍 You just said: ${spokenwholeDay3}`);
        
        //       const inGrammar = isInGrammar(spokenwholeDay3);
        //       console.log(`✅ Is "${spokenwholeDay3}" in grammar? ${inGrammar ? "Yes" : "No"}`);



        //     },
        
        //     {
        //       type: "spst.speak",
        //       params: ({ context }) => {
        //         const spokenwholeDay3 = context.wholeDay?.[0]?.utterance?.toLowerCase() || "unknown";
                
        //         return {
        //           utterance: `You just said: ${spokenwholeDay3}. And it ${
        //             isInGrammar(spokenwholeDay3) ? `It corresponds to ${getWholeDay(spokenwholeDay3)}.` : "is not"
        //           } in the grammar.`,


        //         };
        //       },
        //     },
        //   ],
        
        //   on: {
        //     SPEAK_COMPLETE: [
        //       {
        //         target: "Ending",
        //         guard: ({ context }) =>
        //           isInGrammar(context.wholeDay?.[0]?.utterance) &&
        //           grammar[context.wholeDay?.[0]?.utterance?.toLowerCase()]?.wholeDay === "yes",
        //       },
        //       {
        //         target: "AskForWho",
        //         guard: ({ context }) =>
        //           isInGrammar(context.wholeDay?.[0]?.utterance) &&
        //           grammar[context.wholeDay?.[0]?.utterance?.toLowerCase()]?.wholeDay === "no",
        //       },
        //       {
        //         target: "AskForCreationWholeDay", // 🔄 If not in grammar, go back and ask again
        //         guard: ({ context }) => !isInGrammar(context.wholeDay?.[0]?.utterance),
        //       },
        //     ],
        //   },
        // },





        //  /* ENDING */

        // Ending: {
        //  entry: [
        //    () => console.log("🟢 Ending ..."),
        //    { type: "spst.speak", params: { utterance: `Your appointment has been created!` } }
        //  ],
        //  on: { SPEAK_COMPLETE: "Done" },
        // },
 
    

       

    /* STATE */
    Done: {
      on: {
        CLICK: "Greeting",
      },
    },


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


// dmActor.subscribe((snapshot) => {
//   console.log("📌 State update:", snapshot.value);
//   console.log("🔹 Context:", snapshot.context);

//   if (snapshot.context.spstRef) {
//     const spstState = snapshot.context.spstRef.getSnapshot();
//     console.log("🗣️ SpeechState snapshot:", spstState.value);
//   }
// });

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
