interface GrammarEntry {
    person?: string;
    day?: string;
    time?: string;
}

export const grammar: { [index: string]: GrammarEntry } = {
    vlad: { person: "Vladislav Maraev" },
    aya: { person: "Nayat Astaiza Soriano" },
    victoria: { person: "Victoria Daniilidou" },
    caroline: {person: "Caroline Grand-Clement"},
    matteo: { person: "Matteo" },
    roxana: { person: "Roxana" },
    monday: { day: "Monday" },
    tuesday: { day: "Tuesday" },
    wednesday: { day: "Wednesday" },
    thursday: { day: "Thursday" },
    friday: { day: "Friday" },
    saturday: { day: "Saturday" },
    sunday: { day: "Sunday" },
    "10": { time: "10:00" },
    "11": { time: "11:00" },
    "11 30": { time: "11:30" },
    "13": { time: "13:00" },
    "14": { time: "14:00" },
    "15 30": { time: "15:30" },
};

const yesNoGrammar = {
    "yes": ["yes", "of course", "sure", "yeah", "yep"],
    "no": ["no", "hell no", "no way", "nah"]
}

export function isInGrammar(utterance: string) {
    return utterance.toLowerCase() in grammar;
}

export function isYes(utterance: string){
    return utterance.toLowerCase() in yesNoGrammar["yes"];
}

export function isNo(utterance: string) {
    return utterance.toLowerCase() in yesNoGrammar["no"];
}