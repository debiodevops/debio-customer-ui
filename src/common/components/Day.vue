<template lang="pug">
  .wrap
    span.skeleton-loader(
      v-if="isLoading" 
      v-for="_ in countDay"
    )

    template(v-if="!isLoading")
      template(v-if="isMenstrualData")
        div.day-card(
          v-for="date in dates"
          :class="setClass(date)"
          @click="selectDayClick(date.thisMonth && date.isPast, date.date, date.index, date)"
        )
          div(
            v-if="date.thisMonth"
          )
            v-img.ovulation(
              v-if="date.data.isOvulation"
              alt="today"
              src="@/assets/ovulation.svg"
              max-width="23px"
              max-height="23px"
            )

            v-img.checked(
              v-if="(date.isSelected)"
              alt="checked"
              src="@/assets/tick-circle.svg"
              max-width="16px"
              max-height="16px"
            )

            v-img.today(
              v-if="date.today"
              alt="today"
              src="@/assets/today.svg"
              max-width="23px"
              max-height="23px"
            )
            .emoticon
              .emoticon-item-more-than-one(
                v-if="date.data.symptoms.length > 1"
              )
                v-img.emoticon-item(
                  alt="emoji-depressed-active"
                  :src="require(`../../assets/${date.data.symptoms[0]}-active.svg`)"
                  max-width="16px"
                  max-height="16px"
                )
                .emoticon-item-count +{{date.data.symptoms.length - 1}}
              v-img.emoticon-item(
                v-else-if="date.data.symptoms.length > 0"
                alt="emoji-depressed-active"
                :src="require(`../../assets/${date.data.symptoms[0]}-active.svg`)"
                max-width="16px"
                max-height="16px"
              )
            span(
              :class="{ highlight: (date.data.isFertility || date.data.isPrediction || date.data.isMenstruation), past: (date.isPast)}"
            ) {{ date.text.toString().trim() }}

      template(v-if="!isMenstrualData")
        div.day-card(
          v-for="date in dates" 
          :class="{day: (date.thisMonth), none: !(date.thisMonth), selected: (date.isSelected && date.thisMonth), menstruation: (date.isMenstruation && date.thisMonth)}" 
          @click="daySelectionClick(date.thisMonth && date.isPast, date.date, date.index, date)"
        )
          div(
            v-if="date.thisMonth"
          )
            v-img.today(
              v-if="date.today"
              alt="today"
              src="@/assets/today.svg"
              max-width="23px"
              max-height="23px"
            )
            v-img.checked(
              v-if="(date.isSelected)"
              alt="checked"
              src="@/assets/tick-circle.svg"
              max-width="16px"
              max-height="16px"
            )
            span(
              :class="{ past: (date.isPast && !date.isSelected) }"
            ) {{ date.text.toString().trim() }}
</template>

<script>
export default {
  name: "Day",

  props: {
    dates: {type: Array},
    isLoading: {type: Boolean, default: false},
    isMenstrualData: {type: Boolean, default: false}
  },

  data: () => ({
    selectedIndex: -1,
    countDay: 7,
    selectedDate: [],
    isUpdate: false
  }),

  mounted() {
    if (this.$route.name === "menstrual-calendar-selection-update" || this.$route.name === "menstrual-calendar-selection") {
      this.isUpdate = true
    }
  },

  methods: {
    daySelectionClick(active, date, index, data) {
      if(!active) return
      if (data.isMenstruation) {
        this.$emit("on-unselected", new Date(date.getFullYear(), date.getMonth(), (date.getDate())), index)
        return
      }

      this.$emit("on-selected", new Date(date.getFullYear(), date.getMonth(), (date.getDate())), index)
    },

    selectDayClick(active, date, index, data) {
      if (index === this.selectedIndex) {
        active && this.$emit("on-remove-select", date, index)
        this.selectedIndex = -1
      } else {
        active && this.$emit("on-day-select", date, index, data)
        this.selectedIndex = index
      }
    },
    
    setClass(date) {
      return {
        "selected-day": (date !== undefined && date.isSelected && !this.isUpdate), 
        selected: (date !== undefined && date.isSelected && this.isUpdate), 
        day: (date !== undefined && date.thisMonth), 
        none: !(date !== undefined && date.thisMonth), 
        menstruation: (date !== undefined && date.data.isMenstruation && date.thisMonth),
        prediction: (date !== undefined && date.data.isPrediction && date.thisMonth),
        fertility: (date !== undefined && date.data.isFertility && date.thisMonth)
      }
    }
  }
}
</script>

<style scoped>
  .wrap {
    display: flex;
    gap: 5.33px;
  }

  .day-card {
    max-width: 92px;
    max-height: 72px;
  }

  .skeleton-loader {
    position: relative;
    width: 92px;
    height: 72px;
    display: flex;
    border-radius: 4px;
    cursor: progress; 
    background: 
      linear-gradient(0.25turn, transparent, #fff, transparent),
      linear-gradient(#eee, #eee),
      radial-gradient(38px circle at 19px 19px, #eee 50%, transparent 51%),
      linear-gradient(#eee, #eee);  
    background-repeat: no-repeat;
    background-size: 315px 250px, 315px 180px, 100px 100px, 225px 30px; 
    background-position: -315px 0, 0 0, 0px 190px, 50px 195px; 
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {  
    to {
      background-position: 315px 0, 0 0, 0 190px, 50px 195px;
    }
  }

  .past {
    color: #363636;
  }
  
  .highlight {
    color: #F7F7F7;
  }

  .day {
    position: relative;
    width: 92px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color:#F7F7F7;
    border-radius: 4px;
    color: #D3C9D1;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
  }

  .selected {
    background-color: #FFC4F9;
    color: #F7F7F7;
  }

  .selected-day {
    outline: 2px solid #FF60BF;
  }
  
  .prediction {
    background-color: #E5AEFF;
    color: #F7F7F7;
  }

  .fertility {
    background-color: #D3D5FF;
    color: #F7F7F7;
  }

  .none {
    position: relative;
    width: 92px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: #D3C9D1;
    font-weight: 600;
    font-size: 14px;
    cursor: not-allowed;
    user-select: none;
  }

  .emoticon {
    position: absolute;
    background: #FFFFFF;
    border-radius: 8px;
    bottom: 0;
    right: 0;
    margin: 0 4px 4px 0;
  }

  .emoticon-item {
    height: 16px;
    width: 16px;
  }

  .emoticon-item-more-than-one {
    display: flex;
    align-items: center;
    padding: 0;
    gap: 1px;
    height: 16px;
    background: #FFFFFF;
    border-radius: 8px;
  }

  .emoticon-item-count {
    height: 16px;
    font-weight: 600;
    margin: 0 3px 0 0;
    font-size: 8px;
    line-height: 16px;
    color: #FF60BF;
  }

  .today {
    position: absolute;
    width: 23px;
    height: 23px;
    top: 0;
    right: 0;
  }

  .today .select{
    top: 0;
    right: 0;
  }

  .checked {
    position: absolute;
    width: 16px;
    height: 16px;
    bottom: 0;
    right: 0;
    margin: 0 4px 4px 0;
  }

  .ovulation {
    position: absolute;
    width: 16px;
    height: 16px;
    top: 0;
    left: 0;
    margin: 4px 0 0 4px;
  }

  .drop {
    position: absolute;
    width: 16px;
    height: 16px;
    top: 0;
    left: 0;
    margin: 4px 0 0 4.67px;
  }

  .menstruation {
    background-color: #FFC4F9;
    color: #F7F7F7;
  }
</style>
