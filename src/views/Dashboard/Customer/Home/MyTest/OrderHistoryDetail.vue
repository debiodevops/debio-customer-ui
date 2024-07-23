<template lang="pug">
  .customer-orderHistoryDetail
    div.body
      ui-debio-card(
        width="100%"
        height="1000px"
      )
        div.headerSection
          span Test Summary
        div.bodyContent
          v-row
            v-col
              div.leftSection.box.fillColor(v-if="isLoading")
                div.topRow
                  div.topHead
                    v-skeleton-loader(
                      v-bind="attrs"
                      type="card-heading, list-item-avatar, divider, card-heading, list-item-avatar, devider, list-item"
                    )
              div.leftSection.box.fillColor(v-if="!isLoading")
                div.topRow
                  div.topHead
                    span Lab Details
                  div.box
                    div.topBody
                      ui-debio-avatar.dataIcon.box(
                        v-if="myTest.lab_info.profile_image"
                        :src="myTest.lab_info.profile_image"
                        :size="92"
                      )
                      
                      ui-debio-icon.dataIcon.box(
                        v-else
                        :icon="microscopeIcon"
                        :size="92"
                        stroke
                        :stroke-width="0"
                        color="linear-gradient(180deg, #716CFF 0%, #B267FF 100%)"
                        view-box="0 0 47 52"
                      )
                      div.topContentWraper
                        span {{ myTest.lab_info.name }}
                        span {{ myTest.lab_info.address }}
                div.middleRow
                  div.topHead
                    span Product Details
                  div.box
                    div.topBody
                      ui-debio-avatar.dataIcon.box(
                        v-if="!!myTest.service_info.image"
                        :src="myTest.service_info.image"
                        :size="92"
                      )
                      ui-debio-icon.dataIcon.box(
                        v-else
                        :icon="selectedIcon"
                        :size="92"
                        stroke
                        :stroke-width="0"
                        color="linear-gradient(180deg, #716CFF 0%, #B267FF 100%)"
                        :view-box="selectedIcon === dnaIcon? '0 0 32 40' : '0 0 55 55'"
                      )
                      div.topContentWraper
                        span {{ myTest.service_info.name }}
                        span {{ myTest.service_info.description }}
                div.bottomRow
                  span Specimen Number
                  span {{ myTest.dna_sample_tracking_id }}
            v-col
              div.rightSection.box(v-if="isLoading")
                div
                    v-skeleton-loader(
                      v-bind="attrs"
                      type="image, list-item-two-line"
                    )

              div.rightSection.box(v-if="!isLoading")
                div
                  div.imageBanner.box
                    ui-debio-icon(
                      :icon="banner"
                      :size="status['size']"
                      :view-box="status['viewBox']"
                    )
                div.statusSection
                  span.status {{ status['name']}}
                  span.detail {{ status['detail'] }}

                .progress
                  .step-indicator
                    .step
                      div(:class="[`step-icon`, e1>1 && `active`]")
                        v-icon(v-if="e1>1").icon mdi-check
                      small Registered
                    .indicator-line
                    .step
                      div(:class="[`step-icon`, e1>2 && `active`]")
                        v-icon(v-if="e1>2").icon mdi-check
                      small Received
                    .indicator-line
                    .step
                      div(:class="[`step-icon`, e1>3 && `active`, isRejected()]")
                        v-icon(v-if="e1>3 && dnaSample.status === `Rejected`").icon mdi-close
                        v-icon(v-else-if="e1>3").icon mdi-check
                      small {{ dnaSample.status === "Rejected" ? "Rejected" : "Quality Controlled" }} 
                    div(:class="[`indicator-line`, isRejected()]")
                    .step
                      div(:class="[`step-icon`, e1>4 && `active`, isRejected(true)]")
                        v-icon(v-if="e1>4").icon mdi-check
                      small Analyzed
                    div(:class="[`indicator-line`, isRejected()]")
                    .step
                      div(:class="[`step-icon`, e1>5 && `active`, isRejected(true)]")
                        v-icon(v-if="e1>5").icon mdi-check
                      small Result Ready

                .button
                  v-btn(
                    v-if="dnaSample.status === `Rejected`"
                    @click="showDetail = true"
                    color="primary"
                    large
                    width="100%"
                  ) View Details
                  v-btn(
                    v-else
                    @click="toViewResult"
                    color="secondary"
                    large
                    width="100%"
                    :disabled="dnaSample.status !== `ResultReady`"
                  ) View Result

                ui-debio-modal(
                  title="Quality Control Issues"
                  @onClose="showDetail = false"
                  :ctaAction="closeModal"
                  :show="showDetail"
                  :show-title="true"
                  :show-cta="true"
                  ctaTitle="OK"
                )
                  .content
                    p {{ dnaSample.rejectedTitle }}
                    p {{ dnaSample.rejectedDescription }}
                  .content-detail
                    .border-bottom.ph15
                      p Details:
                    .border-bottom.mt10.ph15
                      .flex
                        p Service Price
                        p {{ prices.servicePrice }} {{ prices.currency }}
                      .flex
                        p Quality Control Price
                        p {{ prices.qcPrice }} {{ prices.currency }}

                    .mt10.ph15.flex
                      p Amount to refund
                      p {{ computeDifferenceAmount }} {{ prices.currency }}

