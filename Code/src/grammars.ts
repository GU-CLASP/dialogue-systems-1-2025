const celebrityGrammar: {[index: string]: string} = {
    "megan rapinoe": "Megan Anna Rapinoe (born July 5, 1985) is an American former professional soccer player who played as a winger.",
    "frida kahlo": "Magdalena Carmen Frida Kahlo y Calderón (6 July 1907 - 13 July 1954) was a Mexican painter known for her many portraits, self-portraits, and works inspired by the nature and artifacts of Mexico",
    "emma watson": "Emma Charlotte Duerre Watson (born 15 April 1990) is an English actress",
    "topaz winters": "Winters was born in the United States and grew up in Singapore from the time she was seven. She graduated from Princeton University in 2023 with a B.A. in English and certificates in Creative Writing, Visual Art, and Italian.",
    "rachel corrie": "Rachel Aliene Corrie (April 10, 1979 - March 16, 2003) was an American nonviolence activist and diarist. She was a member of the pro-Palestinian International Solidarity Movement and was active throughout the Israeli-occupied Palestinian territories",
    "cat burns": "Catrina Burns-Temison (born 6 June 2000), known professionally as Cat Burns, is a British-Liberian singer-songwriter who gained prominence with her 2020 single 'Go'",
    "sappho": "Sappho (c. 630 - c. 570 BC) was an Archaic Greek poet from Eresos or Mytilene on the island of Lesbos. Sappho is known for her lyric poetry, written to be sung while accompanied by music.",
    "olivia rodrigo":"Olivia Isabel Rodrigo (born February 20, 2003) is an American singer-songwriter and actress",
    "ruby rose":"Ruby Rose Langenheim (born 20 March 1986) is an Australian actress, television presenter, and model.",
    "imane khelif":"Imane Khelif (born 2 May 1999) is an Algerian professional boxer. She won the gold medal in the women's 66 kg (welterweight) boxing event at the 2024 Summer Olympics.",
}

export function getCelebrityInfo(celebrity : string | null | undefined){
    if (typeof(celebrity) == "string"){
        return (celebrityGrammar[celebrity.toLowerCase()] || "We do not have info on this celebrity.")
    } else {
        console.log(celebrity)
        return "We cannot find which celebrity you are talking about."
    }
}


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