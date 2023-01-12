import generateRandomAnimalName from "random-animal-name-generator"

export function generateUsername() {
  const name = generateRandomAnimalName()
  return name
}