</template>

<script>
import {
  microscopeIcon,
  weightLifterIcon,
  hairIcon,
  dnaIcon,
  virusIcon
} from "@debionetwork/ui-icons"
import { mapState } from "vuex"
import { getOrderDetail } from "@/common/lib/api"
import { queryDnaSamples } from "@debionetwork/polkadot-provider"
import { ORDER_STATUS_DETAIL } from "@/common/constants/status"
import { formatPrice } from "@/common/lib/price-format.js"


export default {
  name: "OrderHistoryDetail",
  data: () => ({
    microscopeIcon,
    hairIcon,
    dnaIcon,
    virusIcon,
    weightLifterIcon,
    banner: "",
    selectedIcon: weightLifterIcon,
    showDetail: false,
    dnaSample: {},
    e1: 1,
    status: {
      status: "",
      name: "",
      detail:"",
      size: 0,
      viewBox: ""
    },
    myTest: {},
    prices: {
      servicePrice: 0,
      qcPrice: 0,
      currency: ""
    },
    isLoading: false
  }),

  async mounted() {
    if (this.$route.params.id) {
      await this.getOrderDetail()
      await this.checkOrderDetail()
      this.iconSwitcher()
    }
  },

  computed: {
    ...mapState({
      api: (state) => state.substrate.api
    }),

    computeDifferenceAmount() {
      return this.prices.servicePrice - this.prices.qcPrice
    }
  },

  methods: {
    async getOrderDetail() {
      this.isLoading = true
      try {
        this.myTest = await getOrderDetail(this.$route.params.id)
        this.dnaSample = await queryDnaSamples(this.api, this.myTest.dna_sample_tracking_id)
        this.prices.servicePrice = this.formatPrice(this.myTest.service_info.prices_by_currency[0].total_price, this.myTest.service_info.prices_by_currency[0].currency.toUpperCase())
        this.prices.qcPrice = this.formatPrice(this.myTest.service_info.prices_by_currency[0].additional_prices[0].value, this.myTest.service_info.prices_by_currency[0].currency.toUpperCase())
        this.prices.currency = this.myTest.service_info.prices_by_currency[0].currency.toUpperCase()
        this.isLoading = false
      } catch (error) {
        console.error(error)
        this.isLoading = false
      }
    },

    toViewResult() {
      this.$router.push({ name: "test-result", params: { id: this.$route.params.id }})
    },

    isRejected(border) {
      if (border) return this.dnaSample.status === "Rejected" && `border-error`
      else return  this.dnaSample.status === "Rejected" && `error`
    },

    closeModal() {
      this.showDetail = false
    },

    iconSwitcher() {
      switch (this.myTest.service_info.name) {
      case "Covid-19 Testing":
        this.selectedIcon = virusIcon
        break
      case "Whole Genome Sequencing":
        this.selectedIcon = dnaIcon
        break
      case "Diet":
        this.selectedIcon = weightLifterIcon
        break
      case "Skin":
        this.selectedIcon = hairIcon
        break
      case "SNP Microarray":
        this.selectedIcon = dnaIcon
        break
      default:
        this.selectedIcon = weightLifterIcon
        break
      }
    },
    
    checkOrderDetail() {
      const statusDetail = ORDER_STATUS_DETAIL[this.dnaSample.status.toUpperCase()]
      if (this.dnaSample.status === "Rejected") {
        const refundAmount = formatPrice(this.myTest.service_info.prices_by_currency[0].total_price, this.myTest.service_info.prices_by_currency[0].currency.toUpperCase()) - formatPrice(this.myTest.service_info.prices_by_currency[0].additional_prices[0].value, this.myTest.service_info.prices_by_currency[0].currency.toUpperCase())
        const { banner, name, detail, bannerSize, viewBox, e1 } = statusDetail(refundAmount)
        this.banner = banner
        this.status = { name, detail, size: bannerSize, viewBox }
        this.e1 = e1
        return
      }

      const { banner, name, detail, bannerSize, viewBox, e1 } = statusDetail
      this.banner = banner
      this.status = { name, detail, size: bannerSize, viewBox }
      this.e1 = e1
    }
  }
};
</script>

