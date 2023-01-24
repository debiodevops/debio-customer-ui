<template lang="pug">
  .customer-select-service
    .customer-select-service__title Select your preferred service

    template(v-if="showNoLab")
      NoLab(@fetch="fetchService")

    .customer-select-service__card(v-if="!showNoLab")
      v-row 
        v-col(
        v-for="(service, i) in serviceList"
        :key="i"
        )
          MenuCard.card(  
            :title="service.serviceName"
            :description="service.serviceDescription"
            :icon="service.serviceImage"
            :rate="service.serviceRate"
            :countRate="service.countServiceRate"
            :lab-name="service.labName"
            :price="service.totalPrice"
            :currency="formatUSDTE(service.currency)"
            :city="service.city"
            :region="service.regionName"
            :country="service.countryName"
            :category="service.serviceCategory"
            @click="getDetailService(service)"
          )
      
      template
        ServiceDetailDialog(
          :show="showServiceDetailDialog"
          @close="showServiceDetailDialog = false"
          )

        ui-debio-alert-dialog(
          :show="showAlert"
          :width="289"
          title="Unpaid Order"
          message="Complete your unpaid order first before requesting a new one. "
          imgPath="alert-circle-primary.png"
          btn-message="Go to My Payment"
          @close="closingDialog"
          @click="toPaymentHistory"
          )

      .customer-select-service__text.mt-10 Could not find a test category that you’re looking for? 
        a(@click="showNoLab = true") request a service


</template>

<script>

import { mapState, mapMutations } from "vuex"
import NoLab from "../NoLab.vue"
import MenuCard from "../MenuCard.vue"
import ServiceDetailDialog from "../ServiceDetailDialog.vue"
import { queryLastOrderHashByCustomer, queryOrderDetailByOrderID } from "@debionetwork/polkadot-provider"
import { formatPrice, formatUSDTE } from "@/common/lib/price-format.js"

export default {
  name: "SelectService",

  components: {
    NoLab,
    MenuCard,
    ServiceDetailDialog
  },

  props: {
    staking: Boolean
  },

  data: () => ({
    showNoLab: false,
    newLab: false,
    serviceList: [],
    showServiceDetailDialog: false,
    lastOrder: null,
    showAlert: false,
    services: null,
    formatUSDTE
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      web3: (state) => state.metamask.web3,
      wallet: (state) => state.substrate.wallet,
      country: (state) => state.lab.country,
      city: (state) => state.lab.city,
      serviceCategory: (state) => state.lab.serviceCategory,
      dataServices: (state) => state.lab.services
    })
  },

  async mounted () {
    this.services = null
    this.serviceList = []
    this.services = this.dataServices
    await this.getServices()

    if (!this.country) {
      this.$router.push({ name: "customer-request-test"})
    }

  },

  methods: {

    ...mapMutations({
      setLabToRequest: "testRequest/SET_LAB",
      setProductsToRequest: "testRequest/SET_PRODUCTS"
    }),

    async getServices () {

      for (let i = 0; i < this.services.length; i++) {
        let {
          id: serviceId,
          lab_id: labId,
          lab_detail: {
            name: labName,
            address: labAddress,
            city,
            region,
            country,
            profile_image: labImage,
            website: labWebsite
          },
          info: {
            name: serviceName,
            category: serviceCategory,
            description: serviceDescription,
            long_description: longDescription,
            image: serviceImage,
            dna_collection_process: dnaCollectionProcess,
            test_result_sample: resultSample,
            expected_duration: {
              duration,
              durationType
            },
            prices_by_currency: [
              {
                currency
              }
            ]
          },
          country_name: countryName,
          region_name: regionName,
          verification_status:  verificationStatus,
          stake_status: stakeStatus,
          service_flow: serviceFlow
        } = this.services[i]

        const labRateData = await this.$store.dispatch("rating/getLabRate", labId)
        const labRate = labRateData.rating
        const countRateLab = labRateData.count
        const serviceData = await this.$store.dispatch("rating/getServiceRate", serviceId)
        const serviceRate = serviceData.rating_service
        const countServiceRate = serviceData.count_rating_service
        const detailPrice = this.services[i].info.prices_by_currency[0]
        const totalPrice = formatPrice(detailPrice.total_price.replaceAll(",", ""), currency)
        const servicePrice = formatPrice(detailPrice.price_components[0].value.replaceAll(",", ""), currency)
        const qcPrice =  formatPrice(detailPrice.additional_prices[0].value.replaceAll(",", ""), currency)

        const service = {
          serviceId,
          serviceName,
          serviceRate,
          serviceImage,
          serviceCategory,
          serviceDescription,
          longDescription,
          labId,
          labName,
          labRate,
          labAddress,
          labImage,
          totalPrice,
          servicePrice,
          qcPrice,
          currency,
          city,
          country,
          region,
          countRateLab,
          countServiceRate,
          duration,
          durationType,
          verificationStatus,
          stakeStatus,
          indexPrice: 0,
          dnaCollectionProcess,
          resultSample,
          serviceFlow,
          countryName,
          regionName,
          labWebsite
        }
        if (service.verificationStatus === "Verified") {
          if (service.stakeStatus === "Staked") {
            this.serviceList.push(service)
          }
        }
      }

      if (!this.serviceList.length) {
        this.showNoLab = true
      }
    },

    async fetchService() {
      this.services = null
      this.serviceList = []
      this.services = this.dataServices

      await this.getServices()
      this.showNoLab = false
    },
    
    async getDetailService(service) {
      this.lastOrder = await queryLastOrderHashByCustomer(
        this.api,
        this.wallet.address
      )

      if (this.lastOrder) {
        const detailOrder = await queryOrderDetailByOrderID(this.api, this.lastOrder)
        if (detailOrder.status === "Unpaid") {
          this.showAlert = true
          return
        }
      }
      console.log("service", service)
      this.setProductsToRequest(service)
      this.showServiceDetailDialog = true
    },

    closingDialog() {
      this.showAlert = false
    },

    toPaymentHistory () {
      this.$router.push({ name: "customer-payment-history" })
    }
  }
}

</script>

<style lang="sass">
  @import "@/common/styles/mixins.sass"

  .customer-select-service
    width: 100%
    height: 100% 
    display: flex
    flex-direction: column
    align-items: center

    &__title
      display: flex
      flex-direction: column
      align-items: center
      margin-top:55px
      @include h6-opensans

    &__card
      width:1050px
      margin-top: 68px
      display: flex
      flex-direction: column
      align-items: center

</style>
