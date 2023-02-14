<template lang="pug">
  .second-opinion
    .second-opinion__wrapper
      SecondOpinionBanner

      ui-debio-button.second-opinion__button(
        color="#FF8EF4"
        dark
        @click="toRequest"
      ) + Request Second Opinion

      ui-debio-data-table.second-opinion__table(
        :headers="headers"
        :loading="isLoading"
        :items="items"
      )

        template(slot="prepend")
          .second-opinion__table-title Requested Opinion
          .second-opinion__table-description List of My Requested Opinion(s)

        template(v-slot:[`item.category`]="{ item }")
          .d-flex.flex-column.second-opinion__table-headers-category
            span {{ item.info.category }}

        template(v-slot:[`item.description`]="{ item }")
          .d-flex.flex-column.second-opinion__table-headers-description
            span {{ item.info.description }}

        template(v-slot:[`item.grantedPHR`]="{ item }")
          .second-opinion__table-headers-PHR
            .second-opinion__table-headers-PHR-content(v-for="(grantedPHR, idx) in item.electronicMedicalRecordDetails")
              v-alert.second-opinion__table-alert(color="#F9F5FF" )
                span.second-opinion__table-alert-text {{ grantedPHR.title }}

        template(v-slot:[`item.opinionAvailable`]="{ item }")
          .d-flex.flex-column.second-opinion__table-headers-opinion
          span {{ item.info.opinionIds.length }}

        template(v-slot:[`item.action`]="{ item }")
          ui-debio-button.second-opinion__table-button(
            color="#FF8EF4" 
            dark
            text
            width="120px"
            height="35"
            style="font-size: 6px;"
            @click="toMyriad(item.info.myriadPostId)"
          ) Visit My Request


      ui-debio-modal(
        :show="isNotInstalled"
        :show-title="false"
        :show-cta="false"
        @onClose="isNotInstalled = false"
      )
        h2.mt-5 Install Polkadot Extension
        ui-debio-icon.mb-8(:icon="alertTriangleIcon" stroke size="80")
        p.second-opinion__modal-subtitle Press install Polkadot Extensions button below to continue, your second opinion will be redirected to myriad.social platform.

        ui-debio-button(
          block
          color="secondary"
          @click="toInstall"
        ) Install

        
</template>

<script>
import { mapState } from "vuex"
import SecondOpinionBanner from "./Banner"
import { alertTriangleIcon } from "@debionetwork/ui-icons"
import { isWeb3Injected } from "@polkadot/extension-dapp"
import { queryOpinionRequestorByOwner, queryOpinionRequestor } from "@/common/lib/polkadot-provider/query/opinion-requestor"
import { queryElectronicMedicalRecordById } from "@debionetwork/polkadot-provider"
import getEnv from "@/common/lib/utils/env"

export default {
  name: "SecondOpinion",

  components: { SecondOpinionBanner },

  data: () => ({
    headers: [
      {
        text: "Category",
        value: "category",
        sortable: true
      },
      {
        text: "Symptom Description",
        value: "description",
        sortable: true
      },
      {
        text: "Granted Health Record",
        value: "grantedPHR",
        sortable: true
      },
      {
        text: "Opinion Available",
        value: "opinionAvailable",
        sortable: true
      },
      {
        text: "Action",
        value: "action",
        sortable: true
      }
    ],
    items: [],
    isNotInstalled: false,
    alertTriangleIcon,
    isLoading: false
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet
    })
  },

  async mounted() {
    await this.fetchSecondOpinionData()
  },

  methods: {
    async toRequest() {
      this.isNotInstalled = !isWeb3Injected

      if (!this.isNotInstalled) {
        this.$router.push({ name: "second-opinion-request" })
      }
    },

    async toMyriad(id) {
      window.open(`${getEnv("VUE_APP_MYRIAD_URL")}/login?redirect=${getEnv("VUE_APP_MYRIAD_URL")}%2Fpost%2F${id}`)
    },

    async toInstall() {
      window.open("https://polkadot.js.org/extension/", "_blank")
    },

    async fetchSecondOpinionData() {
      const data = await queryOpinionRequestorByOwner(this.api, this.wallet.address)
      for (let i = 0; i < data.length; i++) {
        const item = await queryOpinionRequestor(this.api, data[i])
        const electronicMedicalRecordDetails = [] 
        const electronicMedicalRecordIds = item.info.electronicMedicalRecordIds
        for (let j = 0; j < electronicMedicalRecordIds.length; j++) {
          const detail = await queryElectronicMedicalRecordById(this.api, electronicMedicalRecordIds[j])
          electronicMedicalRecordDetails.push(detail)
        }
        this.items.unshift({...item, electronicMedicalRecordDetails})
      }
    }
  }
}

</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
 
  .second-opinion
    &__wrapper
      height: 100%

    &__button
      margin: 30px 0
      font-size: 12px

    &__modal-subtitle
      max-width: 280px
      @include body-text-2-opensans

    &__table-title
      @include button-1

    &__table-headers-category
      width: 102px

    &__table-headers-description
      width: 360px
      height: 48px
      margin: 16px
    
    &__table-description
      margin-top: 16px
      @include body-text-4

    &__table-headers-PHR
      display: flex
      width: 241px 
      gap: 10px


    &__table-headers-PHR-content
      max-width: 120px

    &__table-alert
      padding: 2px 8px
      border-radius: 16px

    &__table-alert-text
      color: #6941C6
      font-size: 12px
      font-weight: 0 !important

    &__table-headers-opinion
      width: 32px

    &__table-button
      width: 140px
      padding: 2px
      text-transform: none !important



</style>



