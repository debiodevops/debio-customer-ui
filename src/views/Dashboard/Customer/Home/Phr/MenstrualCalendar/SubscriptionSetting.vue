<template lang="pug">
  .subscription-setting
    .subscription-setting__wrapper
      MenstrualCalendarBanner
      ui-debio-modal.subscription-setting__modal(
        :show="showAlert"
        :show-title="false"
        :show-cta="false"
        disable-dismiss
      )
        .subscription-setting__modal-title Renew Menstrual Calendar

        ui-debio-icon(
          :icon="alertTriangleIcon"
          size="90"
          color="#c400a5"
          stroke
        )
        .subscription-setting__modal-desc Are you sure you want to pay selected menstrual calendar subscription?

        .subscription-setting__modal-buttons(class=" justify-space-between align-center pa-10")
          ui-debio-button(
            color="secondary" 
            width="100px"
            height="35"
            style="font-size: 10px;"
            outlined 
            @click="showAlert = false"
          ) No

          ui-debio-button(
            color="secondary" 
            width="100px"
            height="35"
            style="font-size: 10px;"
            @click="toPayment()"
          ) Yes

      ui-debio-modal.subscription-setting__modal-success(
        :show="isSuccess"
        :show-title="false"
        :show-cta="false"
        disable-dismiss
      )
        .subscription-setting__modal-title Payment Success
        ui-debio-icon(
          :icon="checkCircleIcon"
          size="90"
          color="#c400a5"
          stroke
        )

        .subscription-setting__modal-desc Contratulations! your menstrual calendar have been renewed

        ui-debio-button(
          color="secondary" 
          width="100%"
          height="35"
          style="font-size: 10px;"
          @click="paymentSuccessAction()"
        ) Continue to Menstrual Calendar

      .subscription-setting__my-subscription
        ui-debio-card.subscription-setting__calendar-selection(width="654")
          .subscription-setting__head
            v-btn(
              @click="backButton"
              icon
            )
              v-icon mdi-chevron-left
            .subscription-setting__head-text
              span.subscription-setting__head-text-primary My Subscription
              span.subscription-setting__head-text-secondary {{ subscriptionAlert }}
          
          ui-debio-card.subscription-setting__subscription-detail(width="590")
            .subscription-setting__subscription-detail-head
              span.subscription-setting__head-text-primary My Subscription
            v-divider.subscription-setting__divider
            .subscription-setting__subscription-list-detail
              .subscription-setting__subscription-item-detail(v-for="subscription in subscriptionList")
                div.subscription-setting__subscription-wrapper-item-status
                  span.subscription-setting__subscription-item-status(:class="{'status-active': subscription.statusNumber === 1, 'status-in-queue': subscription.statusNumber === 2 }") {{ subscription.status }}
                .subscription-setting__subscription-item-card
                  .subscription-setting__subscription-item-card-text-status
                    .subscription-setting__subscription-item-card-text-status-primary {{ subscription.name }}
                    .subscription-setting__subscription-item-card-text-status-secondary {{ subscription.textStatus }}
                  .subscription-setting__subscription-item-card-text-price {{ subscription.price }}

        ui-debio-card.subscription-setting__subscription-plan(width="480")
          template(v-if="!paymentPreview")
            .subscription-setting__subscription-payment-back-wrapper
              .subscription-setting__subscription-plan-header Renew Subscription

          template(v-if="paymentPreview")
            .subscription-setting__subscription-payment-back-wrapper
              v-btn.subscription-setting__subscription-payment-back(icon @click="toSubsPlan")
                v-icon mdi-chevron-left
              span.subscription-setting__subscription-plan-header Select Payment Methods

          .subscription-setting__subscription-plan-breadcrumbs
            v-breadcrumbs(:items="breadcrumbs")
              template(v-slot:divider)
                v-icon mdi-chevron-right
                
          template(v-if="!paymentPreview")
            .subscription-setting__plan-card
              v-radio-group(v-model="subscription")
                .subscription-setting__list-card-radio
                  template(v-for="plan in plans" )
                    .subscription-setting__card-radio
                      .subscription-setting__plan-card-wrapper
                        v-radio.subscription-setting__plan-card-radio(
                          :label="plan.text" 
                          :value="plan" 
                          color="secondary"
                        )
                        .subscription-setting__plan-card-alert(v-if="plan.promo" color="#E7FFE6" )
                          .subscription-setting__plan-card-alert-text {{ plan.promo }}
                        .subscription-setting__plan-card-price {{ plan.price }}
                      .subscription-setting__plan-card-desc.pt-1.ml-8 {{ plan.description }}
                    
              ui-debio-button(
                color="secondary"
                width="100%"
                @click="toPaymentPreview()"
              ) Select Plan
            
          template(v-if="paymentPreview")
            v-card.subscription-setting__plan-payment-card
              .subscription-setting__plan-payment-card-title Purchase Detail
              .subscription-setting__plan-payment-card-detail
                .subscription-setting__plan-payment-card-desc Menstrual Date {{ subscription.text }}
                .subscription-setting__plan-card-price {{ subscription.price }} / {{ subscription.periode}}
              v-divider.ma-4
              .subscription-setting__plan-payment-card-total
                .subscription-setting__plan-payment-card-total-text Total Today
                .subscription-setting__plan-payment-card-total-price {{ subscription.price }}
                

              .subscription-setting__plan-payment-card-notes Any eligible subscription credit will be applied until it runs out. Your subscription will renew for {{ subscription.price }} / {{ subscription.periode }} on Sept 23, 2023. Have any questions? 
                a Contact our support team


            .subscription-setting__plan-payment-card-title PAY WITH CURRENCY
            
            v-chip-group.subscription-setting__plan-payment-card-chips(v-model="currency" column)                
              v-chip(label outlined large)
                v-avatar(right width="30")
                  v-img.pr-5(
                    alt="no-list-data"
                    src="@/assets/tether-logo.svg"
                    max-width="24px"
                    max-height="24px"
                  )
                span.ma-3 USDT.e (TETHER)

            .subscription-setting__trans-weight
              .subscription-setting__trans-weight-text Estimated transaction weight
                v-tooltip.visible(bottom )
                  template(v-slot:activator="{ on, attrs }")
                    v-icon.dialog-confirmation__trans-weight-icon(
                      style="font-size: 12px;"
                      color="primary"
                      dark
                      v-bind="attrs"
                      v-on="on"
                    ) mdi-alert-circle-outline 
                  span(style="font-size: 10px;") Total fee paid in DBIO to execute this transaction.

              div( style="font-size: 12px;" ) 0 DBIO

            ui-debio-button(
              color="secondary"
              width="100%"
              @click="showAlert = true"
            ) Pay Now!

