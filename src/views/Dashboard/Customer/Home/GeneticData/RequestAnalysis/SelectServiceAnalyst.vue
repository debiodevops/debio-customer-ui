<template lang="pug">
  .customer-select-service-analyst
    .customer-select-service-analyst__wrapper
      .customer-select-service-analyst__nav
        .customer-select-service-analyst__nav-button(@click="handleBack")
          v-icon.customer-select-service-analyst mdi-chevron-left
          
      .customer-select-service-analyst__main
        .customer-select-service-analyst__stepper
          ui-debio-stepper(
            :items="stepperItems"
          )

        .customer-select-service-analyst__title Select Service and Analyst
        
        .customer-select-service-analyst__cards
          v-row
            v-col(
              v-if="isLoading"
            )
              v-skeleton-loader(
                type="card"
                width="300"
              )
            v-col.no-items(
              v-if="!isLoading && !serviceList.length"
            )
              v-img(
                alt="no-list-data"
                center
                src="@/assets/no-data-list.svg"
                width="358px"
                height="207px"
              )
              span.no-items__text-alert Oops! Looks like there is no Service and Analyst available
              span Please try again later
              ui-debio-button.no-items__button-dashboard(
                color="secondary" 
                width="255"
                height="35"
                @click="goToDashboardPage"
                ) Back to Dashboard
            v-col.customer-select-service-analyst__col(
              v-else
              v-for="(service, i) in serviceList"
              :key="i"
            )
              ServiceAnalysisCard.customer-select-service-analyst__card(
                :service="service"
                @click="showDetail"
              )
              
        AnalystDetail(
          ref="analystDetail"
          :show="showAnalystDetail"
          :experiences="selectedAnalystExperiences"
          @close="closeDetailDialog"
        )
        
        ImportantDialog(
          @close="showInformationDialog = false"
          @click="showInformationDialog = false"
          :show="showInformationDialog"
        )
</template>

<script>

import { mapState, mapMutations } from "vuex"
import ServiceAnalysisCard from "./ServiceAnalysisCard"
import AnalystDetail from "./AnalystDetail"
import { queryGetAllGeneticAnalystServices } from "@/common/lib/polkadot-provider/query/genetic-analysts-services"
import { 
  queryGeneticAnalystByAccountId, 
  queryGeneticAnalystQualificationsByHashId } from "@debionetwork/polkadot-provider"
import ImportantDialog from "./Information.vue"

export default {
  name: "SelectServiceAnalyst",

  data: () => ({
    stepperItems: [
      { number: 1, title: "Select Genetic Data", active: false },
      { number: 2, title: "Select Service & Analyst", active: true },
      { number: 3, title: "Checkout and Payment", active: false },
      { number: 4, title: "Summary/Instruction", active: false }
    ],
    showAnalystDetail: false,
    serviceList: [],
    selectedService: null,
    selectedAnalystExperiences: null,
    isLoading: false,
    showInformationDialog: false,
    isShowLoading: false
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      selectedGeneticData: (state) => state.geneticData.selectedData
    })
  },

  components: {
    ServiceAnalysisCard,
    AnalystDetail,
    ImportantDialog
  },

  async mounted () {

    if (!this.selectedGeneticData) {
      this.$router.push({ name: "customer-request-analysis" })
    }

    await this.getGeneticAnalystService()
    this.showInformationDialog = true
  },


  methods: {
    ...mapMutations({
      setSelectedAnalysisService: "geneticData/SET_SELECTED_SERVICE"
    }),
    
    async getGeneticAnalystService() {
      this.isLoading = true;
      const geneticAnalystService = await queryGetAllGeneticAnalystServices(this.api);

      const handleDescription = async (description) => {
        try {
          if (typeof description === "string" && description.startsWith("0x")) {
            return this.web3.utils.hexToUtf8(description);
          }
          const regex = /^(https:\/\/ipfs.debio.network\/ipfs\/)/;
          if (regex.test(description)) {
            const response = await fetch(description);
            if (response.ok) {
              const text = await response.text();
              return text;
            } else {
              console.error("Failed to fetch description:", response.status, response.statusText);
              return "Description fetch failed";
            }
          }
          return description;
        } catch (error) {
          console.error("Error in handleDescription:", error);
          return "Description processing error";
        }
      };


      for (let i = 0; i < geneticAnalystService.length; i++) {
        let {
          id: serviceId,
          ownerId: analystId,
          info: {
            name: serviceName,
            pricesByCurrency: priceDetail,
            expectedDuration: {
              duration,
              durationType
            },
            description,
            testResultSample
          }     
        } = geneticAnalystService[i][1].toHuman();

        const analystsInfo = await queryGeneticAnalystByAccountId(this.api, analystId);

        if (analystsInfo.verificationStatus === "Verified") {
          description = await handleDescription(description);

          const service = {
            serviceId,
            analystId,
            serviceName,
            priceDetail,
            duration,
            durationType,
            description,
            testResultSample,
            analystsInfo
          };
          this.serviceList.push(service);
        }
      }
      this.isLoading = false;
    },


    handleBack() {
      this.$router.push({ name: "customer-request-analysis" })
    },

    async showDetail(val) {
      this.selectedService = val
      this.setSelectedAnalysisService(val)
      const qualifications = val.analystsInfo.qualifications[0]
      await this.getExperience(qualifications)
    },

    async getExperience(id) {

      let experiences
      if (id) {
        experiences = await queryGeneticAnalystQualificationsByHashId(this.api, id)
        this.selectedAnalystExperiences = experiences.info.experience
      } else {
        this.selectedAnalystExperiences = ["-"]
      }
      await this.$refs.analystDetail.getTxWeight()
      this.showAnalystDetail = true
    },

    closeDetailDialog() {
      this.showAnalystDetail = false
    },

    goToDashboardPage() {
      this.$router.push({name: "dashboard"})
    }
  }


}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .customer-select-service-analyst
    width: 100%
    height: 100%
    background: #FFFFFF

    &__wrapper
      width: 100%
      height: 100%
      background: #FFFFFF
      box-shadow: 0 0.125rem 0.625rem rgba(0, 0, 0, 0.1)
      border-radius: 0.25rem

    &__nav
      padding: 2.313rem 3.125rem

    &__nav-button
      display: flex
      align-items: center
      gap: 0.625rem
      max-width: max-content
      color: #757274
      cursor: pointer
      @include body-text-3

    &__main
      padding-bottom: 100px
      padding-left: 20px
      padding-right: 20px
      width: 100%
      display: flex
      flex-direction: column
      align-items: center

    &__title
      display: flex
      flex-direction: column
      align-items: center
      margin-top:50px
      @include h6-opensans

    &__cards
      margin: 40px 10px

    &__col
      display: flex
      justify-content: center
      margin-bottom: 10px
      
    &__card
      width: 320px
  .no-items
    display: flex
    flex-direction: column
    align-items: center
    @include body-text-3-opensans
    font-size: 12px

    &__text-alert
      font-size: 14px
      font-weight: 600
      margin: 25px 0px 20px 0px

    &__button-dashboard
      margin-top: 40px


    
</style>
