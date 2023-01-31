<template lang="pug">
.customer-phr
  ui-debio-error-dialog(
    :show="!!error"
    :title="error ? error.title : ''"
    :message="error ? error.message : ''"
    @close="error = null"
  )

  ui-debio-modal(
    :show="showModal"
    :show-title="false"
    @onClose="showModal = false"
  )
    h2.mb-10 Delete
    ui-debio-icon.mb-8(:icon="alertTriangleIcon" stroke size="80")
    p.modal-password__subtitle(v-if="selectedFile") You might not be retrieved back, are you sure you want to delete selected Health Record ?

    p.modal-password__tx-info.mb-0.d-flex
      span.modal-password__tx-text.mr-6.d-flex.align-center
        | Estimated transaction weight
        ui-debio-icon.ml-1(
          :icon="alertIcon"
          size="14"
          stroke
          @mouseenter="handleShowTooltip"
        )
        span.modal-password__tooltip(
          @mouseleave="handleShowTooltip"
          :class="{ 'modal-password__tooltip--show': showTooltip }"
        ) Total fee paid in DBIO to execute this transaction.
      span.modal-password__tx-value {{ txWeight }}

    .modal-password__cta.d-flex(slot="cta")
      ui-debio-button(
        block
        color="secondary"
        :loading="isLoading"
        @click="onDelete"
      ) Delete

  ui-debio-banner(
    title="My Health Record "
    subtitle="A collection of your personal health records that includes your medical history, such as diagnoses, treatment plans, immunizations, allergies, radiology and laboratory results."
    gradient-color="primary"
    with-decoration
  )
    template(slot="illustration")
      ui-debio-icon.banner-illustration(:icon="analiticIllustration" :size="cardBlock ? 250 : 180" view-box="0 0 252 252" fill)

    template(slot="cta")
      .banner-card
        router-link.banner-card__container(:to="{name: 'customer-phr-create'}")
          ui-debio-icon.banner-card__icon(
            :icon="partialBookGradient"
            size="50"
          )
          .banner-card__text Upload Personal Health Record

  ui-debio-data-table(
    :headers="headers"
    :loading="isLoading"
    :items="phrDocuments"
  )
    template(slot="prepend")
      .customer-phr__nav
        .customer-phr__nav-text
          h2.customer-phr__title My Personal Health Record List
          p.customer-phr__subtitle.mb-0 List of My Personal Health Records
    template(v-slot:[`item.title`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__document-title(:title="item.title") {{ item.title }}

    template(v-slot:[`item.category`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__document-category(:title="item.category") {{ item.category }}

    template(v-slot:[`item.documentTitle`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__file-title(v-for="(file, idx) in item.files" :title="file.title") {{ idx + 1 }}. {{ file.title }}

    template(v-slot:[`item.documentDescription`]="{ item }")
      .d-flex.flex-column
        span.customer-phr__file-description(v-for="(file, idx) in item.files" :title="file.description") {{ idx + 1 }}. {{ file.description }}

    template(v-slot:[`item.createdAt`]="{ item }")
      span {{ item.createdAt }}

    template(v-slot:[`item.actions`]="{ item }")
      .customer-phr__actions
        ui-debio-icon(:icon="pencilIcon" size="16" role="button" stroke @click="onEdit(item)")
        ui-debio-icon(:icon="eyeIcon" size="16" role="button" stroke @click="onDetails(item)")
        ui-debio-icon(:icon="trashIcon" size="16" role="button" stroke @click="handleOpenModalDelete(item)")
</template>

<script>
import { mapState } from "vuex"
import {
  layersIcon,
  analiticIllustration,
  eyeIcon,
  pencilIcon,
  eyeOffIcon,
  alertTriangleIcon,
  alertIcon,
  trashIcon,
  downloadIcon,
  partialBookGradient
} from "@debionetwork/ui-icons"
import {
  queryElectronicMedicalRecordByOwnerId,
  queryElectronicMedicalRecordFileById,
  deregisterElectronicMedicalRecord,
  deregisterElectronicMedicalRecordFee
} from "@debionetwork/polkadot-provider"
import CryptoJS from "crypto-js"
import Kilt from "@kiltprotocol/sdk-js"
import { u8aToHex } from "@polkadot/util"
import { errorHandler } from "@/common/lib/error-handler"

export default {
  name: "CustomerPHR",

  data: () => ({
    layersIcon,
    analiticIllustration,
    eyeIcon,
    pencilIcon,
    eyeOffIcon,
    trashIcon,
    downloadIcon,
    alertIcon,
    alertTriangleIcon,
    partialBookGradient,
    cardBlock: false,
    showModal: false,
    showModalPassword: false,
    showPassword: false,
    showTooltip: false,
    selectedFile: null,
    error: null,
    txWeight: null,
    publicKey: null,
    secretKey: null,
    headers: [
      {
        text: "Health Record Title",
        value: "title",
        sortable: true
      },
      {
        text: "Category",
        value: "category",
        sortable: true
      },
      {
        text: "Document Title",
        value: "documentTitle",
        sortable: true
      },
      {
        text: "Description",
        value: "documentDescription",
        sortable: true
      },
      {
        text: "Upload Date",
        value: "createdAt",
        align: "center",
        sortable: true
      },
      {
        text: "Action",
        value: "actions",
        align: "center"
      }
    ],
    phrDocuments: []
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData,
      lastEventData: (state) => state.substrate.lastEventData,
      loadingData: (state) => state.auth.loadingData,
      web3: (state) => state.metamask.web3
    })
  },

  watch: {
    lastEventData() {
      if (this.lastEventData !== null) {
        const dataEvent = JSON.parse(this.lastEventData.data.toString())

        if (this.lastEventData.method === "ElectronicMedicalRecordRemoved") {
          if (dataEvent[1] === this.wallet.address) this.getPHRHistory()
        }
      }
    },

    mnemonicData(val) {
      if (val) this.initialDataKey()
    }
  },

  mounted() {
    window.addEventListener("resize", () => {
      if (window.innerWidth <= 959) this.cardBlock = true
      else this.cardBlock = false
    })
  },

  async created() {
    if (this.mnemonicData) this.initialDataKey()
    await this.getPHRHistory()
  },

  methods: {
    initialDataKey() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async getPHRHistory() {
      this.showModal = false
      this.isLoading = true
      const documents = []

      try {
        const dataPHR = await queryElectronicMedicalRecordByOwnerId(this.api, this.wallet.address)

        if (dataPHR !== null || !dataPHR?.length) {
          const listPHR = dataPHR.reduce((filtered, current) => {
            if (filtered.every(v => v.id !== current.id)) filtered.push(current)

            return filtered
          }, [])

          listPHR.reverse()

          for (const phrDetail of listPHR) {
            const documentDetail = await this.preparePHRData(phrDetail)
            documents.push(documentDetail)
          }
        }

        this.phrDocuments = documents
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        console.error(error);
      }
    },

    async preparePHRData(dataPHR) {
      let files = []

      for (let i = 0; i < dataPHR.files?.length; i++) {
        const file = await queryElectronicMedicalRecordFileById(this.api, dataPHR.files[i])

        dataPHR.createdAt = new Date(+file.uploadedAt.replaceAll(",", "")).toLocaleDateString("id", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })

        files.push({
          ...file,
          createdAt: new Date(+file.uploadedAt.replaceAll(",", "")).toLocaleDateString("id", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          recordLink: file.recordLink
        })
      }

      return {
        id: dataPHR.id,
        title: dataPHR.title,
        category: dataPHR.category,
        createdAt: dataPHR.createdAt,
        files: files?.slice(0, 3)
      }
    },

    onEdit(phr) {
      this.$router.push({ name: "customer-phr-edit", params: { id: phr.id } })
    },

    onDetails(phr) {
      this.$router.push({ name: "customer-phr-details", params: { id: phr.id } })
    },

    handleShowPassword() {
      this.showPassword = !this.showPassword
    },

    async handleOpenModalDelete(item) {
      this.selectedFile = item
      this.showModal = true

      const txWeight = await deregisterElectronicMedicalRecordFee(this.api, this.wallet, item.id)
      this.txWeight = `${Number(this.web3.utils.fromWei(String(txWeight.partialFee), "ether")).toFixed(4)} DBIO`
    },

    handleShowTooltip(e) {
      if (e.type === "mouseenter") {
        this.showTooltip = true
      } else {
        this.showTooltip = false
      }
    },

    async onDelete() {
      const { id } = this.selectedFile
      this.isLoading = true

      try {
        await deregisterElectronicMedicalRecord(this.api, this.wallet, id)
        this.error = null
        this.selectedFile = null
      } catch (e) {
        const error = await (errorHandler(e.message))
        this.isLoading = false
        this.error = error
      }
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
  @import "@/common/styles/function.sass"

  .customer-phr
    display: flex
    flex-direction: column
    gap: 30px

    &__actions
      display: flex
      align-items: center
      justify-content: center
      gap: 20px

    &::v-deep
      .banner__subtitle
        max-width: 36.188rem !important

      .ui-debio-modal__card
        gap: 20px

    &__document-title,
    &__document-category,
    &__file-title,
    &__file-description
      max-width: 150px
      white-space: pre
      overflow: hidden
      text-overflow: ellipsis

    .modal-password
      &__subtitle
        max-width: 280px
        @include body-text-2-opensans

      &__tx-text,
      &__tx-value
        position: relative
        @include body-text-3-opensans

      &__tooltip
        max-width: 143px
        padding: 10px
        position: absolute
        top: 35px
        z-index: 10
        background: #fff
        border: 1px solid #D3C9D1
        right: -120px
        transition: all .3s ease-in-out
        visibility: hidden
        opacity: 0
        @include tiny-reg

        &::after
          position: absolute
          content: ""
          display: block
          top: -20px
          height: 20px
          border-color: transparent transparent #FFF transparent
          border-style: solid
          border-width: 8px

        &::before
          position: absolute
          content: ""
          display: block
          top: -21px
          height: 20px
          border-color: transparent transparent #D3C9D1 transparent
          border-style: solid
          border-width: 8px

        &--show
          opacity: 1
          visibility: visible

      &__cta
        gap: 20px

  .banner-card
    display: flex

    &__container
      margin-left: 80px
      width: toRem(220px)
      height: toRem(100px)
      border-radius: toRem(4px)
      backdrop-filter: blur(20px)
      -webkit-backdrop-filter: blur(20px)
      background: rgba(255, 255, 255, .9)
      position: relative
      z-index: 2
      display: inherit
      text-decoration: none
      align-items: center
      justify-content: center
      overflow: hidden
      transition: 250ms ease-in-out

      &:hover
        border: solid 1.9px transparent
        text-shadow: -3px 4px 5px rgba(0, 0, 0, .1)
        box-shadow: 0 1px 2px rgba(252, 146, 233, .4), 0 2px 4px rgba(252, 146, 233, .4), 0 4px 8px rgba(252, 146, 233, .4), 0 8px 16px rgba(252, 146, 233, .4) inset

      &:not(:last-of-type)
        margin-right: toRem(20px)

    &__icon
      margin-right: toRem(24px)

      &::v-deep
        svg
          transition: 250ms ease-in-out
          filter: drop-shadow(rgba(252, 146, 233, .045) -1px 1px) drop-shadow(rgba(252, 146, 233, .045) -2px 2px) drop-shadow(rgba(252, 146, 233, .045) -3px 3px) drop-shadow(rgba(252, 146, 233, .045) -3px 3px) drop-shadow(rgba(252, 146, 233, .045) -4px 4px) drop-shadow(rgba(252, 146, 233, .045) -5px 5px) drop-shadow(rgba(252, 146, 233, .045) -6px 6px) drop-shadow(rgba(252, 146, 233, .045) -7px 7px) drop-shadow(rgba(252, 146, 233, .045) -8px 8px) drop-shadow(rgba(252, 146, 233, .045) -9px 9px) drop-shadow(rgba(252, 146, 233, .045) -10px 10px) drop-shadow(rgba(252, 146, 233, .045) -11px 11px) drop-shadow(rgba(252, 146, 233, .045) -12px 12px) drop-shadow(rgba(252, 146, 233, .045) -13px 13px) drop-shadow(rgba(252, 146, 233, .045) -14px 14px) drop-shadow(rgba(252, 146, 233, .045) -15px 15px) drop-shadow(rgba(252, 146, 233, .045) -16px 16px) drop-shadow(rgba(252, 146, 233, .045) -17px 17px) drop-shadow(rgba(252, 146, 233, .045) -18px 18px) drop-shadow(rgba(252, 146, 233, .045) -19px 19px) drop-shadow(rgba(252, 146, 233, .045) -20px 20px) drop-shadow(rgba(252, 146, 233, .045) -21px 21px) drop-shadow(rgba(252, 146, 233, .045) -22px 22px) drop-shadow(rgba(252, 146, 233, .045) -23px 23px)

    &__text
      color: #595959
      max-width: toRem(115px)
      @include button-2
      
</style>
