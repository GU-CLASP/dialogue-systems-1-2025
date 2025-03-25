// This file handles the generation of the world prior to the game starting

import { randomize } from "./utils";
import { room } from "./types"

const opposites = {
    'n':'s',
    's':'n',
    'w':'e',
    'e':'w'
}

const dirToCoord : {[index : string] : [number,number]} = {
    'n':[0,1],
    's':[0,-1],
    'e':[1,0],
    'w':[-1,0]
}

// Function to generate the rooms of the game
export function randomizeRooms(roomNamesAndPrepositions : Set<[string, string]>) {
    const N : number = roomNamesAndPrepositions.size
    let roomNameAndPreposition = randomize(Array.from(roomNamesAndPrepositions))
    let roomName = roomNameAndPreposition[0]
    let roomPreposition = roomNameAndPreposition[1]
    roomNamesAndPrepositions.delete(roomNameAndPreposition)
    let rooms : room[] = [{idx : 0, name : roomName, preposition: roomPreposition, coord : [0,0], n:-1,s:-1,e:-1,w:-1,catDirection:null, person:null}];
    let n = 1;
    let index : number = 0;
    let cur = rooms[index];
    while (n < N){
        index = Math.floor(Math.random()*n)
        console.log(index)
        cur = rooms[index]
        let available : string[] = [];
        if (cur.n == -1){
        available.push('n');
        }
        if (cur.s == -1){
        available.push('s');
        }
        if (cur.w == -1){
        available.push('w');
        }
        if (cur.e == -1){
        available.push('e');
        }
        if (available.length == 0){
            continue;
        }
        let dir : string = randomize(available);
        let step : [number, number] = dirToCoord[dir];
        let coord : [number, number] = [cur.coord[0] + step[0], cur.coord[1] + step[1]];
        let newroom : room;
        let isNew : Boolean;
        let existingRoom : room | undefined = rooms.find(room => {return room.coord[0] === coord[0] && room.coord[1] === coord[1]})
        
        if (existingRoom != undefined){
            newroom = existingRoom;
            console.log(`Found room ${newroom.name}`)
            isNew = false;
        }
        else{
            console.log(`New room ${n}`)
            let roomNameAndPreposition = randomize(Array.from(roomNamesAndPrepositions))
            let roomName = roomNameAndPreposition[0]
            let roomPreposition = roomNameAndPreposition[1]
            roomNamesAndPrepositions.delete(roomNameAndPreposition)
            newroom = {idx: n, name: roomName, preposition: roomPreposition, coord : coord, n:-1,s:-1,e:-1,w:-1,catDirection:null, person:null};
            isNew = true;
        }
        if (dir=='n'){
            cur.n = newroom.idx
            newroom.s = index
        }
        else if (dir=='s'){
            cur.s = newroom.idx
            newroom.n = index
        }
        else if (dir=='w'){
            cur.w = newroom.idx
            newroom.e = index
        }
        else if (dir=='e'){
            cur.e = newroom.idx
            newroom.w = index
        }
        if (isNew){
            rooms.push(newroom)
            n++;
        }
    }
    return rooms;
}

// Function to generate the path which the cat takes
export function generatePath(rooms : room[], maxLength : number){
    let index : number = 0;
    let cur : room = rooms[index];
    let visited : Set<number> = new Set();
    visited.add(index);
    let path : number[] = [index];
    let l : number = Math.min(maxLength, rooms.length)
    while (path.length < maxLength){
        let possibleNext : [string, number][] = [];
        if (cur.n != -1 && ! visited.has(cur.n)){
        possibleNext.push(['n', cur.n])
        }
        if (cur.s != -1 && ! visited.has(cur.s)){
        possibleNext.push(['s', cur.s])
        }
        if (cur.w != -1 && ! visited.has(cur.w)){
        possibleNext.push(['w', cur.w])
        }
        if (cur.e != -1 && ! visited.has(cur.e)){
        possibleNext.push(['e', cur.e])
        }
        if (possibleNext.length == 0){
            // Done
            cur.catDirection = 'here';
            break;
        }
        let next : [string, number] = randomize(possibleNext);
        index = next[1];
        cur.catDirection = next[0];
        cur = rooms[index];
        path.push(index)
        visited.add(index)
    }
    cur.catDirection = 'here';
    return path;
}

// Functions to put the persons in the room
export function putPersons(rooms : room[], names:string[], maxPersons:number){
    const N : number = Math.min(names.length, rooms.length, maxPersons)
    let n : number = 0;
    let namesSet : Set<string> = new Set(names);
    while (n < N){
        let choice : room = randomize(rooms)
        if (!choice.person){
            let newName = randomize(Array.from(namesSet))
            choice.person = newName;
            namesSet.delete(newName);
            n++;
        }
    }
}