<style lang="sass">
.customer-orderHistoryDetail
  margin: 10px
  &::v-deep
    .banner__subtitle
      max-width: 36.188rem !important

  .headerSection
    text-align: center
    margin: 25px 0 50px 0
    font-weight: 600
    font-size: 24px

  .box
    border: solid 0.5px #E4E4E4
    box-sizing: border-box
    margin: 0px

  .fillColor
    height: 456px

  .bodyContent
    margin: 0 0 0 0

  .leftSection
    padding: 17px
    height: 456px
    .topRow
      margin: 0px
    .middleRow
      margin: 25px 0 0 0
    .bottomRow
      display: flex
      margin-top: 21px
      font-weight: 600
      font-size: 14px
      line-height: 20px
      justify-content: space-between

  .rightSection
    padding: 17px
    height: 456px

  .bodyWraper
    padding: 10px

  .dataIcon
    padding: 10px
    margin: 10px
    min-width: 92px
    .dataContent
      margin: 0 0 0 5px

  .topHead
    margin: 0 0 10px 0
    font-weight: 600
    font-size: 20px
    line-height: 32px
  .topBody
    display: flex

  .topContentWraper
    display: flex
    flex-direction: column
    margin: 5px 0 5px 5px
    justify-content: space-evenly
    font-size: 14px

  .imageBanner
    width: 100%
    height:184px
    margin-bottom: 15px
    align-items: center
    display: flex
    flex-direction: column
    background: linear-gradient(81.43deg, #6344D0 2.53%, #9D82FF 100%)

  .statusSection
    display: flex
    flex-direction: column
    .status
      font-size: 14px
      font-weight: 600
      line-height: 20px
      margin: 0 0 10px 0
    .detail
      font-size: 12px
      font-weight: 400
      line-height: 16px
      min-height: 50px
  
  .button
    margin-top: 13px

  .progress
    width: 100%
    min-width: 100px
    padding: 17px
    margin-top: 30px

  .step-indicator
    display: flex
    align-items: center
    .step-icon
      box-sizing: border-box
      display: flex
      align-items: center
      justify-content: center
      width: 20px
      height: 20px
      border: 1px solid #A868FF
      border-radius: 50%
      background: #FFF
      
      .icon
        font-size: 10px
        color: #ffffff
        font-weight: 500

    .active
      background: linear-gradient(225deg, #D665FF 0%, #4C6FFF 100%)
      border: none

    .error
      background: red
    .border-error
      border: 1px solid red

  .step
    display: flex
    align-items: center
    flex-direction: column
    z-index: 1
    position: relative
    small
      position: absolute
      text-align: center
      font-size: 10px
      top: -30px
      color: #595959
      font-weight: 600
      width: 75px

  .indicator-line
    width: 100%
    height: 1px
    background: #A868FF
    flex: 1

  .content
    background: #F5F7F9
    padding: 20px 15px
    width: 338px
    color: #595959
    font-size: 14px
  
  .content-detail
    text-align: left
    width: 100%
    font-size: 12px
    font-weight: 600

  .flex
    display: flex
    justify-content: space-between

  .border-bottom
    border-bottom: 0.5px solid #D3C9D1

  .ph15
    padding: 0px 15px

  .mt10
    margin-top: 10px
</style>
