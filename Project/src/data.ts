// In this file is the names of people, images, places, etc.

interface imageSource {
    source?: string | null;
  }
  
export const imageSources: { [index: string]: imageSource} = {
    "menu": {source: "./menu.png"},
    "the market square": {source: "./square.png"},
    "the main street": {source: "./street.png"},
    "a park": {source: "./park.png"},
    "the forest": {source: "./forest.png"},
    "the shopping district": {source: "./shopping_district.png"},
    "the beach": {source: "./beach.png"},
    "the train station": {source: "./train_station.png"},
    "the canal": {source: "./canal.png"},
    "davis": {source: "./davis.png"},
    "andrew": {source: "./andrew.png"},
    "brandon": {source: "./brandon.png"},
    "emma": {source: "./emma.png"},
    "jane": {source: "./jane.png"},
    "ashley": {source: "./ashley.png"},
    none: {source: "./empty.png"},
    "green": {source: "./green_eyes.png"},
    "yellow": {source: "./yellow_eyes.png"},
    "blue": {source: "./blue_eyes.png"},
    "black": {source: "./black_cat.png"},
    "white": {source: "./white_cat.png"},
    "grey": {source: "./grey_cat.png"},
    "orange": {source: "./orange_cat.png"},
    "bow tie": {source: "./bow_tie.png"},
    "scarf": {source: "./scarf.png"},
    "vest": {source: "./vest.png"},
  }


export const catColors : string[] = ['black','white','orange','grey'];
export const catEyeColors : string[] = ['green','yellow','blue'];
export const catAccessories : string[] = ['scarf','bow tie','vest'];

export const personNames : string[] = ["davis","andrew","brandon","emma","jane","ashley"];

export const voiceNames : { [id: string] : string; }= {'davis':"en-US-DavisNeural", 'andrew':"en-US-AndrewMultilingualNeural",'brandon':"en-US-BrandonNeural", 'emma':"en-US-EmmaMultilingualNeural", 'jane':"en-US-JaneNeural", 'ashley':"en-US-AshleyNeural"}

export const greetings : string[] = [
    'Hi! How ya doin\'?',
    'Greetings traveler. What brings you here?',
    'Good day to you. Nice weather today, isn\'t it?',
    'Hi there.',
    'Need something?',
    'Hello.',
    'Cheers mate.'
  ];

export const intentAskings : string[] = [
    "Need something?",
    "What's on your mind?",
    "Are you looking for something?",
  ];

export const catAskings : string[] = [
    "I might have seen one. What does it look like?",
    "I think I saw one walking by just now. What kind of cat do you have?",
    "Yes, I definitely saw a cat recently, maybe it was yours. What does it look like?"
]

export const confirmations : string[] = [
    "Oh, yes.",
    "Ah!",
    "That rings a bell.",
]

export const goodByes : string[] = [
    "Good luck out there!",
    "Be seeing you.",
    "Bye bye!",
    "See you later.",
    "Fare well",
    "Good bye!"
  ];

export const roomNamesAndPrepositions : Set<[string, string]> = new Set([["the market square", "on"], ["the main street", "on"], ["a park", "in"], ["the forest", "in"], ["the shopping district", "in"], ["the canal", "by"], ["the train station", "at"], ["the beach", "on"]]);