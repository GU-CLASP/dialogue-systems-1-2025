// Q1, RUN IN BROWSER
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}
  
num = getRandomInt(1, 11);
guess = prompt("Guess a number between 1 and 10: ", -1);
if (num == guess) {
    alert("Good work!");
} else {
    alert("Not matched :( The number was " + num);
}


// Q2 check if 50
function check50 (firstVar, secondVar){
    var firstNum = typeof(firstVar) == "string" ? parseInt(firstVar, 10): firstVar;
    var secondNum = typeof(secondVar) == "string" ? parseInt(secondVar, 10): secondVar;
    if (firstNum == 50 || secondNum == 50 || firstNum + secondNum == 50){
        return true;
    } else {
        return false;
    }
}

console.log(check50(10, 40));
console.log(check50(10, 2));
console.log(check50("10", 40));


// Q3 check paula
function checkIfName(query, names){
    for (const name of names){
        if (query.toLowerCase() == name.toLowerCase()){
            return true;
        }
    }
    return false;
}

function findNameIndex(query, names){
    for (let i = 0; i < names.length; i++){
        if (query.toLowerCase() == names[i].toLowerCase()){
            return i;
        }
    }
}

const names = ["Anna", "Johannes", "Paula", "Daisy"];
console.log(checkIfName("PAULA", names));
console.log(findNameIndex("paula", names));


// Q4 word creation
function makeMoreWord(word){
    if (word.length < 3){
        return "Not enough letters!";
    } else {
        const lastLetters = word.substr(-3, 3);
        const newWord = lastLetters + word + lastLetters;
        return newWord;
    }
}

console.log(makeMoreWord("umbrella"));
console.log(makeMoreWord("cap"));
console.log(makeMoreWord("no"));


// Q5 names and lengths
function getNameLengths(names){
    var nameLengths = [];
    for (const name of names){
        var nameLength = name + " " + 2 * name.length;
        nameLengths.push(nameLength);
    }
    return nameLengths;
}

console.log(getNameLengths(names));


// Q6 zoos
let zooAnimals = {
    "giraffe": { "weight": 910, "origin": "Tanzania" },
    "lion": { "weight": 200, "origin": "Tanzania" },
    "elephant": { "weight": 5000, "origin": "India" },
    "penguin": { "weight": 30, "origin": "Argentina" },
    "koala": { "weight": 10, "origin": "Australia" },
  };

// How would you check if an animal exists in the object?
console.log("giraffe" in zooAnimals);


// How would you check if an animal with a specific weight or a specific origin exists in the object?
function checkSpecificAnimal(animals, queryAnimal, queryType, queryValue){
    if (queryAnimal in animals){
        if (animals[queryAnimal][queryType] == queryValue){
            return true;
        } else {
            return false;
        }
    } else { 
        return false;
    }
}

console.log(checkSpecificAnimal(zooAnimals, "giraffe", "origin", "Finland"));
console.log(checkSpecificAnimal(zooAnimals, "giraffe", "weight", 910));

// How would you add a new animal?
zooAnimals["cat"] = { "weight": 5, "origin": "Sweden" };

// Create an object method named "about" which generates text about specified animal, e.g. zooAnimals.about("giraffe") 
// -> "giraffe weights 910 kg and comes from Tanzania". If the animal is not in the zoo, return "we don't have this animal".
zooAnimals["about"] = function(name) {
    return name + " weighs " + this[name]["weight"] + "kg and comes from " + this[name]["origin"]; 
};

console.log(zooAnimals.about("giraffe"));