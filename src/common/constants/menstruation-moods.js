export default Object.freeze({
  FERTILITY: "Today is your fertilization day, on this day you have high probability of pregnancy during sexual intercourse.",
  OVULATION: "Today is your ovulation day, on this day you have high probability of pregnancy during sexual intercourse.",
  NONE: "Today is your normal day of menstrual cycle, on this day you have low probability of pregnancy during sexual intercourse",
  MENSTRUATION: (num) => {
    let day 

    if (num === 1) day = "first"
    if (num === 2) day = "second"
    if (num === 3) day = "third"
    if (num === 4) day = "fourth"
    if (num === 5) day = "fifth"
    if (num === 6) day = "sixth"
    if (num === 7) day = "seventh"

    return `Today is your ${day} day of your menstruation cycle, on this day you have low probability of pregnancy during sexual intercourse.`
  }
})
