<template lang="pug">
  v-container.container-card
    v-card.menu-card
      v-row.menu-card__service
        ui-debio-avatar.menu-card__service-avatar(:src="computeAvatar" size="90" rounded)
        
        b.menu-card__service-title {{ serviceDetail.serviceName }}
          ui-debio-rating.menu-card__rating(:rating="serviceDetail.serviceRate" :total-reviews="serviceDetail.countServiceRate" size="10")
        
          v-row.menu-card__service-detail
            v-col(cols="5.5")
              b.menu-card__service-sub-title Price
              .menu-card__service-description
                | {{ serviceDetail.totalPrice }}
                | {{ formatUSDTE(serviceDetail.currency) }} 
            v-col(cols="6.5") 
              b.menu-card__service-sub-title Duration
              .menu-card__service-description
                | {{ serviceDetail.duration }} 
                | {{ serviceDetail.durationType }}

      hr.menu-card__line
      
      v-row.menu-card__lab
        ui-debio-avatar.menu-card__lab-avatar(:src="serviceDetail.labImage" size="90" rounded)
        b.menu-card__lab-title {{ serviceDetail.labName }}
          ui-debio-rating.menu-card__rating(:rating="serviceDetail.labRate" :total-reviews="serviceDetail.countRateLab" size="10")
          .menu-card__address {{ serviceDetail.labAddress }}, {{ serviceDetail.city }}, {{ computeCountry(serviceDetail.country) }}
          a(:href="computePurchaseLink" target="_blank") {{ computePurchaseLink }}
</template>

<script>

import { getLocations } from "@/common/lib/api"
import { formatUSDTE } from "@/common/lib/price-format.js"



export default {
  name: "LabDetailCard",
  props: {
    serviceDetail: Object
  },

  data: () => ({
    countries: [],
    formatUSDTE
  }),

  computed: {
    computeAvatar() {
      return this.serviceDetail.serviceImage ? this.serviceDetail.serviceImage : require("@/assets/debio-logo.png")
    },

    computePurchaseLink () {
      return this.serviceDetail.longDescription.split("||")[1]
    }
  },

  async mounted() {
    await this.getCountries()
  },

  methods: {
    async getCountries() {
      const { data : { data }} = await getLocations()
      this.countries = data
    },

    computeCountry(country) {
      return this.countries.filter((c) => c.iso2 === country)[0].name
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .container-card
    width: 360px
    height: 328px
    border-radius: 8px

  .menu-card 
    padding: 2px
    border-radius: 8px
    padding-top: 2px
    height: 320px


    &__body-head
      margin-right: 16px
      height: 64px !important

    &__rating
      margin-top: 5px
      margin-bottom: 5px

    &__service
      display: flex
      justify-content: flex-start
      margin-top: 22.5px


    &__service-avatar
      margin-top: 20px
      margin-right: 10px
      margin-left: 35px

    &__service-title
      margin-top: 20px
      width: 201px
      height: 64px !important
      @include body-text-3-opensans-medium

    &__service-sub-title
      @include tiny-semi-bold

    &__service-description
      color: #C400A5
      @include body-text-3-opensans
    

    &__lab
      display: flex      
      justify-content: flex-start

    &__lab-avatar
      margin-right: 10px
      margin-left: 35px

    &__lab-title
      width: 201px
      height: 64px !important
      @include body-text-3-opensans-medium

    &__line
      margin: 35px 20px
    
    &__address
      width: 201px
      color: #757274
      @include body-text-3-opensans

    &__website
      width: 201px
      color: #757274
      @include body-text-3-opensans

</style>

