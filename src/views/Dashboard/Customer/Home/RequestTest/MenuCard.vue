<template lang="pug">
  .container-card(@click="onClick")
    v-card.menu-card
      v-row.pa-3
        v-col(cols="4")
          v-img(v-if="!icon" src="@/assets/debio-logo.png" height="176" width="152" contain)

          v-img(v-else :src="icon" height="176" max-width="152" class="rounded")
    
        v-col(cols="8")
          .menu-card__title
            .menu-card__name 
              b {{ title }}
            .menu-card__price 
              b {{ price }} {{ currency }}
          .menu-card__category Test Category : {{ category }}
          .menu-card__description {{ description }}
          
          ui-debio-rating.menu-card__rating(:rating="rate" :total-reviews="countRate" size="12")

          .menu-card__lab-name
            b {{ labName }}

          .menu-card__lab-address {{ city }}, {{ region }}, {{ country}}

</template>

<script>

import { getStates } from "@/common/lib/api"

export default {
  name: "MenuCard",

  data: () => ({
    state: ""
  }),

  props: {
    title: String,
    icon: String,
    labName: String,
    price: String,
    avatar: String,
    currency: String,
    rate: Number,
    countRate: Number,
    description: String,
    category: String,
    city: String,
    region: String,
    country: String
  },

  async mounted() {
    await this.getStateData()
  },

  methods: {
    onClick() {
      this.$emit("click")
    },

    async getStateData() {
      const {data: {data}} = await getStates(this.country)
      const states = data
      this.state = states.filter((s) => s.state_code === this.region)[0].name
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .container-card
    width: 500px
    height: 200px
    padding: 1px
    border-radius: 8px
    cursor: pointer

    &:hover
      background-color: #FF56E0

  .menu-card 
    border-radius: 8px
    padding: 1px
    width: 500px
    height: 197px

    &__title
      display: flex
      justify-content: space-between
      height:32px

    &__name
      width: 200px
      @include body-text-3-opensans-medium
  
    &__price
      color: #C400A5
      @include body-text-3-opensans-medium

    &__lab-name
      margin-top: 9px
      width: 240px
      @include body-text-3-opensans-medium

    &__category
      margin-top: 4px
      color: #757274
      @include tiny-reg

    &__description
      margin-top: 12px
      width: 270px
      color: #363636
      @include tiny-reg

    &__lab-address
      color: #5640A5
      @include tiny-reg

    &__rating
      margin-top: 10px
</style>
