<template lang="pug">
v-container
  ui-debio-card(width="100%")
    v-row.resultBody
      v-col(cols="12" md="9")
        .test-result__viewer
          .test-result__viewer-wrapper(
            :class="{ 'test-result__viewer-wrapper--animated': resultLoading }"
          )
            h3.test-result__viewer-loading.text-center(v-if="resultLoading") {{ message }}
            embed.test-result__viewer-content(
              v-if="!resultLoading && result"
              :src="`${result}#toolbar=0&navpanes=0&scrollbar=0`"
              type="application/pdf"
            )

      v-col(cols="12" md="3")
        div.buttonSection(v-for="file in files" :key="file.name")
          ui-debio-card(
            :title="file.fileTitle"
            :sub-title="file.fileSubTitle"
            tiny-card
            with-icon
            role="button"
            @click="actionDownload(file.fileLink)"
          )
            ui-debio-icon(
              slot="icon"
              size="33"
              :icon="downloadIcon"
              stroke
              color="#c400a5"
            )

        ui-debio-card(
          v-if="!ratingTestResult"
          class="mt-2"
          tiny-card
          with-icon
          title="Rating"
          sub-title="Help us improve your test experience by rating this service"
          @click="actionRating"
          )
            ui-debio-icon(
              size="33"
              slot="icon"
              :icon="starIcon"
              stroke
              color="#c400a5"
            )
        ui-debio-card(
          v-else
          class="mt-2"
          tiny-card
          with-icon
          :title="ratingTitle"
          :sub-title="ratingSubTitle"
          )
            ui-debio-rating(
              :size="33"
              :total-rating="ratingTestResult"
              :with-reviewers="false"
            )

  ui-debio-modal(
    :show="showModalRating"
    :cta-action="submitRating"
    title="Please tell us about your experience!"
    cta-title="Submit"
    @onClose="showModalRating = false"
  )
    template
      ui-debio-rating(
        :size="33"
        :total-rating="5"
        :with-reviewers="false"
        interactive
        @input="getRating"
      )
      ui-debio-textarea(
        :rules="$options.rules.review"
        variant="small"
        label="Write a review"
        placeholder="Write a review"
        v-model="review"
        validate-on-blur
        outlined
        block
      )

  ui-debio-modal(
    :show="showModal"
    :icon="checkCircleIcon"
    :cta-action="closeModal"
    :title="modalTitle"
    cta-title="OK"
    @onClose="showModal = false"
  )

</template>

<script>
import { mapState } from "vuex"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import { queryDnaTestResults } from "@debionetwork/polkadot-provider"
import { queryLabById } from "@debionetwork/polkadot-provider"
import { generalDebounce } from "@/common/lib/utils"
import { downloadFile, decryptFile, downloadDocumentFile, getIpfsMetaData } from "@/common/lib/pinata-proxy"
import { queryOrderDetailByOrderID, queryServiceById } from "@debionetwork/polkadot-provider"
import { u8aToHex } from "@polkadot/util"
import { submitRatingOrder, getRatingByOrderId } from "@/common/lib/api"
import { downloadIcon, debioIcon, creditCardIcon, starIcon, checkCircleIcon } from "@debionetwork/ui-icons"
import errorMessage from "@/common/constants/error-messages"

