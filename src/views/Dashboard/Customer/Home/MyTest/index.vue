<template lang="pug">
.customer-test
  modalBounty(
    :show="isShowModalBounty"
    :title="computeModalTitle"
    :sub-title="computeModalSubtitle"
    :link="computeModalLink"
    :loading="modalBountyLoading"
  )
    .modal-bounty__cta.d-flex.mt-8.justify-center
      ui-debio-button(
        v-if="!!isBountyError"
        color="secondary"
        block
        outlined
        @click="isBountyError = null"
      ) Try again

      ui-debio-button(
        v-else-if="isSuccessBounty"
        color="secondary"
        width="100"
        outlined
        @click="handleSuccessBounty"
      ) Ok

      template(v-else)
        ui-debio-button(outlined color="secondary" width="100" @click="isShowModalBounty = false") Cancel
        ui-debio-button(color="secondary" width="100" @click="downloadFile") Yes

  ui-debio-banner.customer-test__banner(
    title="My Test"
    subtitle="Collect your own biological sample at home and package it to an expert and/or scientist"
    with-decoration
    gradientColor="tertiary"
  )
    template(slot="illustration")
      ui-debio-icon(
        :icon="medicalResearchIllustration"
        :size="cardBlock ? 250 : 180"
        view-box="10 0 245 175"
        fill
      )

    template(slot="cta")
      .banner-card
        router-link.banner-card__container(:to="{name: 'customer-request-test'}")
          ui-debio-icon.banner-card__icon(
            :icon="cardGradient"
            size="50"
          )
          .banner-card__text Request a Test
            .banner-card__sub-text Get your biological sample tested or stake $DBIO to request Lab

  .customer-my-test
    .customer-my-test__tabs
      template
        v-tabs(v-model="tabs")
          v-tab.tab-section Orders

          v-tab.tab-section Request Service

      v-tabs-items(v-model="tabs")
        v-tab-item
          .customer-my-test__table
            ui-debio-data-table(
              :headers="headers"
              :items="testList"
              :loading="isLoadingData"
            )
              template(class="titleSection" v-slot:[`item.serviceName`]="{item}")
                div(class="detailLab d-flex align-center")
                  .customer-my-test__title-detail
                    ui-debio-avatar(
                      :src="setServiceImage(item.serviceImage)"
                      size="42"
                      rounded
                    )
                  div
                    div.customer-my-test__title-name
                      span {{ item.serviceName }}
                    div.customer-my-test__title-number
                      span {{ item.dnaSampleTrackingId}}

              template(v-slot:[`item.labName`]="{ item }")
                .d-flex.flex-column.customer-my-test__lab-name
                  span {{ item.labName }}

              template(v-slot:[`item.orderDate`]="{ item }")
                span {{ item.orderDate }}

              template(v-slot:[`item.updatedAt`]="{ item }")
                span {{ item.updatedAt }} 

              template(v-slot:[`item.orderStatus`]="{item}")
                .customer-my-test__status
                  span(:style="{color: setStatusColor(item.orderStatus)}") {{ setTestStatus(item.orderStatus) }}

              template(v-slot:[`item.actions`]="{ item }")
                .customer-my-test__actions
                  ui-debio-button.pa-4(
                    height="25px"
                    width="50%"
                    dark
                    color="primary"
                    @click="goToDetail(item.orderId)"
                  ) Details

                  ui-debio-button.pa-4(
                    v-if="item.orderStatus !== 'ResultReady'"
                    v-show="item.orderStatus === 'Registered'"
                    height="25px"
                    width="50%"
                    dark
                    color="secondary"
                    @click="goToInstruction(item)"
                  ) Instruction
                  template(v-if="item.orderStatus === 'ResultReady'")
                    v-tooltip(top)
                      template(v-slot:activator="{ on, attrs }"
                      )
                        ui-debio-button.pa-4(
                        height="25px"
                        width="50%"
                        dark
                        class='white--text' 
                        color="#cacaca"
                        :bind="attrs"
                        :on="on"
                        ) Add As Bounty
                      span Coming Soon

        v-tab-item
          .customer-my-test__table
          StakingServiceTab(
            ref="staking"
            @unstake="showDialog = true"
            @retrieve="showRetrieveDialog = true"
            @loading="loadingDialog = true"
            @closeLoading="loadingDialog = false"
            @error="showError"
          )
          ConfirmationDialog(
            :show="showRetrieveDialog"
            :loading="isLoading"
            :txWeight="Number(txWeight).toFixed(4)"
            title="Retrieve"
            btnMessage="Retrieve"
            message="Retrieve your staked currency"
            @click="retrieveService"
            this.isLoding = true
            @close="showRetrieveDialog=false"
          )
          ConfirmationDialog(
            :show="showDialog"
            :loading="isLoading"
            :txWeight="Number(txWeight).toFixed(4)"
            title="Unstake"
            btnMessage="Unstake"
            message="Your staking amount will be returned after 144 hours or 6 days"
            @click="unstakeService"
            this.isLoding = true
            @close="showDialog=false"
          )

          PaymentDialog(
            :show="loadingDialog"
          )

        ui-debio-error-dialog(
          :show="!!error"
          :title="error ? error.title : ''"
          :message="error ? error.message : ''"
          @close="error = null"
        )
