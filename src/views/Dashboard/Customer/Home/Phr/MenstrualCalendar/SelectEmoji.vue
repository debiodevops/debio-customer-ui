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
            span.menstrual-calendar-detail__head-text-primary My Menstrual Calendar
            span.menstrual-calendar-detail__head-text-secondary Choose date to perform action
          
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
            v-model="selectedDates"
            :menstrualData="menstrualCalendarData"
            :isLoading="calendarLoading"
          )
          .menstrual-calendar-detail__emoticons_action
            ui-debio-button(
              outlined
              height="36"
              width="165"
              style="font-size: 13px"
              @click="backToDetail()"
              color="error"
            ) Cancel
            
            v-btn(
              color="secondary"
              elevation='0'
              width="165"
              height="36"
              class='white--text mnemonic-list-item'
              @click="submitEmojis()"
              :disabled="emojiChangesAdded.length < 0 || emojiChangesUpdate.length < 0"
            ) Apply
            

        .menstrual-calendar-detail__menu
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
            .menstrual-calendar-detail__emoticons
              v-row
                .menstrual-calendar-detail__emoticons-row(v-for="emoji in emojis")
                  v-col.menstrual-calendar-detail__emoticons-col(cols="3" )
                    .menstrual-calendar-detail__emoji(align="center")
                      v-img.menstrual-calendar-detail__emoji-img(
                        max-width="32px"
                        type="button"
                        @click="addEmoji(emoji)"
                        :src="require(`../../../../../../assets/${emoji.name}-${emoji.disabled}.svg`)"
                      )
                      .menstrual-calendar-detail__emoji-text.mt-3(:style="{color: emoji.color}") {{ emoji.text}}
          
          LoadingDialog(
            :show="loadingSubmitChange"
            desc="Please wait while we are applying your changes to the Substrate Blockchain"
            msg="Saving your changes"
          )

          ui-debio-modal.menstrual-calendar-detail__modal-success(
            :show="isSuccess"
            :show-title="false"
            :show-cta="false"
            disable-dismiss
          )
            ui-debio-icon(
              :icon="checkCircleIcon"
              size="90"
              color="#c400a5"
              stroke
            )
            .menstrual-calendar-detail__modal-title Success!

            .menstrual-calendar-detail__modal-desc Congratulations, your menstrual calendar has been updated

            ui-debio-button(
              color="secondary" 
              width="100%"
              height="35"
              style="font-size: 10px;"
              @click="backToDetail()"
            ) DISMISS

</template>

<script>
import { checkCircleIcon } from "@debionetwork/ui-icons"
import emojis from "@/common/constants/menstrual-symptoms-emoji"
import moods from "@/common/constants/menstruation-moods"
import MenstrualCalendarBanner from "./Banner.vue"
import Calendar from "@/common/components/Calendar"
import { mapState } from "vuex"
import { getLastMenstrualCalendarByOwner, getMenstrualCalendarById, getLastMenstrualCalendarCycleLogByOwner, getMenstrualCycleLog } from "@/common/lib/polkadot-provider/query/menstrual-calendar"
import { addMenstrualCycleLog, updateMenstrualCycleLog } from "@/common/lib/polkadot-provider/command/menstrual-calendar"
import LoadingDialog from "@/common/components/Dialog/LoadingDialog.vue"

