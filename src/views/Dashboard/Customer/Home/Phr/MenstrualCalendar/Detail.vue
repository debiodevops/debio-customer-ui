<template lang="pug">
  .menstrual-calendar-detail
    .menstrual-calendar-detail__wrapper
      MenstrualCalendarBanner
      ui-debio-modal(
        :show="showStart"
        :show-title="false"
        :show-cta="false"
        disable-dismiss
      )
        .menstrual-calendar-detail__modal-title Your menstrual calendar has been set!
        v-img(
          block
          alt="no-list-data"
          src="@/assets/menstrual-calendar-dialog.svg"
          height="160px"
        )

        .menstrual-calendar-detail__modal-desc Choose date to perform action, select preffered action in the right of the calendar
        ui-debio-button(
          color="secondary"
          width="336px"
          style="font-size: 14px;"
          @click="showStart = false"
        ) Start Action

      .menstrual-calendar-detail__details
        ui-debio-card(width="740")
          .menstrual-calendar-detail__head-text
            .menstrual-calendar-detail__head-text-column
              span.menstrual-calendar-detail__head-text-primary My Menstrual Calendar
              span.menstrual-calendar-detail__head-text-secondary Choose date to perform action
            .menstrual-calendar-detail__head-info-column
              a.menstrual-calendar-detail__head-text-link
                span View statistics
                v-icon(small color="rgba(86, 64, 165, 1)") mdi-open-in-new
              span.menstrual-calendar-detail__head-text-reminder
                v-icon(small color="rgba(255, 143, 143, 1)") mdi-clock-outline 
                span Your subscription will end in {{ reminder }}

          v-divider.menstrual-calendar-detail__divider

          .menstrual-calendar-detail__options
            .menstrual-calendar-detail__month
              v-btn( 
                fab
                text
                small
                color="grey darken-2"
                @click="prev"
              )
                v-icon(small) mdi-chevron-left
              span {{ selectedMonthText }}

              v-btn( 
                fab
                text
                small
                color="grey darken-2"
                @click="next"
              )
                v-icon(small) mdi-chevron-right

            span.menstrual-calendar-detail__year {{ selectedYear }}

          Calendar.menstrual-calendar-detail__calendar(
            :year="selectedYear" 
            :month="selectedMonth"
            :isLoading="submitPreview"
            v-model="selectedDates"
            :menstrualData="menstrualCalendarData"
          )

          .menstrual-calendar-detail__icons
            .menstrual-calendar-detail__icon(v-for="description in descriptions")
              v-img(
                :alt="description.toLowerCase()"
                :src="require(`../../../../../../assets/${description.toLowerCase()}.svg`)"
                max-width="16px"
                max-height="16px"
              )
              span {{ description}}

          .menstrual-calendar-detail__note
            .menstrual-calendar-detail__note-text Note
            span.menstrual-calendar-detail__note-desc your previous menstrual cycle does not guarantee your future menstrual cycle medically or diagnostically


        .menstrual-calendar-detail__menu
          ui-debio-card.menstrual-calendar-detail__summary(width="394")
            .menstrual-calendar-detail__summary-header
              v-img.menstrual-calendar-detail__summary-img(
                alt="no-list-data"
                src="@/assets/calendar.svg"
                max-width="44px"
                max-height="44px"
              )
              .menstrual-calendar-detail__summary-text
                .menstrual-calendar-detail__summary-title Summary
                .menstrual-calendar-detail__summary-desc Today Overview

          ui-debio-card(width="394")
            .menstrual-calendar-detail__text {{ getSummary() }}


          ui-debio-card.menstrual-calendar-detail__setting(width="394")
            .menstrual-calendar-detail__summary-header
              v-img.menstrual-calendar-detail__summary-img(
                alt="no-list-data"
                src="@/assets/drink-coffee.svg"
                max-width="44px"
                max-height="44px"
              )

              .menstrual-calendar-detail__setting-text
                .menstrual-calendar-detail__summary-title What is happening today ?
                .menstrual-calendar-detail__summary-desc you can choose more than 1 emoticon

            v-divider.menstrual-calendar-detail__navigation

            ui-debio-button.menstrual-calendar-detail__button(
              color="#F3F3F3" 
              height="48"
              width="100%"
              @click="toMenstrualCalendarExpress()"
            ) 
              .menstrual-calendar-detail__button-text Express yourself
              v-icon mdi-chevron-right

          ui-debio-card.menstrual-calendar-detail__setting(width="394")
            .menstrual-calendar-detail__summary-header
              v-img.menstrual-calendar-detail__summary-img(
                alt="no-list-data"
                src="@/assets/calendar.svg"
                max-width="44px"
                max-height="44px"
              )

              .menstrual-calendar-detail__setting-text
                .menstrual-calendar-detail__summary-title Menstrual Calendar Settings
                .menstrual-calendar-detail__summary-desc Update menstruation day and subscription

            v-divider.menstrual-calendar-detail__navigation

            ui-debio-button.menstrual-calendar-detail__button(
              color="#F3F3F3" 
              height="48"
              width="100%"
              @click="toMenstrualSelectionUpdate()"
            ) 
              .menstrual-calendar-detail__button-text Update Menstruation Day
              v-icon mdi-chevron-right

            ui-debio-button.menstrual-calendar-detail__button(
              color="#F3F3F3" 
              height="48"
              width="100%"
              @click="toSubscriptionSetting()"
            ) 
              .menstrual-calendar-detail__button-text Subscription Settings

              v-icon mdi-chevron-right

            ui-debio-button.menstrual-calendar-detail__button(
              color="#F3F3F3" 
              height="48"
              width="100%"
              disabled
            ) 
              .menstrual-calendar-detail__button-text Journaling
              v-alert.menstrual-calendar-detail__alert(color="#FFE6E6" )
                .menstrual-calendar-detail__alert-text Coming Soon

              v-icon mdi-chevron-right
