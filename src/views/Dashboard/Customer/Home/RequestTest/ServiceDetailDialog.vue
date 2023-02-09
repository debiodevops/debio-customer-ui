<template lang="pug">
  v-dialog.dialog-service(:value="show" width="440" persistent rounded )
    ui-debio-error-dialog(
      :show="!!error"
      :title="error ? error.title : ''"
      :message="error ? error.message : ''"
      @close="error = null"
    )

    v-card.dialog-service__card
      div.dialog-service__close
        v-btn.fixed-button(icon @click="closeDialog" :disabled="loading")
          v-icon mdi-close

      div.dialog-service__service-image
        ui-debio-avatar( :src="computeAvatar" size="120" rounded)

      div.dialog-service__service-name
        .dialog-service__title {{ selectedService.serviceName }}

      div.dialog-service__service-body
        div.dialog-service__service-description
          .dialog-service__sub-title Description
          .dialog-service__description {{ computeLongDescription }}

        div.dialog-service__service-duration
          .dialog-service__sub-title Expected Duration
          .dialog-service__description          
            div {{ selectedService.duration }} {{ selectedService.durationType}}

      .dialog-service__lab-detail
        .dialog-service__lab-picture
          ui-debio-avatar.dialog-service__lab-image(:src="selectedService.labImage" size="75" rounded)

        .dialog-service__lab-detail-v-info
          .dialog-service__lab-detail-h-info
            .dialog-service__sub-title {{ selectedService.labName }}
            ui-debio-rating(:rating="selectedService.labRate" :total-reviews="selectedService.countRateLab" size="10")

          .dialog-service__address          
            span {{ selectedService.labAddress }}, {{ selectedService.city }}, {{ country(selectedService.country) }}
          .dialog-service__link(v-if="selectedService.labWebsite") 
            b Website: 
            a.dialog-service__link-text(:href="selectedService.labWebsite" target="_blank") {{ selectedService.labWebsite }}

      .dialog-service__button
        ui-debio-button.dialog-service__button-text(
          color="secondary" 
          width="48%"
          height="38" 
          outlined 
          @click="downloadFile"
          :disabled="loading"
        ) Download Sample Report

        ui-debio-button.dialog-service__button-text(
          color="secondary" 
          width="48%"
          height="38" 
          @click="onSelect"
          :loading="loading"
        ) Select This Service

</template>


<script>

import { mapState } from "vuex"
import { getLocations } from "@/common/lib/api"
import CryptoJS from "crypto-js"
import Kilt from "@kiltprotocol/sdk-js"
import { u8aToHex } from "@polkadot/util"
import { queryLastOrderHashByCustomer } from "@debionetwork/polkadot-provider"
import { createOrder } from "@/common/lib/polkadot-provider/command/order.js"

export default {
  name: "ServiceDetailDialog",

  data: () => ({
    countries: [],
    publicKey: "",
    secretKey: "",
    loading: false,
    error: null
  }),

  async mounted() {
    await this.getCountries()
  },

  props: {
    show: Boolean
  },

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData,
      stakingData: (state) => state.lab.stakingData,
      selectedService: (state) => state.testRequest.products,
      web3: (state) => state.metamask.web3,
      polkadotWallet: (state) => state.substrate.polkadotWallet,
      lastEventData: (state) => state.substrate.lastEventData,
      usnBalance: (state) => state.substrate.usnBalance,
      usdtBalance: (state) => state.substrate.usdtBalance
    }),

    computeAvatar() {
      return this.selectedService.serviceImage ? this.selectedService.serviceImage : require("@/assets/debio-logo.png")
    },

    computeLongDescription() {
      if (this.selectedService.longDescription) {
        const description = this.selectedService.longDescription.split("||")[0]
        if (this.web3.utils.isHex(description)) {
          return this.web3.utils.hexToUtf8(description)
        }
        return description
      }
      return ""
    }
  },

  watch: {
    lastEventData(event) {
      if (!event) return

      if (event.method === "OrderCreated") this.toCheckout()
    }
  },

  methods: {
    async getCountries() {
      const { data: { data } } = await getLocations()
      this.countries = data
    },

    async toCheckout() {
      const lastOrder = await queryLastOrderHashByCustomer(
        this.api,
        this.wallet.address
      )

      this.$router.push({
        name: "customer-request-test-checkout", params: { id: lastOrder }
      })
      this.loading = false
    },

    getCustomerPublicKey() {
      const identity = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))
      this.publicKey = u8aToHex(identity.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(identity.boxKeyPair.secretKey)
      return u8aToHex(identity.boxKeyPair.publicKey)
    },

    closeDialog() {
      this.$emit("close")
    },

    async getAssetId(currency) {

      currency === "USDTE" ? "USDT.e" : currency
      let assetId = 0
      const wallet = this.polkadotWallet.find(wallet => wallet?.currency?.toUpperCase() === currency?.toUpperCase())

      assetId = wallet.id
      return assetId
    },

    async onSelect() {
      this.loading = true
      const balance = this.usdtBalance
      if (Number(this.selectedService.totalPrice) >= balance - 0.1) {
        this.error = {
          title: "Insufficient Balance",
          message: "Your transaction cannot succeed due to insufficient balance or do not meet minimum deposit amount, check your account balance"
        }
        this.loading = false
        return
      }

      const customerBoxPublicKey = await this.getCustomerPublicKey()
      const assetId = await this.getAssetId(this.selectedService.currency === "USDTE" ? "USDT.e" : this.selectedService.currency)

      await createOrder(
        this.api,
        this.wallet,
        this.selectedService.serviceId,
        this.selectedService.indexPrice,
        customerBoxPublicKey,
        "RequestTest",
        assetId
      )
    },

    country(country) {
      if (country) {
        return this.countries.filter((c) => c.iso2 === country)[0].name
      }
    },

    downloadFile() {
      window.open(this.selectedService.resultSample)
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .dialog-service
    &__service-image
      display: flex
      justify-content: center
      padding-top: 50px

    &__service-name
      margin-top: 1rem !important
      display: flex
      justify-content: center
      align-content: center

    &__service-body
      margin: 0rem 2.25rem

    &__service-description
      margin-bottom: 1.125rem

    &__title
      display: flex
      align-items: center
      text-align: center
      letter-spacing: 0.0044rem
      margin-bottom: 1.25rem !important
      margin-left: 2.25rem !important
      margin-right: 2.25rem !important
      @include h6-opensans

    &__sub-title
      margin-bottom: 5px
      letter-spacing: -0.0075em
      @include button-2

    &__description
      @include body-text-3-opensans

    &__link
      display: flex
      flex-grow: 0
      margin-top: 10px
      gap: 3px
      @include body-text-3-opensans

    &__link-text
      overflow: hidden
      text-overflow: ellipsis
      white-space: nowrap
    
    &__address
      color: gray
      @include body-text-3-opensans

    &__lab-detail
      display: flex
      gap: 6px
      margin: 10px 35px

    &__lab-detail-h-info
      display: flex
      justify-content: space-between

    &__lab-detail-v-info
      flex: 1
      display: flex
      flex-direction: column
      overflow: hidden
      flex-wrap: nowrap

    &__lab-picture
      flex: 0

    &__button
      margin-top: 15px
      display: flex
      align-items: center
      justify-content: space-between
      padding: 0 35px 40px 35px
      gap: 10px

    &__button-text
      @include body-text-5-opensans

    &__close
      display: flex
      justify-content: flex-end
      padding: 1.013rem !important
    
  .fixed-button
    position: fixed
    width: 50px

      

</style>
