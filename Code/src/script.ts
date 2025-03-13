 // Step1AskPerson: {
    //   // entry: ({context, event}) => console.log("dfdsfdfdsfsd", context, event),
    //   entry: ({ context, event }) => {
    //     console.log("dfdsfdfdsfsd");  
    //     console.log("Context:", context);  
    //     console.log("Event:", event);
    //   },
    //   initial: "Greeting",
    //   on: {
    //     LISTEN_COMPLETE: [
    //       {
    //         target: "Step5AppointmentCreated",
    //         guard: ({ context }) => !!context.utterance, 
    //         // guard: ({ context }) => !!context.lastResult && context.utterance === "person", 
    //       },
    //       { target: ".NoInput" },
    //     ],
    //   },
    //   states: {
    //     // start the conversation
    //     Greeting: {
    //       entry: { type: "spst.speak", params: { utterance: "Now, let us set up a meeting with the people you would like to include! " } },
    //       on: { SPEAK_COMPLETE: "AskPerson" },
    //     },
    //     AskPerson: {
    //       entry: { type: "spst.speak", params: { utterance: `Please say 'Set up a meeting', then plus the person's name that you want to include! ` } },
    //       on: { SPEAK_COMPLETE: "Ask" },
    //     },
    //     NoInput: {
    //       entry: {
    //         type: "spst.speak",
    //         params: { utterance: `I can't hear you! Please say 'Set up a meeting', then plus the person's name that you want to include!` },
    //       },
    //       on: { SPEAK_COMPLETE: "Ask" },
    //     },
    //     Ask: {
    //       entry: { type: "spst.listen" },
    //       on: {
    //         RECOGNISED: {
    //           actions: [
    //             // 1. Log event.nluValue
    //             ({ event }) => {
    //               console.log("NLU Value:", event.nluValue);
    //               console.log("Event Value:", event.value);
    //             },
          
    //             // 2. Assign event.nluValue.topIntent to context.lastResult
    //             assign({
    //               // lastResult: ({ event }) => event.nluValue?.entities || [],
    //               // utterance: ({ event }) => event.nluValue.entities[0].text.toLowerCase(),
    //               utterance: ({ event }) => getEntityText(event.nluValue.entities, "people"),
                  
    //             }),
                        
    //             // 3. Log the updated context.lastResult and its type
    //             ({ context }) => {
    //               // console.log("Updated Context.lastResult:", context.lastResult);
    //               // console.log("Type of Context.lastResult:", typeof context.lastResult);
    //               console.log("Updated Context.utterance:", context.utterance);
    //             },
    //           ],
    //         },
    //         ASR_NOINPUT: {
    //           actions: assign({ utterance: null }),
    //         },
    //       },
    //     },
    //   },
    // },