</template>

<script>
import { layersIcon, noteIllustration, medicalResearchIllustration, cardGradient } from "@debionetwork/ui-icons"
import StakingServiceTab from "./StakingServiceTab.vue"
import modalBounty from "./modalBounty.vue"
import { mapState } from "vuex"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import localStorage from "@/common/lib/local-storage"
import { u8aToHex } from "@polkadot/util"
import { syncDecryptedFromIPFS } from "@/common/lib/ipfs"
import ConfirmationDialog from "@/common/components/Dialog/ConfirmationDialog"
import { createSyncEvent, getCategories, getOrderList } from "@/common/lib/api"
import { queryDnaSamples, queryDnaTestResults, unstakeRequest, unstakeRequestFee, retrieveUnstakedAmount } from "@debionetwork/polkadot-provider"
import { getDNACollectionProcess } from "@/common/lib/api"
import { ORDER_STATUS_DETAIL } from "@/common/constants/status"
import PaymentDialog from "@/common/components/Dialog/PaymentDialog"

export default {
  name: "MyTest",

  components: {
    StakingServiceTab,
    modalBounty,
    ConfirmationDialog,
    PaymentDialog
  },

  data: () => ({
    layersIcon,
    noteIllustration,
    cardBlock: false,
    isSuccessBounty: false,
    isShowModalBounty: false,
    modalBountyLoading: false,
    isBountyError: null,
    selectedBounty: null,
    publicKey: null,
    secretKey: null,
    tabs: null,
    isBounty: false,
    isLoading: false,
    showDialog: false,
    showRetrieveDialog: false,
    medicalResearchIllustration,
    isLoding: false,
    isLoadingData: false,
    loadingDialog: false,
    txWeight: 0,
    testList: [],
    error: null,
    cardGradient,
    headers: [
      { text: "Service Name", value: "serviceName", sortable: true },
      { text: "Lab Name", value: "labName", sortable: true },
      { text: "Order Date", value: "orderDate", sortable: true },
      { text: "Last Update", value: "updatedAt", sortable: true },
      { text: "Test Status", value: "orderStatus", width: "115", sortable: true },
      { text: "Actions", value: "actions", sortable: false, align: "center" }
    ]
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      lastEventData: (state) => state.substrate.lastEventData,
      mnemonicData: (state) => state.substrate.mnemonicData,
      stakingId: (state) => state.lab.stakingId,
      web3: (state) => state.metamask.web3
    }),

    userAddress() {
      return JSON.parse(localStorage.getKeystore())["Address"]
    },

    computeModalTitle() {
      const title = this.isSuccessBounty
        ? "Great! Your data has been placed on marketplace successfully!"
        : "Do you want to add your test result as a data bounty?"

      return this.isBountyError ? this.isBountyError : title
    },

    computeModalSubtitle() {
      const subtitle = this.isSuccessBounty
        ? "Congratulations! You get XX $DBIO as reward!"
        : "You can learn more about data bounty by seeing the information"

      return this.isBountyError ? "Something went wrong, please try again" : subtitle
    },

    computeModalLink() {
      return this.isSuccessBounty || this.isBountyError ? null : "/"
    }
  },

  watch: {
    lastEventData(event) {
      if (event === null) return
      const dataEvent = JSON.parse(event.data.toString())

      if (event.method === "DataStaked") {
        this.$store.dispatch("substrate/addAnyNotification", {
          address: this.wallet.address,
          dataAdd: {
            message: "Great! Your data has been placed on ocean marketplace successfully! You have recieve xx DBIO",
            data: dataEvent,
            route: "customer-data-bounty",
            params: null
          },
          role: "customer"
        })
      }
    },

    mnemonicData(val) {
      if (val) this.initialData()
    }
  },
  async mounted() {
    if (this.$route.params.page) {
      this.tabs = /^[0-1]*$/.test(parseInt(this.$route.params.page))
        ? parseInt(this.$route.params.page)
        : 0
    }

    await this.fetchOrderList()
    const txWeight = await unstakeRequestFee(this.api, this.wallet, this.stakingId)
    this.txWeight = this.web3.utils.fromWei(String(txWeight.partialFee), "ether")
  },

  async created() {
    if (this.mnemonicData) await this.initialData()
  },

  methods: {
    formatDate(date) {
      const formattedDate = new Date(parseInt(date.replace(/,/g, ""))).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      })
      return formattedDate
    },

    async fetchOrderList() {
      this.isLoadingData = true
      try {
        const result = await getOrderList()
        const orderList = result.orders.data

        if (!orderList.length) {
          this.isLoadingData = false
          return
        }

        const newList = orderList.filter(order => order._source.status !== "Unpaid" && order._source.status !== "Cancelled")
        newList.forEach(async (order) => {
          const {
            id: orderId,
            lab_info: {
              name: labName
            },
            service_info: {
              name: serviceName,
              image: serviceImage,
              dna_collection_process: dnaCollectionProcess,
              long_description: description
            },
            dna_sample_tracking_id: dnaSampleTrackingId,
            created_at: createdAt,
            status: paymentStatus
          } = order._source

          const dnaSample = await queryDnaSamples(this.api, dnaSampleTrackingId)
          let dnaTestResults

          if (paymentStatus === "Fulfilled") {
            dnaTestResults = await queryDnaTestResults(this.api, dnaSampleTrackingId)
          }

          const orderDetail = {
            orderId,
            dnaSampleTrackingId,
            labName,
            serviceName,
            serviceImage,
            orderDate: this.formatDate(createdAt),
            updatedAt: this.formatDate(dnaSample.updatedAt),
            orderStatus: dnaSample.status,
            paymentStatus,
            dnaCollectionProcess,
            description,
            dnaTestResults,
            timestamp: new Date(parseInt(dnaSample.updatedAt.replaceAll(",", ""))).getTime().toString()
          }

          this.testList.push(orderDetail)
          this.testList.sort(
            (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)
          )
          this.isLoadingData = false
        })
      } catch (error) {
        console.error(error)
        this.isLoadingData = false
      }
    },

    async initialData() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))

      this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
      this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)
    },

    setStatusColor(status) {
      if (status === "Rejected") {
        const detail = ORDER_STATUS_DETAIL[status.toUpperCase()]
        return detail().color
      }
      return ORDER_STATUS_DETAIL[status.toUpperCase()].color
    },

    setTestStatus(status) {
      if (status === "Rejected") {
        const detail = ORDER_STATUS_DETAIL[status.toUpperCase()]
        return detail().name
      }
      return ORDER_STATUS_DETAIL[status.toUpperCase()].name
    },

    setServiceImage(image) {
      return image ? image : require("@/assets/debio-logo.png")
    },

    goToDetail(id) {
      this.$router.push({ name: "order-history-detail", params: { id } })
    },

    async goToInstruction(item) {

      if (item.description.split("||").length > 1) {
        window.open(item.description.split("||")[1], "_blank")
        return
      }

      const dnaCollectionProcess = await getDNACollectionProcess()
      const link = dnaCollectionProcess.filter(e => e.collectionProcess === item.dnaCollectionProcess)[0].link
      window.open(link, "_blank")
    },

    async handleSelectedBounty(val) {
      this.selectedBounty = { ...val.dnaTestResults, ...val }
      this.isShowModalBounty = true
    },

    handleSuccessBounty() {
      this.isShowModalBounty = false

      setTimeout(() => {
        this.isSuccessBounty = false
      }, 350)
    },

    async downloadFile() {
      if (!this.selectedBounty) return

      this.modalBountyLoading = true
      try {
        const pair = {
          secretKey: this.secretKey,
          publicKey: this.publicKey
        }

        await syncDecryptedFromIPFS(
          this.selectedBounty.resultLink.replace("https://ipfs.io/ipfs/", ""),
          pair,
          `${this.selectedBounty?.trackingId}.vcf`,
          "text/vCard"
        )

        const serviceCategories = await getCategories()
        const service = serviceCategories.find(
          service => service.name === this.selectedBounty.serviceInfo.category
        )

        await createSyncEvent({
          orderId: this.selectedBounty?.orderId,
          serviceCategoryId: service.id,
          fileName: `${this.selectedBounty?.trackingId}.vcf`
        })

        this.selectedBounty = null
        this.isSuccessBounty = true
        this.modalBountyLoading = false
      } catch (e) {
        this.isBountyError = e?.message
        this.modalBountyLoading = false
      }
    },

    cancelBounty() {
      this.isBounty = false
    },

    async unstakeService() {
      const requestId = this.stakingId
      this.isLoading = true
      await unstakeRequest(
        this.api,
        this.wallet,
        requestId,
        this.fetchStakingTab
      )
    },

    async retrieveService() {
      const requestId = this.stakingId
      this.isLoading = true
      await retrieveUnstakedAmount(
        this.api,
        this.wallet,
        requestId,
        this.fetchStakingTab // eslint-disable-next-line no-unused-vars
      ).catch(this.retrieveError())
    },

    fetchStakingTab() {
      this.$refs.staking.fetchData()
      this.isLoading = false
      this.showDialog = false
      this.showRetrieveDialog = false
    },
    retrieveError() {
      this.fetchStakingTab()
      this.error = {
        title: "Error",
        message: "Retrieval of unstaked amount failed"
      }
    },

    showError() {
      this.error = {
        title: "Error",
        message: "No Service Available"
      }
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
  @import "@/common/styles/function.sass"

  .customer-test
    &::v-deep
      .banner__subtitle
        max-width: 36.188rem !important
        @include text-h2-banner

  .customer-my-test
    width: 100%
    background: #FFFFFF
    margin-top: 30px

    &__tabs
      padding: 3px 20px

    &__table
      padding: 0px

    &__actions
      padding: 0 10px
      display: flex
      align-items: center
      gap: 20px
      margin: 5px

    &__status
      color: #48A868

    &__title-detail
      margin: 0 5px 0 0
      border-radius: 5px
    
    &__title-number
        color: #8C8C8C

  .banner-card
    display: flex

    &__container
      margin-left: 100px
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
    
    &__sub-text
      color: #8C8C8C
      margin-top: 2px
      @include body-text-5

  .modal-bounty__cta
    gap: 40px
    .customer-test
      &::v-deep

  .degenics-datatable-card
    padding: 0 !important
    margin: -24px 0 0 0
    
  .degenics-data-table
    margin-top: 0px !important

  .tab-section
    text-transform: unset !important
    @include button-1

</style>
