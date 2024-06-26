<template lang="pug">
  .genetic-data-add
    .genetic-data-add__wrapper
      ui-debio-error-dialog(
        :show="!!error"
        :title="error ? error.title : ''"
        :message="error ? error.message : ''"
        @close="error = null"
      )

      .genetic-data-add__title {{ isEdit ? "Edit Genetic Data" : "Add Genetic Data"}}
      .genetic-data-add__forms(v-if="loadingData" )
        v-skeleton-loader(
          v-bind="attrs"
          type="table-cell, list-item, table-cell, list-item-three-line, text, table-heading, text, card-heading "
        )

      .genetic-data-add__forms(v-if="!loadingData" )
        ui-debio-input(
          :rules="$options.rules.document.title"
          v-model="document.title"
          variant="small"
          label="Title"
          placeholder="Add title"
          outlined
          block
          validate-on-blur
        )

        ui-debio-textarea(
          :rules="$options.rules.document.description"
          v-model="document.description"
          variant="small"
          label="Description"
          placeholder="Add Description"
          outlined
          block
          validate-on-blur
        )

        .genetic-data-add__files-title.mt-5(v-if="!document.file")
          p File Information
          p.mb-0 Before uploading the document, please ensure that all personal data is removed or redacted.

        ui-debio-file(
          withTooltip
          tooltipDesc="To upload file that bigger than 200 MB, you may compress the file into a .zip, .rar, .7zip file"
          v-model="document.file"
          variant="small"
          :rules="$options.rules.document.file"
          :accept="['.txt', '.vcf', '.gz', '.zip', '.rar', '.7zip']"
          label="Upload File"
          label-rules="(.vcf.gz, .vcf, .txt - Maximum file size is 200MB)"
          placeholder="Choose File"
          validate-on-blur
        )
        .genetic-data-add__tx-weight
          span.genetic-data-add__tx-weight-text Estimated transaction weight
            v-tooltip.visible(right)
              template(v-slot:activator="{ on, attrs }")
                v-icon.genetic-data-add__trans-weight-icon(
                  color="primary"
                  dark
                  v-bind="attrs"
                  v-on="on"
                ) mdi-alert-circle-outline
              span(style="font-size: 10px;") Total fee paid in DBIO to execute this transaction.

          span( style="font-size: 12px;" ) {{ txWeight }} 

        ui-debio-button(
          :disabled="!disable"
          block
          color="secondary"
          @click="onSubmit"
        ) Submit

      UploadingDialog(
        :show="isLoading"
        type="Uploading"
        :file="document.file"
        :isFailed="isFailed"
        :totalChunks="totalChunks"
        :currentChunkIndex="currentChunkIndex"
        @retry-upload="retryUpload" 
      )


      SuccessDialog(
        :show="isSuccess"
        title="Success"
        :orderId="orderId"
        @close="closeDialog"
      )

      ui-debio-modal(
        :show="isUpdated"
        :width="289"
        title="Success"
        cta-title="Back to Dashboard"
        :cta-outlined="false"
        :cta-action="toDashboard"
        @onClose="toDashboard"
      )
        ui-debio-icon(
          :icon="checkCircleIcon"
          size="90"
          color="#c400a5"
          stroke
        )

        p.genetic-data-add__modal-text Your genetic data has been edited successfully

</template>

<script>
import { mapState } from "vuex"
import { u8aToHex } from "@polkadot/util"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import cryptWorker from "@/common/lib/ipfs/crypt-worker"
import {
  queryGeneticDataById,
  addGeneticData,
  updateGeneticData,
  addGeneticDataFee,
  updateGeneticDataFee,
  createGeneticAnalysisOrder
} from "@debionetwork/polkadot-provider"
import rulesHandler from "@/common/constants/rules"
import { validateForms } from "@/common/lib/validate"
import { generalDebounce } from "@/common/lib/utils"
import { checkCircleIcon } from "@debionetwork/ui-icons"
import SuccessDialog from "@/common/components/Dialog/SuccessDialog"
import { errorHandler } from "@/common/lib/error-handler"
import UploadingDialog from "@/common/components/Dialog/UploadingDialog"
import { downloadFile, uploadFile, getFileUrl } from "@/common/lib/pinata-proxy"
import store from "@/store"
import Web3 from "web3"