</template>

<script>

import emojis from "@/common/constants/menstrual-symptoms-emoji"
import moods from "@/common/constants/menstruation-moods"
import MenstrualCalendarBanner from "./Banner.vue"
import Calendar from "@/common/components/Calendar"
import { mapState } from "vuex"
import { getLastMenstrualCalendarByOwner, getMenstrualCalendarById, getLastMenstrualCalendarCycleLogByOwner, getMenstrualCycleLog } from "@/common/lib/polkadot-provider/query/menstrual-calendar"
import { getActiveSubscriptionByOwner, getMenstrualSubscriptionById } from "@/common/lib/polkadot-provider/query/menstrual-subscription"

export default {
  name: "MenstrualCalendarDetail",

  data: () => ({
    emojis,
    moods,
    selectedMonthText: "",
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    selectedDates: null,
    submitEnabled: false,
    submitPreview: false,
    selectAverage: true,
    showStart: false,
    averageCycle: 0,
    monthList: [
      { value: 0, text: "January" },
      { value: 1, text: "February" },
      { value: 2, text: "March" },
      { value: 3, text: "April" },
      { value: 4, text: "May" },
      { value: 5, text: "June" },
      { value: 6, text: "July" },
      { value: 7, text: "August" },
      { value: 8, text: "September" },
      { value: 9, text: "October" },
      { value: 10, text: "November" },
      { value: 11, text: "December" }
    ],
    menstrualCalendarData: null,
    menstruationPeriodeIndex: [],
    todaySum: null,

    days: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    descriptions: ["Today", "Menstruation", "Prediction", "Fertility", "Ovulation"],
    durationSubscription: {
      "Monthly": 30 * 24 * 60 * 60 * 1000,
      "Quarterly": 3 * 30 * 24 * 60 * 60 * 1000,
      "Yearly": 12 * 30 * 24 * 60 * 60 * 1000
    },
    reminder: ""
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet
    })
  },

  watch: {
    async selectedMonthText(newMonth) {
      this.submitPreview = true
      this.menstruationPeriodeIndex = []
      this.selectedMonth = this.monthList.find((value) => value.text === newMonth).value
      await this.getMenstruationCalendarData()
      this.submitPreview = false
    },

    selectedDates(newSelected) {
      this.submitEnabled = newSelected !== null && newSelected.length > 0
    }
  },

  methods: {
    prev() {
      if (this.selectedMonth > 0) {
        this.selectedMonth--
      } else {
        this.selectedMonth = 11
        this.selectedYear--
      }
      this.selectedMonthText = this.monthList[this.selectedMonth].text
    },

    next() {
      if (this.selectedMonth < 11) {
        this.selectedMonth++
      } else {
        this.selectedMonth = 0
        this.selectedYear++
      }
      this.selectedMonthText = this.monthList[this.selectedMonth].text
    },

    getSummary() {
      if (this.todaySum.menstruation) return moods.MENSTRUATION(this.todaySum.days)
      if (this.todaySum.ovulation) return moods.OVULATION
      if (this.todaySum.fertility) return moods.FERTILITY
      return moods.NONE
    },

    async getMenstruationCalendarData() {
      this.submitPreview = true
      try {
        const menstrualCalendar = await getLastMenstrualCalendarByOwner(this.api, this.wallet.address)
        const data = await getMenstrualCalendarById(this.api, menstrualCalendar[0])
        const today = new Date()
        const firstDateCurrentMonth = new Date(this.selectedYear, this.selectedMonth, 1)
        const firstDateNextMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0)

        const dayFirstDateCurrentMonth = firstDateCurrentMonth.getDay() === 0 ? 6 : firstDateCurrentMonth.getDay() - 1
        const dayFirstDateNextMonth = firstDateNextMonth.getDay() === 0 ? 6 : firstDateNextMonth.getDay() - 1

        const startDate = new Date(this.selectedYear, this.selectedMonth, -(dayFirstDateCurrentMonth - 1))
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, (6 - dayFirstDateNextMonth))
        const menstrualCalendarData = {
          addressId: data.addressId,
          averageCycle: data.averageCycle,
          cycleLog: []
        }

        let date = startDate
        let indexDate = 0
        this.menstruationPeriodeIndex = []

        const menstrualCycleLogByOwner = await getLastMenstrualCalendarCycleLogByOwner(this.api, menstrualCalendar[menstrualCalendar.length - 1])
        const cycle = []

        for (let i = 0; i < menstrualCycleLogByOwner.length; i++) {
          const cycleLogData = await getMenstrualCycleLog(this.api, menstrualCycleLogByOwner[i])
          cycle.push(cycleLogData)
        }

        cycle.sort((a, b) => parseInt(a.date.replaceAll(",", "")) - parseInt(b.date.replaceAll(",", "")))

        let temp = []
        for (let i = 0; i < cycle.length; i++) {
          const date = Number(cycle[i].date.replaceAll(",", ""))
          const day = new Date(date).getDate()
          const yesterday = i !== 0 ? Number(cycle[i - 1].date.replaceAll(",", "")) : null

          if (cycle[i].menstruation) {
            if (i === 0) {
              temp.push(cycle[i])
            } else if (new Date(yesterday).getDate() !== day - 1) {
              temp.push(cycle[i])
            }
          }
        }

        const lastMens = temp[temp.length - 1]

        let firstDayOfLastPeriod
        let lastMonthPrediction = []
        let lastMonthFertility = []
        let lastMonthOvulation = []

        // define cycle when first day of menstruation is in the middle - end of month

        if (lastMens) {
          firstDayOfLastPeriod = new Date(Number(lastMens.date.replaceAll(",", "")))
          for (let pointer = 0; pointer < 17; pointer++) { // loop up to 16 as the longest date for fertility

            // calculate prediction days (5 days)
            if (pointer < 5) {
              lastMonthPrediction.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + Number(data.averageCycle) + pointer))

              // calculate 2nd prediction
              if (pointer === 0) {
                lastMonthPrediction.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + Number(data.averageCycle) + pointer))
              } else {
                lastMonthPrediction.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + Number(data.averageCycle)))
              }

              // calculate 3rd prediction

              if (pointer === 0) {
                lastMonthPrediction.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + Number(data.averageCycle) + pointer))
              } else {
                lastMonthPrediction.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + Number(data.averageCycle)))
              }

              firstDayOfLastPeriod = new Date(Number(lastMens.date.replaceAll(",", "")))
            }


            const lastPeriod = temp.find(t => new Date(Number(t.date.replaceAll(",", ""))).getMonth() === this.selectedMonth - 1)

            // calculate fertility days (9 dayas)
            if (pointer > 8) {
              if (lastPeriod) { // if calculation of last cycle fertility is on current month
                lastMonthFertility.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + pointer))
                firstDayOfLastPeriod = new Date(Number(lastPeriod.date.replaceAll(",", "")))
              }
              lastMonthFertility.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + pointer))
              firstDayOfLastPeriod = new Date(Number(lastMens.date.replaceAll(",", "")))
            }

            // calculate ovulation days (3 days)
            if (pointer > 12 && pointer < 16) {
              if (lastPeriod) { // if calculation of last cycle fertility is on current month
                lastMonthOvulation.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + pointer))
                firstDayOfLastPeriod = new Date(Number(lastPeriod.date.replaceAll(",", "")))
              }
              lastMonthOvulation.push(firstDayOfLastPeriod.setDate(firstDayOfLastPeriod.getDate() + pointer))
              firstDayOfLastPeriod = new Date(Number(lastMens.date.replaceAll(",", "")))
            }
          }
        }

        // define cycle when first day of menstruation is in the beginning of month

        while (date.getTime() < endDate.getTime()) {
          date = new Date(this.selectedYear, this.selectedMonth, (-(dayFirstDateCurrentMonth - 1) + indexDate))
          const log = cycle.filter(log => Number(log.date.replaceAll(",", "")) === date.getTime())
          const menstruation = log[0]

          const symptoms = menstruation ? menstruation.symptoms : []

          if (menstruation?.menstruation) this.menstruationPeriodeIndex.push(indexDate)

          let currentData = {
            date: date.getTime(),
            menstruation: log.length && menstruation.menstruation ? 1 : 0,
            prediction: lastMonthPrediction.find(pred => pred === date.getTime()) || (indexDate >= this.menstruationPeriodeIndex[0] + Number(data.averageCycle) && indexDate < this.menstruationPeriodeIndex[0] + Number(data.averageCycle) + 5) ? 1 : 0,
            fertility: lastMonthFertility.find(pred => pred === date.getTime()) || indexDate >= this.menstruationPeriodeIndex[0] + 8 && indexDate <= this.menstruationPeriodeIndex[0] + 16 ? 1 : 0,
            ovulation: lastMonthOvulation.find(pred => pred === date.getTime()) || indexDate >= this.menstruationPeriodeIndex[0] + 13 && indexDate <= this.menstruationPeriodeIndex[0] + 15 ? 1 : 0,
            symptoms: symptoms
          }

          menstrualCalendarData.cycleLog.push(currentData)

          if (today.getDate() === date.getDate()) {
            this.todaySum = currentData
            this.menstruationPeriodeIndex.map((num, i) => {
              this.todaySum.index = num
              this.todaySum.days = i
            })

          }
          indexDate++
        }
        this.menstrualCalendarData = menstrualCalendarData
      } catch (err) {
        console.log(err.message)
      }
      this.submitPreview = false
    },

    toSubscriptionSetting() {
      this.$router.push({ name: "menstrual-calendar-subscription-setting" })
    },

    toMenstrualSelectionUpdate() {
      this.$router.push({ name: "menstrual-calendar-selection-update" })
    },

    toMenstrualCalendarExpress() {
      this.$router.push({ name: "menstrual-calendar-select-emoji" })
    },

    async getActiveSubscription() {
      const activeSubs = await getActiveSubscriptionByOwner(this.api, this.wallet.address)
      const subscriptionDetail = await getMenstrualSubscriptionById(this.api, activeSubs)

      // get current date
      let currentDate = new Date().getTime()

      // date subscription
      const date = subscriptionDetail.updatedAt === "0" ? Number(subscriptionDetail.createdAt.split(",").join("")) : Number(subscriptionDetail.updatedAt.split(",").join(""))
      const endDateSubscription = date + this.durationSubscription[subscriptionDetail.duration]

      const reminder = Math.ceil((endDateSubscription - currentDate) / (24 * 60 * 60 * 1000))
      if (reminder <= 30) {
        this.reminder = reminder === 1 ? `${reminder} Day` : `${reminder} Days`
      } else if (reminder < 365) {
        const month = Math.floor(reminder / 30)
        const days = reminder % 30
        if (days > 0) {
          this.reminder = `${month} ${month === 1 ? "Month" : "Months"} ${days} ${days === 1 ? "Day" : "Days"}`
        } else {
          this.reminder = `${month} ${month === 1 ? "Month" : "Months"}`
        }
      } else {
        const year = Math.floor(reminder / 365)

        this.reminder = `${year} ${year === 1 ? "Year" : "Years"}`
      }
    }
  },

  async created() {
    const today = new Date()
    this.selectedMonthText = this.monthList[today.getMonth()].text
    this.currentYear = today.getFullYear().toString()

    this.getActiveSubscription()
  },

  components: {
    MenstrualCalendarBanner,
    Calendar
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .menstrual-calendar-detail
    &__wrapper
      height: 100%
    
    &__details
      margin-top: 16px
      display: flex
      gap: 16px
      
    &__menu
      max-width: 400px 

    &__summary
      height: 70px
      background: linear-gradient(93.58deg, #FF94E6 12.06%, #DF9AFF 100%)
      border-radius: 4px 4px 0px 0px
      color: #FFFFFF

    &__summary-header
      display: flex

    &__summary-img
      margin-top: -10px
      margin-right: 16px

    &__summary-title
      margin-top: -10px
      @include button-1
    
    &__summary-desc
      @include new-body-text-2

    &__month
      width: 200px

    &__text
      color: #C400A5
      @include button-1

    &__setting
      margin-top: 16px

    &__emoticons
      max-width: 394px

    &__emoticons-row
      display: flex
      justify-content: center
      max-width: 394px
    
    &__emoticons-col
      display: flex
      max-width: 394px

    &__emoji
      width: 36px
    
    &__emoji-img
      padding: 10px
      
    &__emoji-text
      text-align: center
      width: 36px
      @include tiny-reg

    &__navigation
      margin: 16px 0

    &__button
      display: flex
      justify-content: space-between
      margin-bottom: 16px

    &__button-text
      font-size: 15px
      font-weight: 600
      text-transform: none !important

    &__alert
      height: 20px
      padding: 2px
      margin-left: -80px
      margin-bottom: 1px

    &__alert-text
      color: #FF8F8F
      font-size: 12px
      text-transform: none !important

    &__modal-title
      text-align: center
      max-width: 264px
      @include h3-opensans

    &__modal-desc
      max-width: 336px
      @include new-body-text-2

    &__head-text
      display: flex
      flex-direction: row
      justify-content: space-between

    &__head-text-column
      display: flex
      flex-direction: column
      gap: 8px

    &__head-info-column
      display: flex
      flex-direction: column
      align-items: flex-end
      justify-content: space-between
    
    &__head-text-primary
      height: 32px
      display: flex
      align-items: center
      @include h6

    &__head-text-secondary
      height: 20px
      display: flex
      align-items: center
      @include body-text-2

    &__head-text-link
      height: 32px
      display: flex
      font-size: 14px
      align-items: center
      color: #5640A5
      font-weight: 600
      line-height: 20px
      gap: 3px

    &__head-text-reminder
      height: 20px
      font-size: 12px
      display: flex
      align-items: center
      background: #FFE6E6
      padding: 0 4px
      color: #FF8F8F
      gap: 3px

    &__divider
      margin: 24px 0

    &__options
      display: flex
      justify-content: space-between
      align-items: center
      margin-bottom: 33px

    &__year
      @include h6

    &__icons
      margin-top: 35px
      padding: 0 0 14px 0
      display: flex
      gap: 24px

    &__icon
      display: flex
      gap: 8px
      font-weight: 600
      font-size: 14px
      line-height: 20px


    &__calendar-wrapper
      padding: 33px 0 35px 0

    &__note
      display: flex
      text-align: left
      gap: 8px

    &__note-text
      @include button-2

    &__note-desc
      @include new-body-text-2

</style>