export default {
  name: "SelectEmoji",

  data: () => ({
    checkCircleIcon,
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
      {value: 0, text: "January"},
      {value: 1, text: "February"},
      {value: 2, text: "March"},
      {value: 3, text: "April"},
      {value: 4, text: "May"},
      {value: 5, text: "June"},
      {value: 6, text: "July"},
      {value: 7, text: "August"},
      {value: 8, text: "September"},
      {value: 9, text: "October"},
      {value: 10, text: "November"},
      {value: 11, text: "December"}
    ],
    menstrualCalendarData: null,
    menstruationPeriodeIndex: [],
    todaySum: null,
    emojiDays: {},
    emojiSelected: [],

    days: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    descriptions: ["Today", "Menstruation", "Prediction", "Fertility", "Ovulation"],
    cycleLog: [],
    dataMenstrualCalanedar: null,
    emojiChangesUpdate: {},
    emojiChangesAdded: {},
    loadingSubmitChange: false,
    isSuccess: false,
    calendarLoading: false
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet
    })  
  },

  watch: {
    async selectedMonthText(newMonth) {
      this.menstruationPeriodeIndex = []
      this.selectedMonth = this.monthList.find((value) => value.text === newMonth).value
    },

    selectedDates(newSelected) {
      this.submitEnabled = newSelected !== null && newSelected.length > 0
      this.emojiSelected = this.emojiDays[newSelected?.getTime()] ?? []
    },

    async emojiSelected() {
      this.updateEmojis()
    },

    async emojiDays() {
      await this.reRenderMenstrualCalendarData()
      this.updateEmojis()
    }
  },

  methods: {
    async prev() {
      let prevMonth = this.selectedMonth - 1
      if (prevMonth < 0) {
        prevMonth = 11
        this.selectedYear = this.selectedYear - 1
      } 
      this.selectedMonth = prevMonth
      this.selectedMonthText = this.monthList[this.selectedMonth].text
      await this.getData()
    },

    async next() { 
      let nextMonth = this.selectedMonth + 1
      if (nextMonth > 11) {
        nextMonth = 0
        this.selectedYear = this.selectedYear + 1
      }
      this.selectedMonth = nextMonth
      this.selectedMonthText = this.monthList[this.selectedMonth].text
      await this.getData()
    },

    async addEmoji(emoji) {
      if (!this.selectedDates) return

      if (emoji.disabled === "active") {
        await this.removeSymptoms(this.selectedDates, emoji)
      } else {
        await this.addSymptoms(this.selectedDates, emoji)
      }
    },

    async addSymptoms(date, emoji) {
      let emojiDaysCopy = {...this.emojiDays}
      const time = date.getTime()
      let emojiCollection = emojiDaysCopy[time] ?? []
      emojiCollection.push(emoji.name)
      emojiDaysCopy[time] = emojiCollection

      this.emojiDays = emojiDaysCopy
      await this.storeUpdated()
    },

    async removeSymptoms(date, emoji) {
      let emojiDaysCopy = {...this.emojiDays}
      const time = date.getTime()
      emojiDaysCopy[time] = emojiDaysCopy[time]?.filter((val) => val !== emoji.name) ?? []

      this.emojiDays = emojiDaysCopy

      await this.storeUpdated()
    },

    getSummary() {
      if(this.todaySum.menstruation) return moods.MENSTRUATION(this.todaySum.days)
      if(this.todaySum.fertility) return moods.FERTILITY
      if(this.todaySum.ovulation) return moods.OVULATION
      return moods.NONE
    },

    async getData() {
      this.calendarLoading = true
      const menstrualCalendar = await getLastMenstrualCalendarByOwner(this.api, this.wallet.address)
      const data = await getMenstrualCalendarById(this.api, menstrualCalendar[0])
      this.dataMenstrualCalanedar = data

      const menstrualCycleLogByOwner = await getLastMenstrualCalendarCycleLogByOwner(this.api, menstrualCalendar[menstrualCalendar.length-1])
      const cycle = []

      for (let i = 0; i < menstrualCycleLogByOwner.length; i++) {
        const test = await getMenstrualCycleLog(this.api, menstrualCycleLogByOwner[i])
        cycle.push(test)
      }

      cycle.sort((a, b) => parseInt(a.date.replaceAll(",", "")) - parseInt(b.date.replaceAll(",", "")))
      this.cycleLog = cycle

      await this.getMenstruationCalendarData()
      this.calendarLoading = false
    },

    async reRenderMenstrualCalendarData() {
      try {
        const today = new Date()
        const firstDateCurrentMonth = new Date(this.selectedYear, this.selectedMonth, 1)
        const firstDateNextMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0)
        
        const dayFirstDateCurrentMonth = firstDateCurrentMonth.getDay() === 0 ? 6 : firstDateCurrentMonth.getDay() - 1
        const dayFirstDateNextMonth = firstDateNextMonth.getDay() === 0 ? 6 : firstDateNextMonth.getDay() - 1

        const startDate = new Date(this.selectedYear, this.selectedMonth, -(dayFirstDateCurrentMonth - 1))
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, (6 - dayFirstDateNextMonth))

        const menstrualCalendarData = {
          addressId: this.dataMenstrualCalanedar.addressId,
          averageCycle: this.dataMenstrualCalanedar.averageCycle,
          cycleLog: []
        }
        let date = startDate
        let indexDate = 0
        const emojiDays = {...this.emojiDays}
        while(date.getTime() < endDate.getTime()) {
          date = new Date(this.selectedYear, this.selectedMonth, (-(dayFirstDateCurrentMonth - 1) + indexDate))
          const log = this.cycleLog.filter(log => Number(log.date.replaceAll(",", "")) === date.getTime())
          const menstruation = log[0]
          const symptoms = emojiDays[date.getTime()]

          const isMenstruation = menstruation?.menstruation ? 1 : 0
          let currentData = {
            date: date.getTime(),
            symptoms: symptoms,
            menstruation: isMenstruation
          }

          menstrualCalendarData.cycleLog.push(currentData)

          if (today.getDate() === date.getDate()) {
            this.todaySum = currentData
          }
          indexDate++
        }
        this.menstrualCalendarData = menstrualCalendarData
      } catch (err) {
        console.log(err.message)
      }
    },

    async getMenstruationCalendarData() {
      try {
        const today = new Date()
        const firstDateCurrentMonth = new Date(this.selectedYear, this.selectedMonth, 1)
        const firstDateNextMonth = new Date(this.selectedYear, this.selectedMonth + 1, 0)
        
        const dayFirstDateCurrentMonth = firstDateCurrentMonth.getDay() === 0 ? 6 : firstDateCurrentMonth.getDay() - 1
        const dayFirstDateNextMonth = firstDateNextMonth.getDay() === 0 ? 6 : firstDateNextMonth.getDay() - 1

        const startDate = new Date(this.selectedYear, this.selectedMonth, -(dayFirstDateCurrentMonth - 1))
        const endDate = new Date(this.selectedYear, this.selectedMonth + 1, (6 - dayFirstDateNextMonth))

        const menstrualCalendarData = {
          addressId: this.dataMenstrualCalanedar.addressId,
          averageCycle: this.dataMenstrualCalanedar.averageCycle,
          cycleLog: []
        }
        let date = startDate
        let indexDate = 0
        const emojiDays = {...this.emojiDays}
        
        while(date.getTime() < endDate.getTime()) {
          date = new Date(this.selectedYear, this.selectedMonth, (-(dayFirstDateCurrentMonth - 1) + indexDate))
          const log = this.cycleLog.filter(log => Number(log.date.replaceAll(",", "")) === date.getTime())
          const menstruation = log[0]
          emojiDays[date.getTime()] = menstruation ? menstruation.symptoms : emojiDays[date.getTime()] ?? []
          const symptoms = emojiDays[date.getTime()]

          const isMenstruation = menstruation?.menstruation ? 1 : 0
          let currentData = {
            date: date.getTime(),
            symptoms: symptoms,
            menstruation: isMenstruation
          }

          menstrualCalendarData.cycleLog.push(currentData)

          if (today.getDate() === date.getDate()) {
            this.todaySum = currentData
          }
          indexDate++
        }
        this.menstrualCalendarData = menstrualCalendarData
        if (this.emojiDays) {
          this.emojiDays = emojiDays
        }
      } catch (err) {
        console.log(err.message)
      }
    },

    toSubscriptionSetting() {
      this.$router.push({ name: "menstrual-calendar-subscription-setting" })
    },

    toMenstrualSelectionUpdate() {
      this.$router.push({ name: "menstrual-calendar-selection-update" })
    },

    updateEmojis() {
      if (!this.selectedDates) return

      const emojies = this.emojis.map((value) => {
        const selectedEmojies = this.emojiDays[this.selectedDates.getTime()]
        
        const active = selectedEmojies.some((name) => name === value.name)

        value.disabled = active ? "active" : "inactive"
        value.color = active ? "#E27625" : "#363636"
        
        return value
      })

      this.emojis = emojies
    },

    async storeUpdated() {
      if (!this.selectedDates) return

      const filter = this.cycleLog.filter((val) => {
        const date = val.date.split(",").join("")
        const selectedDate = this.selectedDates.getTime()
        return Number(date) === selectedDate
      })

      const emoji = this.emojiDays[this.selectedDates.getTime()]

      if (filter.length > 0) {
        const emojiChangeUpdateCopy = {...this.emojiChangesUpdate}

        emojiChangeUpdateCopy[this.selectedDates.getTime()] = {
          id: filter[0].id,
          menstrualCalendarId: filter[0].menstrualCalendarId,
          date: Number(filter[0].date.split(",").join("")),
          menstruation: filter[0].menstruation,
          symptoms: emoji,
          createdAt: filter[0].createdAt.replaceAll(",", ""),
          updatedAt: new Date().getTime()
        }

        this.emojiChangesUpdate = emojiChangeUpdateCopy
      } else {
        const emojiChangesAddedCopy = {...this.emojiChangesAdded}

        emojiChangesAddedCopy[this.selectedDates.getTime()] = {
          date: this.selectedDates.getTime(),
          symptoms: emoji,
          menstruation: false
        }

        this.emojiChangesAdded = emojiChangesAddedCopy
      }
    },

    async submitEmojis() {
      if (this.loadingSubmitChange) return

      this.loadingSubmitChange = true

      const menstrualCalendar = await getLastMenstrualCalendarByOwner(this.api, this.wallet.address)
      let dataUpdate = []

      for (const updateEmoji in this.emojiChangesUpdate) {
        dataUpdate.push(this.emojiChangesUpdate[updateEmoji])
      }

      let dataAdded = []

      for (const addedEmoji in this.emojiChangesAdded) {
        dataAdded.push(this.emojiChangesAdded[addedEmoji])
      }

      updateMenstrualCycleLog(
        this.api,
        this.wallet,
        dataUpdate,
        async () => {
          addMenstrualCycleLog(
            this.api,
            this.wallet,
            menstrualCalendar[menstrualCalendar.length - 1],
            dataAdded,
            async () => {
              this.loadingSubmitChange = false
              this.isSuccess = true
            }
          )
        }
      )
    },

    backToDetail() {
      this.$router.push({ name: "menstrual-calendar-detail" })
    }
  },

  async created() {
    const emojies = this.emojis.map((value) => {
      value.disabled = "inactive"
      value.color = "#363636"
      return value
    })

    this.emojis = emojies
    const today = new Date()
    this.selectedMonthText = this.monthList[today.getMonth()].text
    this.currentYear = today.getFullYear().toString()
    await this.getData()
  },

  components: {
    MenstrualCalendarBanner,
    Calendar,
    LoadingDialog
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .menstrual-calendar-detail
    &__modal
      display: flex
      align-items: center
      justify-content: center

    &__modal-desc
      text-align: center
      max-width: 264px

    &__modal-title
      text-align: center
      max-width: 264px
      @include h3-opensans
    
    &__modal-buttons
      display: flex
      justify-content: space-between
      gap: 20px

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
      margin-top: 0

    &__emoticons
      max-width: 394px

    &__emoticons-row
      display: flex
      justify-content: center
      max-width: 394px
    
    &__emoticons-col
      display: flex
      max-width: 394px
    
    &__emoticons_action
      margin: 32px 0 0 0
      display: flex
      justify-content: flex-end
      gap: 30px 20px

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
      flex-direction: column
      gap: 8px

    
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