export default {
  name: "TestResult",

  data: () => ({
    downloadIcon,
    debioIcon,
    creditCardIcon,
    starIcon,
    checkCircleIcon,
    errorMessage,

    privateKey: "",
    publicKey: "",
    idOrder: "",
    ownerAddress: "",
    testResult: {},
    services: [],
    rating: 0,
    review: "",
    ratingTitle: "",
    message: "Please wait",
    ratingSubTitle: "",
    ratingTestResult: null,
    lab: null,
    order: null,
    serviceName: "",
    result: null,
    serviceCategory: "",
    resultLoading: false,
    showModal: false,
    showModalRating: false,
    files: []
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData
    }),

    reportResult() {
      if (this.dialog) {
        return ""
      }

      if (this.resultLoading) {
        return "Decrypting report.."
      }

      return this.result ? this.result : "No report available for this result"
    },

    modalTitle() {
      return `Thank you! ${"\n"} Your feedback has been sent`
    }
  },

  watch: {
    mnemonicData(val) {
      if (val) this.initialData()
    }
  },

  async created() {
    this.resultLoading = true
    this.idOrder = this.$route.params.id
    this.ownerAddress = this.wallet.address
    if (this.mnemonicData) await this.initialData()
  },

  methods: {
    async initialData() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.privateKey = u8aToHex(cred.boxKeyPair.secretKey)

      if (cred) await this.prepareData()
    },

    async prepareData() {
      await this.getRatingTestResult()
      await this.getTestResult()
      await this.getLabServices()
      await this.getFileUploaded()
      await this.parseResult()
    },

    async getRatingTestResult() {
      try {
        const data = await getRatingByOrderId(this.idOrder)
        this.ratingTestResult = data?.rating
        this.ratingTitle = `Rating ${this.ratingTestResult},0`
        this.ratingSubTitle = data?.review
      } catch (error) {
        console.error(error)
      }
    },

    async getTestResult() {
      try {
        this.order = await queryOrderDetailByOrderID(this.api, this.idOrder)
        this.ownerAddress = this.order.customerEthAddress

        this.testResult = await queryDnaTestResults(
          this.api,
          this.order.dnaSampleTrackingId
        )
      } catch (error) {
        this.resultLoading = false
        console.error(error)
      }
    },

    async getLabServices() {
      try {
        this.lab = await queryLabById(this.api, this.testResult.labId)
        this.services = await queryServiceById(this.api, this.order.serviceId)

        this.publicKey = this.lab.info.boxPublicKey
        this.serviceCategory = this.services.info.category
        this.serviceName = this.services.info.name
      } catch (error) {
        this.resultLoading = false
        this.services = []
        console.error(error)
      }
    },

    async getFileUploaded() {
      try {
        if (this.testResult.reportLink !== "") {
          this.files.push({
            fileType: "report",
            fileName: this.serviceName + " Report",
            fileLink: this.testResult.reportLink,
            fileTitle: "Download Report",
            fileSubTitle: "Download Your Test Report"
          })
        }

        if (this.testResult.resultLink !== "") {
          this.files.push({
            fileType: "result",
            fileName: this.serviceName + " Result",
            fileLink: this.testResult.resultLink,
            fileTitle: "Download Raw Data",
            fileSubTitle: "Download Your Genomic Data"
          })
        }
      } catch (error) {
        this.resultLoading = false
        console.error(error)
      }
    },

    async parseResult() {
      try {
        const path = this.files[0].fileLink
        const pair = { secretKey: this.privateKey, publicKey: this.publicKey }
        let fileChunks = [];
        let fileType
        let name

        if (/^\[/.test(path)) {
          const links = JSON.parse(path);
          for (let i = 0; i < links.length; i++) {
            const { rows } = await getIpfsMetaData(links[i].split("/").pop())
            const { type, data } = await downloadFile(links[i], true)
            const decryptedFile = decryptFile([data], pair, type)
            fileChunks = [...fileChunks, ...(decryptedFile ? decryptedFile : [])]
            fileType = type
            if (i === 0) {
              name = rows             
            }         
          }
          const unit8arrays = new Uint8Array(fileChunks)
          await downloadDocumentFile(unit8arrays, name[0].metadata.name, fileType)

        }
        else {
          const { type, data } = await downloadFile(path, true)
          const decryptedFile = decryptFile([data], pair, type)
          fileChunks = [...fileChunks, ...(decryptedFile ? decryptedFile : [])]
          const unit8arrays = new Uint8Array(fileChunks)
          await downloadDocumentFile(unit8arrays, name[0].metadata.name, fileType)
        }
        
        this.resultLoading = false
      } catch (error) {
        this.resultLoading = false
        console.error(error)
      }
    },

    actionDownload: generalDebounce(async function (link) {
      try {
        const pair = { secretKey: this.privateKey, publicKey: this.publicKey }
        let fileChunks = []
        let name 
        let fileType 
        if (/^\[/.test(link)) {
          const links = JSON.parse(link);
          for (let i = 0; i < links.length; i++) {
            const { rows } = await getIpfsMetaData(links[i].split("/").pop())
            const { type, data } = await downloadFile(links[i], true)
            const decryptedFile = decryptFile([data], pair, type)
            fileType = type
            fileChunks = [...fileChunks, ...(decryptedFile ? decryptedFile : [])]
            if (i === 0) {
              name = rows
            }
            
          }
          const unit8arrays = new Uint8Array(fileChunks)
          await downloadDocumentFile(unit8arrays, name[0].metadata.name, fileType)

        }
        else {
          const { rows } = await getIpfsMetaData(link.split("/").pop())
          const { type, data } = await downloadFile(link, true)
          const decryptedFile = decryptFile([data], pair, type)
          fileChunks = [...fileChunks, ...(decryptedFile ? decryptedFile : [])]
          const unit8arrays = new Uint8Array(fileChunks)
          await downloadDocumentFile(unit8arrays, rows[0].metadata.name, type)
        }
      } catch (error) {
        console.error(error)
      }
    }, 500),

    actionRating() {
      this.showModalRating = true
    },

    closeModal(){
      this.$emit("showModal", false)
      this.showModal = false
    },

    getRating(stars) {
      this.rating = stars
    },

    async submitRating() {
      try {
        const data = await submitRatingOrder(
          this.testResult.labId,
          this.order.serviceId,
          this.testResult.orderId,
          this.order.customerId,
          this.rating,
          this.review
        )

        this.ratingTestResult = data.rating
        this.ratingTitle = `Rating ${this.ratingTestResult},0`
        this.ratingSubTitle = data.review

        this.showModalRating = false
        this.showModal = true
      } catch (error) {
        this.showModalRating = false
        this.showModal = true
        console.error(error)
      }
    }
  },

  rules: {
    document: {
      review: [ val => !!val || errorMessage.REQUIRED ]
    }
  }
}
</script>

<style lang="sass">
  .resultBody
    margin: 25px 0 0 0
  .buttonSection
    margin: 8px 0 45px 0
  .v-card__text
    height: 500px

  .test-result
    &__viewer
      width: 100%

    &__viewer-wrapper
      display: flex
      align-items: center
      justify-content: center
      padding: 22px
      min-height: 500px
      background: #F5F7F9
      border-radius: 4px

      &--animated
        position: relative
        overflow: hidden

        &::before
          content: ""
          display: block
          position: absolute
          top: 0
          left: 0
          width: 300px
          height: 100%
          background: rgba(255, 255, 255, .5)
          animation: shine infinite 1s

          @keyframes shine
            0%
              transform: skew(25deg) translateX(-1000px)
            100%
              transform: skew(25deg) translateX(1000px)

    &__viewer-loading
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

    &__viewer-content
      width: 100%
      min-height: 700px
      border-radius: 4px

</style>
