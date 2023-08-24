<template lang="pug">
  .genetic-data
    .genetic-data__wrapper
      ui-debio-banner.genetic-data__banner(
        title="My Genetic Data"
        subtitle="This feature allows you to directly engage with our Genetic Analysts, They will use the uploaded data to provide you with comprehensive report on your unique genetic makeup."
        gradientColor="tertiary"
        with-decoration
      )
        template(slot="illustration")
          ui-debio-icon.genetic-data__banner-illustration(
            :icon="geneticIllustration"
            :size="cardBlock ? 250 : 180"
            view-box="0 0 245 170"
            fill
          )
        
        template(slot="cta")
          ui-debio-card(
            :to="{ name: 'customer-add-genetic-data'}"
            title="Add Genetic Data"
            sub-title="Analyze your genetic data"
            tiny-card 
            with-icon
            width="250"
            :block="cardBlock"
          )
            ui-debio-icon(:icon="plusCircle" slot="icon" size="34" color="#C400A5" fill)


      .genetic-data__tabs
        template
          v-tabs(v-model="tabs")
            v-tab Genetic Data List
            v-tab Genetic Analysis List
          
        v-tabs-items(v-model="tabs")
          v-tab-item
            GeneticDataList
          v-tab-item
            GeneticAnalysisList



</template>

<script>
import { geneticIllustration, plusCircle } from "@debionetwork/ui-icons"
import GeneticDataList from "./GeneticDataList.vue"
import GeneticAnalysisList from "./GeneticAnalysisList.vue"

export default {
  name: "GeneticData",

  components: {
    GeneticDataList,
    GeneticAnalysisList
  },

  data:() => ({
    geneticIllustration,
    plusCircle,
    tabs: null,
    cardBlock: false
  })
}

</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .genetic-data
    &__wrapper
    display: flex
    flex-direction: column
    gap: 35px

    &::v-deep
      .banner__subtitle
        max-width: 29.2rem !important

    &__tabs
      margin-top: 35px
      background-color: #ffffff
      padding: 10px 30px
    
    &__table
      margin-top: 0px !important
      padding: 0px

  .degenics-datatable-card
    padding: 0 !important
    margin: -20px 0 0 0

  .degenics-data-table
    margin-top: 0px !important

</style>
