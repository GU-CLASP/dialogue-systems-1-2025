const personGrammar: { [index: string]: string } = {
    vlad: "Vladislav Maraev",
    aya: "Nayat Astaiza Soriano",
    victoria: "Victoria Daniilidou",
    caroline: "Caroline Grand-Clement",
    matteo: "Matteo" ,
    roxana: "Roxana" ,
};

const dayGrammar: {[index: string]: string} = {
    monday: "Monday" ,
    tuesday: "Tuesday" ,
    wednesday: "Wednesday" ,
    thursday: "Thursday" ,
    friday: "Friday" ,
    saturday: "Saturday" ,
    sunday: "Sunday" ,
}

const timeGrammar: {[index: string]: string} = {
    "10": "10:00" ,
    "11": "11:00" ,
    "11:30": "11:30" ,
    "13": "13:00" ,
    "14": "14:00" ,
    "15:30": "15:30" ,
}

const yesNoGrammar = {
    "yes": ["yes", "of course", "sure", "yeah", "yep", "ok", "okay", "alright", "fine", "good", "great"],
    "no": ["no", "hell no", "no way", "nah", "nope", "negative", "not really", "not at all", "not sure"]
}

export function isInPerson(utterance: string) {
    return utterance.toLowerCase() in personGrammar;
}

export function getPerson(utterance: string) {
  return (personGrammar[utterance.toLowerCase()] || undefined);
}

export function isInDay(utterance: string) {
    return utterance.toLowerCase() in dayGrammar;
}

export function getDay(utterance: string) {
  return (dayGrammar[utterance.toLowerCase()] || undefined);
}

export function isInTime(utterance: string) {
    return utterance.toLowerCase() in timeGrammar;
}

export function getTime(utterance: string) {
  return (timeGrammar[utterance.toLowerCase()] || undefined);
}

export function isYes(utterance: string){
    return yesNoGrammar["yes"].includes(utterance.toLowerCase());
}

export function isNo(utterance: string) {
    return yesNoGrammar["no"].includes(utterance.toLowerCase());
}