// In this file are various utility functions.

import { Entity } from "./types"

// Search for entity of type entityType in the entityList, as given in interpretation.
// Returns: either the name of the entity or null, if it was not found.
export function getEntity(entityType: string, entityList : Entity[]){
  for (let e in entityList){
    if (entityList[e].category == entityType){
      return entityList[e].text.toLowerCase();
    }
  }
  return null;
}

export function randomize(objectList : any[]){
    return objectList[Math.floor(Math.random()*objectList.length)]
  }

export function randomizeAttributes(colors: string[], eyeColors: string[], accessories: string[]){
    const color : string = randomize(colors);
    const eyeColor : string = randomize(eyeColors);
    const accessory : string = randomize(accessories);
    return {"color": color, "eyeColor": eyeColor, "accessory": accessory};
  }