</template>

<script>
import { alertTriangleIcon, checkCircleIcon } from "@debionetwork/ui-icons"
import MenstrualCalendarBanner from "./Banner"

export default {
  name: "SubscriptionSetting",

  components: {
    MenstrualCalendarBanner
  },

  data: () => ({
    alertTriangleIcon, checkCircleIcon,
    paymentPreview: false,
    isSuccess: false,
    showAlert: false,
    subscription: "",
    subscriptionAlert: "subscription will ends on 30 days",
    subscriptionList: [
      {
        statusNumber: 1,
        status: "Active",
        name: "Menstrual Date Monthly",
        textStatus: "Active until September 23, 2022",
        price: "8 USD/Month"
      }
    ],
    breadcrumbs: [
      {
        text: "Subscription Plan",
        disabled: false,
        href: ".subscription-setting__subscription-plan"
      },
      {
        text: "Payment Preview",
        disabled: true,
        href: ".subscription-setting__plan-card"
      }
    ],
    plans: [
      {text: "Monthly", description: "For users on a budget who want to try out menstrual date", price: "8 USD", promo: "", periode: "Month"},
      {text: "Quarterly", description: "For users on a budget who want to track menstrual cycle quarterly", price: "21.6 USD", promo: "Save 10%", periode: "3 Months"},
      {text: "Annualy", description: "For users on a budget who want to keep tracking menstrual cycle annualy", price: "48 USD", promo: "Save 50%", periode: "Year"}
    ]
  }),

  methods: {
    toPaymentPreview() {
      this.paymentPreview = true
      this.breadcrumbs[0].disabled = true
      this.breadcrumbs[1].disabled = false
    },

    toSubsPlan() {
      this.paymentPreview = false
      this.breadcrumbs[0].disabled = false
      this.breadcrumbs[1].disabled = true
    },

    async toPayment() {
      this.showAlert = false
      this.isSuccess = true
    },

    paymentSuccessAction() {
      if (this.subscription) {

        if (this.subscription.text === "Monthly") {
          this.subscriptionList.push({
            statusNumber: 2,
            status: "In Queue",
            name: "Menstrual Date Monthly",
            textStatus: "Start on September 23, 2022 until December 23, 2022",
            price: "8 USD/Quarter"
          })

          this.subscriptionAlert = "subscribtion will ends on 30 days"
        } else if (this.subscription.text === "Quarterly") {
          this.subscriptionList.push({
            statusNumber: 2,
            status: "In Queue",
            name: "Menstrual Date Quarterly",
            textStatus: "Start on September 23, 2022 until December 23, 2022",
            price: "21.6 USD/Quarter"
          })

          this.subscriptionAlert = "subscribtion will ends on 90 days"
        } else if (this.subscription.text === "Annualy") {
          this.subscriptionList.push({
            statusNumber: 2,
            status: "In Queue",
            name: "Menstrual Date Annualy",
            textStatus: "Start on September 23, 2022 until December 23, 2022",
            price: "48 USD/Quarter"
          })

          this.subscriptionAlert = "subscribtion will ends on 120 days"
        } else {
          this.subscriptionList.push({
            statusNumber: 2,
            status: "In Queue",
            name: "Menstrual Date Quarterly",
            textStatus: "Start on September 23, 2022 until December 23, 2022",
            price: "21.6 USD/Quarter"
          })

          this.subscriptionAlert = "subscribtion will ends on 90 days"
        }
        
        this.showAlert = false
        this.isSuccess = false
        this.paymentPreview = false
        this.subscription = null
      }
    },
    
    backButton() {
      this.$router.push({ name: "menstrual-calendar-detail" })
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .subscription-setting
    &__wrapper
      height: 100%

    &__my-subscription
      margin-top: 16px
      display: flex
      gap: 16px
      height: 593px

    &__my-subscription-head
      width: 654px

    &__head
      display: flex
      height: 60px
      align-content: center
      align-items: center
      gap: 27.33px
    
    &__head-text
      display: flex
      flex-direction: column
      gap: 8px

    &__head-text-primary
      height: 32px
      font-family: 'Open Sans'
      font-style: normal
      font-weight: 600
      font-size: 20px
      line-height: 32px
      display: flex
      align-items: center
      letter-spacing: 0.0044em
      color: #363636

    &__head-text-secondary
      height: 20px
      font-family: 'Open Sans'
      font-style: normal
      font-weight: 400
      font-size: 14px
      line-height: 20px
      display: flex
      align-items: center
      letter-spacing: -0.0044em
      color: #757274

    &__subscription-detail
      width: 590px
      margin: 23px 0 0 0

    &__subscription-detail-head

    &__divider
      margin: 16px 0 16px 0

    &__subscription-list-detail
      display: flex
      flex-direction: column
      gap: 12px

    &__subscription-item-detail
      display: flex
      flex-direction: column
      gap: 12px

    &__subscription-wrapper-item-status
      display: flex

    &__subscription-item-status
      padding: 4px 12px 4px 12px
      font-weight: 600
      font-size: 12px
      line-height: 20px
      border-radius: 4px
      flex-wrap: wrap

    &__subscription-item-card
      display: flex
      padding: 12px 16px
      background: #F8F8F8
      justify-content: space-between

    &__subscription-item-card-text-status
      display: flex
      flex-direction: column
      justify-content: space-around

    &__subscription-item-card-text-status-primary
      font-weight: 600
      font-size: 14px
      color: #363636

    &__subscription-item-card-text-status-secondary
      font-weight: 400
      font-size: 10px
      color: #5640A5

    &__subscription-item-card-text-price
      padding: 12px 16px
      color: #FF56E0
      font-weight: 600
      font-size: 14px
      line-height: 20px
      
    &__subscription-plan-header
      font-weight: 600
      font-size: 20px
      line-height: 32px
      display: flex
      align-items: center

    &__plan-card-wrapper
      display: flex
      justify-content: space-between

    &__plan-card-desc
      color: #757274
      @include body-text-3

    &__subscription-plan-breadcrumbs
      margin: -22px

    &__plan-card-desc
      color: #757274
      @include body-text-3

    &__subscription-plan-breadcrumbs
      margin: -22px

    &__plan-card-price
      @include button-2
    
    &__plan-card-alert
      height: 24px
      margin-left: -120px
      background: #E0FFE1
      padding: 4px 12px

    &__plan-card-alert-text
      color: #32D47D
      font-size: 12px

    &__list-card-radio
      display: flex
      flex-direction: column
      gap: 12px

    &__card-radio
      padding: 16px
      background: #FFFFFF
      border: 1px solid #C7CBDC
      border-radius: 4px

    &__subscription-payment-back-wrapper
      display: flex
      gap: 15.33px
      margin: 0 0 12px 0

    &__plan-payment-card
      margin-top: 20px

    &__plan-payment-card-title
      padding: 16px
      margin: 4px 0
      @include button-1

    &__plan-payment-card-detail
      display: flex
      justify-content: space-between
      margin: 2px 16px
      

    &__plan-payment-card-desc
      @include new-body-text-2

    &__plan-payment-card-total
      display: flex
      justify-content: space-between
      margin: 2px 16px
      @include button-1
    
    &__plan-payment-card-total-price
      color: #FF56E0

    &__plan-payment-card-notes
      padding: 24px 16px
      @include tiny-reg

    &__plan-payment-card-chips
      margin-top: -10px
      margin-left: 16px

    &__trans-weight
      padding: 24px 16px
      display: flex
      justify-content: space-between

    &__trans-weight-text
      margin-right: 5px
      color: #595959
      letter-spacing: -0.004em
      display: flex
      align-items: center
      @include body-text-3-opensans

    &__modal
      display: flex
      align-items: center
      justify-content: center

    &__modal-desc
      text-align: center
      max-width: 264px

    &__modal-title
      text-align: center
      max-width: 264px
      @include h3-opensans
    
    &__modal-buttons
      display: flex
      justify-content: space-between
      gap: 20px

  .status-active
    background: #E0FFE1
    font-weight: 600
    font-size: 12px
    line-height: 20px
    color: #69D65F

  .status-in-queue
    background: #FFE0FE
    font-weight: 600
    font-size: 12px
    line-height: 20px
    color: #FF60BF

</style>
