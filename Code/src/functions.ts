import { puzzle, clue } from "./types.ts"
import { discovered } from "./dm_project.ts"

export function detectedLanguage(entities: any) {
  return !!entities.find( (x: any) => x.category === "language")
}

export function getLanguage(entities: any) {
  let obj_lang = entities.find( (x: any)=> x.category === "language")
  let index_lang = entities.indexOf(obj_lang)
  return entities[index_lang].text.toLowerCase()
}

export function detectedLevel(entities: any) {
  return !!entities.find( (x: any)=> x.category === "level")
}

export function getLevel(entities: any) {
  let obj_level = entities.find( (x: any)=> x.category === "level")
  let index_level = entities.indexOf(obj_level)
  return entities[index_level].text.toLowerCase()
}

/* function below needed because can't find a way to access the entity list key from CLU */
export function getLevelAsNumber(level: string) {
  let levelAsNumber = undefined
  if (level === "0" || level === "zero" || level === "0th" || level === "zeroth" || level === "training" || level === "train") {
    levelAsNumber = 0
  }
  else if (level === "1" || level === "one" || level === "1st" || level === "first" || level === "beginner" || level === "beginners") {
    levelAsNumber = 1
  }
  else if (level === "2" || level === "two" || level === "2nd" || level === "second" || level === "advanced") {
    levelAsNumber = 2
  }
  return levelAsNumber
  }

export function detectedYes(entities: any) {
 return !!entities.find( (x: any)=> x.category === "yes")
}

export function detectedNo(entities: any) {
  return !!entities.find( (x: any)=> x.category === "no")
}

