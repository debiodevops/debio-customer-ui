<template lang="pug">
  .genetic-data-result
    ui-debio-icon.genetic-data-result__back(
      :icon="chevronLeftIcon"
      size="20"
      color="#5640A5"
      role="button"
      @click="handlePrevious"
      stroke
    )

    .genetic-data-result__wrapper
      fieldset.file-details
        legend.file-details__title Analysis Info
        h3.file-details__service.mb-4 {{ details.service.name }}
        p.file-details__author.mb-6 {{ computeAnalystName }}
        p.file-details__desc.mb-10 {{ details.geneticData.comment || "No comment yet" }}
        p.file-details__date Last Update: {{ details.geneticData.lastUpdate }}

      .document-viewer
        .document-viewer__wrapper(
          :class="{ 'document-viewer__wrapper--animated': isLoading }"
        )
          h3.document-viewer__loading.text-center(v-if="isLoading") {{ message }}
          embed.document-viewer__content(
              v-if="!isLoading && result"
              :src="`${result}#view=fitH`"
              type="application/pdf"
            )
</template>

<script>
import { mapState } from "vuex"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import { u8aToHex } from "@polkadot/util"
import {
  queryGeneticAnalystByAccountId,
  queryGeneticAnalysisByGeneticAnalysisTrackingId,
  queryGeneticAnalysisOrderById,
  queryGeneticAnalystServicesByHashId
} from "@debionetwork/polkadot-provider"
import { downloadFile, decryptFile, downloadDocumentFile } from "@/common/lib/pinata-proxy"
import { chevronLeftIcon } from "@debionetwork/ui-icons"



export default {
  name: "GeneticDataResult",

  data: () => ({
    chevronLeftIcon,

    isLoading: false,
    publicKey: null,
    secretKey: null,
    result: null,
    message: "Please wait",
    details: {}
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      mnemonicData: (state) => state.substrate.mnemonicData
    }),

    computeAnalystName() {
      return `${this.details?.analyst?.firstName} ${this.details?.analyst?.lastName}`
    }
  },

  watch: {
    mnemonicData(val) {
      if (val) this.initialData()
    }
  },

  async created() {
    if (this.mnemonicData) this.initialData()
  },

  methods: {
    async initialData() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)

      if (cred) await this.prepareData()
    },

    async prepareData() {
      const { serviceId, sellerId, geneticAnalysisTrackingId, status } = await queryGeneticAnalysisOrderById(this.api, this.$route.params.id)
      const geneticData = await queryGeneticAnalysisByGeneticAnalysisTrackingId(this.api, geneticAnalysisTrackingId)

      if (geneticData.status !== "ResultReady" || status === "Refunded") this.$router.push({
        name: "customer-genetic-analysis-detail",
        params: { id: this.$route.params.id }
      })

      const service = await queryGeneticAnalystServicesByHashId(this.api, serviceId)
      const analyst = await queryGeneticAnalystByAccountId(this.api, sellerId)

      const parseDate = (date) => {
        return new Date(parseInt(date.replaceAll(",", ""))).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      }


      this.details = {
        service: service.info,
        analyst: analyst.info,
        geneticData: { ...geneticData, lastUpdate: parseDate(geneticData.updatedAt) }
      }

      this.publicKey = this.details?.analyst?.boxPublicKey

      this.parseResult(geneticData.reportLink)
    },

    async parseResult(recordLink) {
      let fileChunks = []
      let fileType
      const computeFileName = "Result"
      try {
        const pair = { publicKey: this.publicKey, secretKey: this.secretKey }
        this.isLoading = true
        if (/^\[/.test(recordLink)) {
          const links = JSON.parse(recordLink)
          for (let i = 0; i < links.length; i++) {
            const { type, data } = await downloadFile(links[i], true)
            const decryptedFile = decryptFile([data], pair, type)
            fileType = type
            fileChunks = [...fileChunks, ...(decryptedFile ? decryptedFile : [])]
          }
        }
        else {
          const { type, data } = await downloadFile(recordLink, true)
          const decryptedFile = decryptFile([data], pair, type)
          fileType = type
          fileChunks = [...fileChunks, ...(decryptedFile ? decryptedFile : [])]
        }
        const unit8arrays = new Uint8Array(fileChunks)
        await downloadDocumentFile(unit8arrays, computeFileName, fileType)
      } catch {
        this.message = "Oh no! Something went wrong. Please try again later"
      } finally {
        this.isLoading = false
      }
    },

    handlePrevious() {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="sass">
  @import "@/common/styles/mixins.sass"
  @import "@/common/styles/functions.sass"

  .genetic-data-result
    padding: toRem(15px)
    background: #ffffff
    border-radius: toRem(4px)

    &__back
      width: max-content
      border-radius: toRem(4px)
      padding: toRem(5px)
      margin-bottom: toRem(35px)
      background: #F5F7F9

    &__wrapper
      display: flex

  .document-viewer
    width: 100%

    &__wrapper
      display: flex
      align-items: center
      justify-content: center
      padding: toRem(22px)
      min-height: toRem(500px)
      background: #F5F7F9
      border-radius: toRem(4px)

      &--animated
        position: relative
        overflow: hidden

        &::before
          content: ""
          display: block
          position: absolute
          top: 0
          left: 0
          width: toRem(300px)
          height: 100%
          background: rgba(255, 255, 255, .5)
          animation: shine infinite 1s

          @keyframes shine
            0%
              transform: skew(25deg) translateX(toRem(-1000px))
            100%
              transform: skew(25deg) translateX(toRem(1000px))

    &__loading
      &::after
        content: ""
        animation: dots infinite 2s linear

        @keyframes dots
          0%
            content: "."
          50%
            content: ".."
          100%
            content: "..."

    &__content
      width: 100%
      min-height: toRem(700px)
      border-radius: toRem(4px)

  .modal-password
    &__cta
      gap: toRem(20px)

  .file-details
    height: max-content
    margin-right: toRem(35px)
    min-width: toRem(255px)
    max-width: toRem(260px)
    padding: toRem(25px)
    border: solid toRem(1px) #6F4CEC
    border-radius: toRem(4px)

    &__title
      padding: 0 5px
      @include body-text-3

    &__service
      @include body-text-medium-1

    &__author
      @include body-text-3

    &__desc
      @include body-text-3

    &__date
      @include body-text-medium-3
      margin-bottom: 0 !important

</style>