export default {
  name: "AddGeneticData",

  components: { SuccessDialog, UploadingDialog },

  mixins: [validateForms],

  data: () => ({
    secretKey: null,
    publicKey: null,
    document: {
      title: "",
      description: "",
      file: null
    },
    isEdit: false,
    isSuccess: false,
    checkCircleIcon,
    links: [],
    link: null,
    txWeight: null,
    isLoading: false,
    dataId: null,
    error: null,
    orderId: null,
    isUpdated: false,
    loadingData: false,
    totalChunks: 0,          // Initialize totalChunks
    currentChunkIndex: 0,    // Initialize currentChunkIndex
    isFailed: false
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      walletBalance: (state) => state.substrate.walletBalance,
      mnemonicData: (state) => state.substrate.mnemonicData,
      lastEventData: (state) => state.substrate.lastEventData
    }),
    disable() {
      const { title, description, file } = this.document
      return !title, description, file
    }
  },

  rules: {
    document: {
      title: [
        rulesHandler.FIELD_REQUIRED,
        rulesHandler.ENGLISH_ALPHABET,
        rulesHandler.MAX_CHARACTER(50)
      ],
      description: [
        rulesHandler.FIELD_REQUIRED,
        rulesHandler.ENGLISH_ALPHABET,
        rulesHandler.MAX_CHARACTER(255)
      ],
      file: [
        rulesHandler.FIELD_REQUIRED,
        rulesHandler.FILE_SIZE(211000000)
      ]
    }
  },


  async created() {
    if (this.mnemonicData) this.initialDataKey()
  },

  async mounted() {
    if (this.$route.params.id) {
      this.isEdit = true
      this.dataId = this.$route.params.id
    }

    await this.getDetails()
    await this.getTxWeight()
  },

  watch: {
    mnemonicData(val) {
      if (val) this.initialDataKey()
    },

    lastEventData(e) {
      if (e !== null) {
        const dataEvent = JSON.parse(e.data.toString())
        if (e.method === "GeneticDataAdded") {
          if (dataEvent[1] === this.wallet.address) {
            this.isLoading = false
            this.orderId = dataEvent[0].id
            this.isSuccess = true
          }
        } else if (e.method === "GeneticDataUpdated") {
          if (dataEvent[1] === this.wallet.address) {
            this.isLoading = false
            this.isUpdated = true
          }
        }
      }
    },

    document: {
      deep: true,
      immediate: true,
      handler: generalDebounce(async function () {
        await this.getTxWeight()
        if (this.document.file) {
          this.loadingData = false
        }
      }, 500)
    }
  },

  methods: {
    retryUpload() {
      // Reset the progress state and retry the upload process
      this.totalChunks = 0;
      this.currentChunkIndex = 0;
      this.isFailed = false;

      // Retry the upload process (you should have your original upload code here)
      this.onSubmit();
    },

    async getDetails() {
      this.loadingData = true
      try {
        const detail = await queryGeneticDataById(this.api, this.dataId)
        this.document.title = detail.title
        this.document.description = detail.description
        const link = JSON.parse(detail.reportLink)
        const fileName = link[0].split("/").pop()
        const res = await downloadFile(link[0])

        let { box, nonce } = res.data.data
        box = Object.values(box) // Convert from object to Array
        nonce = Object.values(nonce) // Convert from object to Array

        const toDecrypt = {
          box: Uint8Array.from(box),
          nonce: Uint8Array.from(nonce)
        }
        console.log("Decrypting...")
        const decryptedObject = await Kilt.Utils.Crypto.decryptAsymmetric(
          toDecrypt,
          this.publicKey,
          this.secretKey
        )

        const blob = new Blob([decryptedObject], { type: "text/directory" })
        console.log("Decrypted!")
        this.document.file = new File([blob], fileName)
      } catch (error) {
        console.error(error)
        this.loadingData = false
      }
    },

    initialDataKey() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))
      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async encrypt({ text, fileType, fileName, fileSize }) {
      const context = this
      const arrChunks = []
      let chunksAmount
      const pair = {
        secretKey: this.secretKey,
        publicKey: this.publicKey
      }

      return await new Promise((res, rej) => {
        try {
          cryptWorker.workerEncryptFile.postMessage({
            pair,
            text,
            fileType
          })

          cryptWorker.workerEncryptFile.onmessage = async (event) => {
            if (event.data.chunksAmount) {
              chunksAmount = event.data.chunksAmount
              return
            }

            arrChunks.push(event.data)
            context.encryptProgress = (arrChunks.length / chunksAmount) * 100
            

            if (arrChunks.length === chunksAmount) {
              res({
                fileName,
                fileType,
                fileSize,
                chunks: arrChunks
              })
            }
          }
        } catch (e) {
          rej(new Error(e.message))
        }
      })

    },


    setupFileReader(value) {
      return new Promise((res, rej) => {
        const context = this
        const fr = new FileReader()

        const { title, description, file } = value

        fr.onload = async function () {
          try {
            const encrypted = await context.encrypt({
              text: fr.result,
              fileType: file.type,
              fileSize: file.size,
              fileName: file.name
            })

            const { chunks, fileName, fileType, fileSize } = encrypted
            const dataFile = {
              title,
              description,
              file,
              chunks,
              fileName,
              fileType,
              fileSize,
              createdAt: new Date().getTime()
            }
            res(dataFile)
          } catch (e) {
            console.error(e)
          }
        }
        fr.onerror = rej
        fr.readAsArrayBuffer(value.file)
      })
    },

    async upload({ encryptedFileChunks, fileName, fileType, fileSize }) {
      try {
        this.totalChunks = encryptedFileChunks.length;
        this.currentChunkIndex = 0;
        this.isFailed = false; // Reset isFailed before starting the upload

        for (let i = 0; i < this.totalChunks; i++) {
          store.dispatch("geneticData/getLoadingProgress", { upload: 0 })
          let data = [`{"seed":${encryptedFileChunks[i].seed},"data":{"nonce":[${encryptedFileChunks[i].data.nonce}],"box":[${encryptedFileChunks[i].data.box}`]
          data.push("]}}")
          const blob = new Blob(data, { type: fileType });

          try {
            const result = await uploadFile({
              title: fileName,
              type: fileType,
              size: fileSize,
              file: blob
            });

            const link = await getFileUrl(result.IpfsHash);
            this.links.push(link);
          } catch (error) {
            console.error("Error on chunk upload", error);
            this.isFailed = true; // Set isFailed to true if the upload fails for any chunk
          }

          this.currentChunkIndex++; // Increment the currentChunkIndex regardless of success or failure
        }
        this.geneticLink = JSON.stringify(this.links);
      } catch (e) {
        console.error("Error on upload", e);
      }
    },




    async onSubmit() {
      this._touchForms("document")
      const isDocumentValid = Object.values(this.isDirty?.document).every(v => v !== null && v === false)

      if (!isDocumentValid) {
        return
      }

      const txWeight = Number(this.txWeight.split(" ")[0])
      if (this.walletBalance < txWeight) {
        this.error = {
          title: "Insufficient Balance",
          message: "Your transaction cannot go through because your account balance is too low or doesn't meet the minimum deposit needed. Please check your balance."
        }
        return
      }

      try {
        if (!this.document.file) return
        this.isLoading = true

        const dataFile = await this.setupFileReader(this.document)

        await this.upload({
          encryptedFileChunks: dataFile.chunks,
          fileName: dataFile.fileName,
          fileSize: dataFile.fileSize,
          fileType: dataFile.fileType
        })

        if (this.isEdit) {
          await updateGeneticData(
            this.api,
            this.wallet,
            this.dataId,
            this.document.title,
            this.document.description,
            this.geneticLink
          )

        } else {
          await addGeneticData(
            this.api,
            this.wallet,
            this.document.title,
            this.document.description,
            this.geneticLink
          )
        }
      } catch (e) {
        const error = await errorHandler(e.message)
        console.log(e)
        this.error = error
        this.isLoading = false
      }
    },

    formatTxWeight(num) {
      const res = Web3.utils.fromWei(String(num), "ether")
      return `${(Number(res) + 0.0081).toFixed(4)} DBIO`
    },

    async createOrder() {
      const priceIndex = 0
      const currency = this.service.priceDetail[0].currency
      const assetId = await this.getAssetId(currency === "USDTE" ? "USDT.e" : currency)

      await createGeneticAnalysisOrder(
        this.api,
        this.wallet,
        this.selectedGeneticData.id,
        this.service.serviceId,
        priceIndex,
        this.publicKey,
        this.geneticLink,
        assetId
      )
    },

    async getTxWeight() {
      let txWeight
      this.txWeight = "Calculating..."
      if (!this.isEdit) {
        txWeight = await updateGeneticDataFee(this.api, this.wallet, this.dataId, this.document.title, this.document.description)
        this.txWeight = this.formatTxWeight(txWeight.partialFee)
        return
      }

      txWeight = await addGeneticDataFee(this.api, this.wallet, this.document.title, this.document.description)
      this.txWeight = this.formatTxWeight(txWeight.partialFee)
    },

    closeDialog() {
      this.isSuccess = false
      this.document.title = null
      this.document.description = null
      this.document.file = null
    },

    toDashboard() {
      this.isUpdated = false
      this.$router.push({ name: "customer-genetic-data" })
    }
  }
}

</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .genetic-data-add
    width: 100%
    height: 100%

    &__files-title
      margin-bottom: 24px

      p:first-of-type
        @include button-2

      p
        @include body-text-3-opensans

    &__wrapper
      background: #ffffff
      padding-top: 60px
      padding-bottom: 195px

    &__title
      text-align: center
      margin-bottom: 54px
      @include h6-opensans

    &__modal-text
      width: 240px
      display: flex
      align-items: center
      text-align: center
      letter-spacing: -0.0044em
      padding: 0px 37px 0px 37px
      @include new-body-text-2

    &__forms
      display: flex
      flex-direction: column
      gap: 20px
      margin: 0 auto
      max-width: 450px

    &__input
      height: 125px

    &__tx-weight
      display: flex
      justify-content: space-between

    &__tx-weight-text
      letter-spacing: -0.004em
      @include body-text-3-opensans

    &__trans-weight-icon
      padding-left: 3px
      font-size: 12px
</style>