/* HTML code adapted from https://code2care.org/html/crossword-puzzle-pure-html-css-javascript/ */
export function initPuzzle(element: HTMLElement, words: puzzle){
  let lastColumns : number[] = []
  let lastRows : number[] = []
  let whites: string[] = []
  for (let word of Object.keys(words)) {
    if (words[word].across === true) {
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


export function selectWord(words: puzzle, wordToFind: string|null) {
  let filteredWords = Object.keys(words!).filter((word)=> !discovered[word])
  if (Object.keys(discovered).length < Object.keys(words!).length -1) {
    filteredWords = filteredWords.filter((word)=> !(word===wordToFind))
  }
  const i = Math.floor(Math.random()*filteredWords.length);
  return filteredWords[i];
}

export function StillConnectedWordsToDiscover(words: puzzle, word:string) {
  const connectedWords = Object.keys(words[word].connections)
  const ConnectedWordsToDiscover = connectedWords.filter((word)=> !discovered[word])
  return !!ConnectedWordsToDiscover.length
}

export function selectConnectedWord(words: puzzle, word: string) {
  const connectedWords = Object.keys(words[word].connections)
  const filteredConnectedWords = connectedWords.filter((word)=> !discovered[word])
  const i = Math.floor(Math.random()*filteredConnectedWords.length);
  return filteredConnectedWords[i]
}

export function anyClues(words: puzzle, word: string) {
  const connectedWords = Object.keys(words[word].connections)
  const discoveredConnectedWords = connectedWords.filter((word)=> discovered[word])
  return !!discoveredConnectedWords.length
}

export function getClues(words: puzzle, word:string) {
  const connectedWords = Object.keys(words[word].connections)
  const discoveredConnectedWords = connectedWords.filter((word) => discovered[word])
  const clues : clue[] = []
  for (let connectedWord of discoveredConnectedWords) {
    let thisclue: clue = {letter: words[connectedWord].connections[word].letter, position: words[connectedWord].connections[word].position}
    clues.push(thisclue)
  }
  return clues
}

export function sayClues(clues: clue[]) {
  clues.sort((a, b) => a.position - b.position);
  let utterance : string = ""
  for (let clue of clues) {
    let thisutterance: string  = `letter "${clue.letter}" in position ${clue.position}, `
    utterance += thisutterance
  }
  return utterance
}

export function getDefinition(words: puzzle, word: string, language: string) {
  let utterance : string = words[word].definition[language]
  return utterance
}

export function updateDiscovered(word: string) {
  discovered[word] = true
}

export function displayWord(words: puzzle, word:string) {
  let location: string = words[word].location
  let row: string = location.split(".")[0]
  let column: string = location.split(".")[1]
  let across: boolean = words[word].across
  let length : number = word.length
  if (across === true) {
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

export function highlightWord(words: puzzle, word: string) {
  let location: string = words[word].location
  let row: string = location.split(".")[0]
  let column: string = location.split(".")[1]
  let across: boolean = words[word].across
  let length : number = word.length
  if (across === true) {
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

export function clearHighlighting(words: puzzle, word: string | null) {
  if (word ===  null) {
  }
  else {
    let location: string = words[word!].location
    let row: string = location.split(".")[0]
    let column: string = location.split(".")[1]
    let across: boolean = words[word!].across
    let length : number = word!.length
    if (across === true) {
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

export function repeatAnswer(answer: string, language: string) {
  let utterance: string = answer
  if (language === "french") {
    utterance ='<lang xml:lang="fr-FR">' + utterance + '</lang>'
  }
  return utterance
}

/* function below needed to handle cases of mis-recognition by ASR
like numbers transcribed with numerical value instead of lexical value
or unpronounced letters in French or homophones...*/
export function IsCorrectAnswer(answer: string, wordToFind: string, language: string) {
  let isCorrect: boolean = false
  if (language === 'english') {
    if (answer === wordToFind) { isCorrect = true }
    else if ((answer === '100' && wordToFind === 'hundred') ||
            (answer === '4' && wordToFind === 'four') ||
            (answer === 'mass' && wordToFind === 'mas') ||
            (answer === 'steers' && wordToFind === 'steres') ||
            (answer === 'lay' && wordToFind === 'lei') ||
            ((answer === 'all-star' || answer === 'all star') && wordToFind === 'allstar') ||
            (answer === 'some' && wordToFind === 'sum') ||
            (answer === 'meade' && wordToFind === 'mead') ||
            (answer === 'tease' && wordToFind === 'tees') ||
            ((answer === 'brahm' || answer === 'brum') && wordToFind === 'bram') ||
            ((answer === 'dial' || answer === 'dyer') && wordToFind === 'dire') ||
            (answer === 'sere' && wordToFind === 'seer') ||
            (answer === 'oh' && wordToFind === 'owe') ||
            ((answer === 'dem' || answer === 'them') && wordToFind === 'dam')||
            ((answer === 'slurps' || answer === 'slaus') && wordToFind === 'slurs') ||
            (answer === 'rude' && wordToFind === 'rued') ||
            (answer === 'a mine' && wordToFind === 'amine') ||
            (answer === 'meet' && wordToFind === 'mete') ||
            (answer === 'able' && wordToFind === 'abel') ||
            (answer === 'dyer' && wordToFind === 'mete') ||
            (answer === "lp's" && wordToFind === 'lps')) { isCorrect = true }
  }
  else {
    if (answer === wordToFind) { isCorrect = true }
    else if ((answer === '9' && wordToFind === 'neuf') ||
            (answer === wordToFind + 's') ||
            (wordToFind === answer + 's') ||
            (answer === wordToFind + 'e') ||
            (wordToFind === answer + 'e') ||
            (answer === wordToFind + 'es') ||
            (wordToFind === answer + 'es') ||
            (answer === wordToFind + '\xA0?') ||
            (answer === wordToFind + 's\xA0?') ||
            (wordToFind + '\xA0?' === answer + 's\xA0?') ||
            (answer === 'toi\xA0?' && wordToFind === 'toit') ||
            (answer === 'en fumée' && wordToFind === 'enfumer') ||
            (answer === 'ignore' && wordToFind === 'ignée') ||
            (answer === 'attelle' && wordToFind === 'atèle') ||
            (answer === 'nez' && wordToFind === 'née') ||
            (answer === 'emery' && wordToFind === 'emeri') ||
            (answer === "l'eau" && wordToFind === 'lot') ||
            ((answer === "et" || answer === 'hé') && wordToFind === 'es') ||
            (answer === "lit" && wordToFind === 'lee') ||
            (answer === "anneto" && wordToFind === 'aneto') ||
            (answer === "aigu" && wordToFind === 'écu') ||
            (answer.slice(-2) === 'er' && wordToFind === answer.slice(0,-2) + 'é') ||
            (answer.slice(-2) === 'er' && wordToFind === answer.slice(0,-2) + 'és') ||
            (answer.slice(-2) === 'er' && wordToFind === answer.slice(0,-2) + 'ée') ||
            (answer.slice(-2) === 'er' && wordToFind === answer.slice(0,-2) + 'ées') ||
            (wordToFind.slice(-2) === 'er' && answer === wordToFind.slice(0,-2) + 'é') ||
            (wordToFind.slice(-2) === 'er' && answer === wordToFind.slice(0,-2) + 'és') ||
            (wordToFind.slice(-2) === 'er' && answer === wordToFind.slice(0,-2) + 'ée') ||
            (wordToFind.slice(-2) === 'er' && answer === wordToFind.slice(0,-2) + 'ées') )
            { isCorrect = true }
  }
  return isCorrect
}

export function getHelp(word: string, words: puzzle, clues: clue[])  {
  let allPositions : number[] = []
  let location: string = words[word].location
  let length : number = word.length
  for (let step = 0; step < length; step++) {
      let letterPosition: number = 1 + step
      allPositions.push(letterPosition)
  }
  let unknownPositions: number[] = allPositions
  if (clues.length !== 0) {
    let knownPositions : number[] = []
    for (let clue of clues) {
      knownPositions.push(clue.position)
    }
    unknownPositions = allPositions.filter(x => !knownPositions.includes(x))
  }
  const i = Math.floor(Math.random()*unknownPositions.length);
  let randomPosition = unknownPositions[i]
  let randomLetter = word[randomPosition-1].toUpperCase()
  let help: clue = {letter: randomLetter, position: randomPosition}
  return help
}
