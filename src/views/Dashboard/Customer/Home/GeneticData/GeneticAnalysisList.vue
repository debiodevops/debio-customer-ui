<template lang="pug">
  .genetic-analysis-list
    ui-debio-data-table(
      :headers="headers"
      :items="items"
      :sort-by="['timestamp']"
      :sort-desc="[true]"
      :loading="loadingData"
    )
      template(v-slot:[`item.serviceName`]="{ item }")
        .d-flex.flex-column.genetic-analysis-list__service
          span {{ item.serviceName }}

      template(v-slot:[`item.analystName`]="{ item }")
        .d-flex.flex-column.genetic-analysis-list__name
          span {{ item.analystName }}

      template(v-slot:[`item.createdAt`]="{ item }")
        .d-flex.flex-column.genetic-analysis-list__createdDate
          span {{ item.createdAt }}

      template(v-slot:[`item.updatedAt`]="{ item }")
        .d-flex.flex-column.genetic-analysis-list__updatedDate
          span {{ item.updatedAt }}

      template(v-slot:[`item.status`]="{ item }")
        .d-flex.flex-column.genetic-analysis-list__status
          span {{ item.status }}

      template(v-slot:[`item.actions`]="{ item }")
        .genetic-analysis-list__actions
          ui-debio-icon( :icon="eyeIcon" size="16" role="button" stroke @click="toDetail(item)")
          ui-debio-icon(v-show="item.status === 'Done'" :icon="downloadIcon" size="16" role="button" stroke @click="toDownload(item)")

</template>

<script>

import { mapState } from "vuex"
import { eyeIcon, downloadIcon } from "@debionetwork/ui-icons"
import { 
  queryGeneticAnalysisOrderByCustomerId,
  queryGeneticAnalystByAccountId,
  queryGeneticAnalystServicesByHashId,
  queryGeneticAnalysisByGeneticAnalysisTrackingId
} from "@debionetwork/polkadot-provider"
import { downloadFile, decryptFile, downloadDocumentFile } from "@/common/lib/pinata-proxy"
import Kilt from "@kiltprotocol/sdk-js"
import { u8aToHex } from "@polkadot/util"
import CryptoJS from "crypto-js"

export default {
  name: "GeneticAnalysisList",

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      lastEventData: (state) => state.substrate.lastEventData,
      mnemonicData: (state) => state.substrate.mnemonicData
    })
  },

  data: () => ({
    eyeIcon,
    downloadIcon,
    headers: [
      {
        text: "Service Name",
        value: "serviceName",
        sortable: true
      },
      {
        text: "Analyst Name",
        value: "analystName",
        sortable: false
      },
      {
        text: "Order Date",
        value: "createdAt",
        sortable: true
      },
      {
        text: "Last Update",
        value: "updatedAt",
        sortable: true
      },
      {
        text: "Status",
        value: "status",
        sortable: true
      },
      {
        text: "Action",
        value: "actions",
        sortable: false
      }
    ],
    items: [],
    iconShow: true, //temporary disable.
    iconDownloadShow: false,
    publicKey: null,
    secretKey: null,
    loadingData: false
  }),

  watch: {
    mnemonicData(val) {
      if (val) this.initialData()
    },

    async lastEventData(val) {
      if(val !== null) {
        if(val.section === "geneticAnalysisOrders") {
          await this.fetchGeneticAnalysisData()
        }
      }
    }
  },

  async mounted() {
    await this.fetchGeneticAnalysisData()
  },

  async created() {
    if (this.mnemonicData) this.initialData()
  },



  methods: {
    async initialData(){
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    async fetchGeneticAnalysisData() {
      this.loadingData = true

      try {
        this.items = []
        const orderList = await queryGeneticAnalysisOrderByCustomerId(this.api, this.wallet.address)
        const paidOrder = []
  
        orderList.forEach( order => {
          const status = order.status
          if (status === "Paid" || status === "Refunded" || status === "Fulfilled") {
            paidOrder.push(order)
          }
        })
  
        paidOrder.forEach( async order => {
          const { geneticAnalysisTrackingId, sellerId, serviceId, id, createdAt, updatedAt} = order
          const geneticAnalysis = await queryGeneticAnalysisByGeneticAnalysisTrackingId(this.api, geneticAnalysisTrackingId)
          const analystInfo = await queryGeneticAnalystByAccountId(this.api, sellerId)
          const geneticAnalysisService = await queryGeneticAnalystServicesByHashId(this.api, serviceId)
          const timestamp = geneticAnalysis.createdAt
  
          const data = {
            trackingId: geneticAnalysisTrackingId,
            orderId: id,
            serviceName: geneticAnalysisService.info.name,
            analystName: `${analystInfo.info.firstName} ${analystInfo.info.lastName}`,
            analystInfo,
            createdAt: this.formatDate(createdAt),
            updatedAt: this.formatDate(updatedAt),
            status: this.getStatus(geneticAnalysis.status),
            ipfsLink:  geneticAnalysis.reportLink,
            timestamp
          }
          this.items.push(data)
        })
        this.loadingData = false
      } catch (error) {
        console.error(error)
        this.loadingData = false
      }
    },

    toDetail(item) {
      this.$router.push({ 
        name: "customer-genetic-analysis-detail", 
        params: {
          id: item.orderId 
        }
      })
    },

    formatDate(date) {
      const formattedDate = new Date(parseInt(date.replace(/,/g, ""))).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      })
      return formattedDate
    },

    getStatus(status) {
      if (status === "Registered") {
        return "Open"
      }

      if (status === "InProgress") {
        return "In Progress"
      }

      if (status === "ResultReady") {
        return "Done"
      }
      return "Rejected"
    },

    async toDownload(item){
      const pair = { publicKey: item.analystInfo.info.boxPublicKey, secretKey: this.secretKey }
      const type = "application/pdf"
      const { data } = await downloadFile(item.ipfsLink)
      const decryptedFile = decryptFile(data, pair, type)
      await downloadDocumentFile(decryptedFile, item.ipfsLink.split("/").pop(), type)
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .genetic-analysis-list
    padding: 0 !important
    margin: -50px -28px 0 -28px


    &__service
      width: 108px

    &__name
      width: 140px

    &__createdDate
      width: 70px

    &__updatedDate
      width: 70px

    &__status
      width: 80px

    &__actions
      width: 80px
      display: flex
      align-items: center
      justify-content: center
      gap: 20px
</style>
