function getRandomInt(min : number, max : number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function makeGuess(input: HTMLInputElement, output: HTMLParagraphElement){
    var num = getRandomInt(1, 11).toString();
    if (input.value == ""){
        output.textContent = "Make a guess!"
    } else if (num == input.value) {
        output.textContent = "Good work!";
    } else {
        output.textContent = "Not matched :( The number was " + num + ".";
    }
}

export function setGuess(input: HTMLInputElement, output: HTMLParagraphElement, submitButton: HTMLButtonElement) {
    submitButton.addEventListener('click', () => makeGuess(input, output))
}