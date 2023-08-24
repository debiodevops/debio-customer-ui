<template lang="pug">
  .menstrual-calendar
    .menstrual-calendar__wrapper
      MenstrualCalendarBanner

      ui-debio-error-dialog(
        :show="!!error"
        :title="error ? error.title : ''"
        :message="error ? error.message : ''"
        @close="error = null"
      )

      ui-debio-modal.menstrual-calendar__modal(
        :show="showAlert"
        :show-title="false"
        :show-cta="false"
        disable-dismiss
      )
        .menstrual-calendar__modal-title Menstrual Calendar Subscription

        ui-debio-icon(
          :icon="alertTriangleIcon"
          size="90"
          color="#c400a5"
          stroke
        )
        .menstrual-calendar__modal-desc Are you sure you want to pay selected menstrual calendar subscription?

        .menstrual-calendar__modal-buttons(class=" justify-space-between align-center pa-10")
          ui-debio-button(
            :disabled="loading"
            color="secondary" 
            width="100px"
            height="35"
            style="font-size: 10px;"
            outlined 
            @click="showAlert = false"
          ) No

          ui-debio-button(
            :loading="loading"
            color="secondary" 
            width="100px"
            height="35"
            style="font-size: 10px;"
            @click="toSusbsribe"
          ) Yes

      ui-debio-modal.menstrual-calendar__modal-success(
        :show="isSuccess"
        :show-title="false"
        :show-cta="false"
        disable-dismiss
      )
        .menstrual-calendar__modal-title Payment Success
        ui-debio-icon(
          :icon="checkCircleIcon"
          size="90"
          color="#c400a5"
          stroke
        )

        .menstrual-calendar__modal-desc Congratulations! You have unlocked the menstrual calendar feature

        ui-debio-button(
          color="secondary" 
          width="100%"
          height="35"
          style="font-size: 10px;"
          @click="toMenstrualCalendar()"
        ) Continue to Menstrual Calendar

      .menstrual-calendar__subscription
        ui-debio-card.menstrual-calendar__subscription-text(width="654")
          .menstrual-calendar__subscription-text-span Get a Subcription plan!
          .menstrual-calendar__subscription-text-header The Benefits of A Subscription
          v-img.mt-10(
            block
            alt="no-list-data"
            src="@/assets/menstrual-calendar-brosure.svg"
            height="240px"
            )

          .menstrual-calendar__list
            .menstrual-calendar__content-list A Decentralized and Anonymous Menstrual Cycle Tracking Tool
            .menstrual-calendar__content-list 
              div Menstrual Calendar Cycle Report & Statistics
              v-alert.menstrual-calendar__alert(color="#FFE6E6" )
                .menstrual-calendar__alert-text Coming Soon
            .menstrual-calendar__content-list 
              div Menstrual Calendar Journal & Mood Tracker
              v-alert.menstrual-calendar__alert(color="#FFE6E6" )
                .menstrual-calendar__alert-text Coming Soon

        ui-debio-card.menstrual-calendar__subscription-plan(width="480")
          template(v-if="!paymentPreview")
            .menstrual-calendar__subscription-plan-header Select Subscription Plan

          template(v-if="paymentPreview")
            .menstrual-calendar__subscription-payment-back-wrapper(style="display:flex; margin:1rem 0;")
              v-btn.menstrual-calendar__subscription-payment-back(icon @click="toSubsPlan")
                v-icon mdi-chevron-left
              .menstrual-calendar__subscription-plan-header Select Payment Methods

          .menstrual-calendar__subscription-plan-breadcrumbs
            v-breadcrumbs(:items="breadcrumbs")
              template(v-slot:divider)
                v-icon mdi-chevron-right

          template(v-if="!paymentPreview")
            .menstrual-calendar__plan-card
              v-radio-group(v-model="subscription")
                template(v-for="plan in plans" )
                  ui-debio-card(width="410").my-1
                    .menstrual-calendar__plan-card-wrapper
                      v-radio.menstrual-calendar__plan-card-radio(
                        :label="plan.label" 
                        :value="plan" 
                        color="secondary"
                      )
                      v-alert.menstrual-calendar__plan-card-alert(v-if="plan.promo" color="#E7FFE6" )
                        .menstrual-calendar__plan-card-alert-text {{ plan.promo }}
                      .menstrual-calendar__plan-card-price Burn {{ plan.price }} {{ plan.currency}}
                        .menstrual-calendar__plan-card-price-scratch(v-if="plan.promo") Burn {{ plan.promoPrice }} {{ plan.currency }}
                        .menstrual-calendar__plan-card-price-convert ({{ plan.usd }} USD)

                    .menstrual-calendar__plan-card-desc.pt-1.ml-8 {{ plan.description }}

              ui-debio-button(
                :disabled="!subscription"
                color="secondary"
                width="100%"
                @click="toPaymentPreview"
              ) Select Plan

          template(v-if="paymentPreview")
            v-card.menstrual-calendar__plan-payment-card
              .menstrual-calendar__plan-payment-card-title Purchase Details
              v-divider.ma-4
              .menstrual-calendar__plan-payment-card-detail
                .menstrual-calendar__plan-payment-card-total-text {{ subscription.duration }}
                .menstrual-calendar__plan-card-price Burn {{ subscription.price }} {{ subscription.currency }}/ {{ subscription.periode}}                  
                  .menstrual-calendar__plan-card-price-convert ({{ subscription.usd }} USD)
              .menstrual-calendar__plan-payment-card-notes Any eligible subscription credit will be applied until it runs out. Your subscription will be renewed for {{ subscription.price }} {{ subscription.currency }} / {{ subscription.periode }} on {{getExpiredDate( subscription.periode )}}. Have any questions?
                a Contact our support team


            .menstrual-calendar__trans-weight
              .menstrual-calendar__trans-weight-text Estimated transaction weight
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

              div( style="font-size: 12px;" ) {{ txWeight}}

            ui-debio-button(
              color="secondary"
              width="100%"
              @click="showAlert = true"
            ) Pay Now!

</template>

<script>
import { alertTriangleIcon, checkCircleIcon } from "@debionetwork/ui-icons";
import MenstrualCalendarBanner from "./Banner";
import { mapState } from "vuex";
import {
  getMenstrualSubscriptionPrices,
  getActiveSubscriptionByOwner
} from "@/common/lib/polkadot-provider/query/menstrual-subscription";
import { getLastMenstrualCalendarByOwner } from "@/common/lib/polkadot-provider/query/menstrual-calendar";
import {
  addMenstrualSubscriptionFee,
  addMenstrualSubscription,
  setMenstrualSubscriptionPaid
} from "@/common/lib/polkadot-provider/command/menstrual-subscription";
import { formatPrice } from "@/common/lib/price-format";
import { generalDebounce } from "@/common/lib/utils";
import { getConversion } from "@/common/lib/api";

export default {
  name: "MenstrualCalendar",

  data: () => ({
    alertTriangleIcon,
    checkCircleIcon,
    plans: [
      {
        label: "Monthly",
        duration: "Monthly",
        description:
          "For users on a budget who want to try out menstrual calendar",
        price: 0,
        currency: "DBIO",
        usd: 0,
        promo: "",
        periode: "Month",
        promoPrice: 0
      },
      {
        label: "Quarterly",
        duration: "Quarterly",
        description: "Get full benefits on a discounted price",
        price: 0,
        currency: "DBIO",
        usd: 0,
        promo: "",
        periode: "3 Months",
        promoPrice: 0
      },
      {
        label: "Annually",
        duration: "Yearly",
        description: "Get full benefits on a discounted price",
        price: 0,
        currency: "DBIO",
        usd: 0,
        promo: "",
        periode: "Year",
        promoPrice: 0
      }
    ],
    subscription: null,
    paymentPreview: false,
    isSuccess: false,
    showAlert: false,
    txWeight: 0,
    breadcrumbs: [
      {
        text: "Subscription Plan",
        disabled: false,
        href: ".menstrual-calendar__subscription-plan"
      },
      {
        text: "Payment Preview",
        disabled: true,
        href: ".menstrual-calendar__plan-card"
      }
    ],
    currency: "",
    loading: false,
    error: null,
    lowBalance: false
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      web3: (state) => state.metamask.web3,
      lastEventData: (state) => state.substrate.lastEventData,
      walletBalance: (state) => state.substrate.walletBalance
    })
  },

  watch: {
    lastEventData(e) {
      if (e !== null) {
        const dataEvent = JSON.parse(e.data.toString());
        if (dataEvent[1] === this.wallet.address) {
          if (e.method === "MenstrualSubscriptionAdded") {
            this.toPayment(dataEvent[0].id);
          }

          if (e.method === "MenstrualSubscriptionPaid") {
            this.showAlert = false;
            this.isSuccess = true;
            this.loading = false;
          }
        }
      }
    },

    subscription: {
      deep: true,
      immediate: true,
      handler: generalDebounce(async function() {
        await this.getTxWeight();
      }, 500)
    }
  },

  async created() {
    await this.getSubscriptionPrices();
    await this.getTxWeight();
    await this.getActiveSubscription();
  },

  async mounted() {
    await this.getActiveSubscription();
  },

  components: {
    MenstrualCalendarBanner
  },

  methods: {
    async getRate() {
      const rate = await getConversion();
      return rate.dbioToUsd;
    },

    getExpiredDate(period) {
      const today = new Date();
      let newDate;

      if (period === "Month") {
        newDate = new Date(today.setMonth(today.getMonth() + 1));
      }

      if (period === "3 Months") {
        newDate = new Date(today.setMonth(today.getMonth() + 3));
      }

      if (period === "Year") {
        newDate = new Date(today.setMonth(today.getMonth() + 12));
      }

      let day = newDate.getDate() - 1;
      let month = newDate.toLocaleString("default", { month: "short" });
      let year = newDate.getFullYear();
      return `${day} ${month} ${year}`;
    },

    async toSusbsribe() {
      this.loading = true;

      const price = Number(
        String(this.subscription.price)
          .split(",")
          .join("")
      );
      if (this.walletBalance < price) {
        this.error = {
          title: "Insufficient Balance",
          message:
            "Your transaction cannot succeed due to insufficient balance, check your account balance"
        };
        this.showAlert = false;
        this.loading = false;
        return;
      }

      await addMenstrualSubscription(
        this.api,
        this.wallet,
        this.subscription.duration,
        this.subscription.currency
      );
    },

    async toPayment(id) {
      await setMenstrualSubscriptionPaid(this.api, this.wallet, id);
    },

    async getActiveSubscription() {
      const activeSubs = await getActiveSubscriptionByOwner(
        this.api,
        this.wallet.address
      );
      const menstrualCalendar = await getLastMenstrualCalendarByOwner(
        this.api,
        this.wallet.address
      );

      if (activeSubs) {
        if (!menstrualCalendar) {
          this.$router.push({ name: "menstrual-calendar-selection" });
          return;
        }

        this.$router.push({ name: "menstrual-calendar-detail" });
      }
    },

    async getSubscriptionPrices() {
      let monthlyPrice;
      this.plans.forEach(async (plan) => {
        getMenstrualSubscriptionPrices(
          this.api,
          plan.duration,
          plan.currency
        ).then((data) => {
          this.getRate().then((rate) => {
            plan.price = formatPrice(data.amount, plan.currency);
            plan.usd = (Number(plan.price.split(",").join("")) * rate).toFixed(
              8
            );
            if (plan.duration === "Monthly") {
              monthlyPrice = plan.price;
            }
            if (plan.duration === "Quarterly") {
              plan.promoPrice = Number(monthlyPrice.split(",").join("")) * 3;
            }
            if (plan.duration === "Yearly") {
              plan.promoPrice = Number(monthlyPrice.split(",").join("")) * 12;
            }
          });
        });
      });
    },

    async getTxWeight() {
      const txWeight = await addMenstrualSubscriptionFee(
        this.api,
        this.wallet,
        this.subscription.duration,
        this.subscription.currency
      );
      this.txWeight = `${Number(
        this.web3.utils.fromWei(String(txWeight.partialFee), "ether")
      ).toFixed(8)} DBIO`;
    },

    setActive(currency) {
      return currency === this.subscription.currency ? "secondary" : "";
    },

    toPaymentPreview() {
      this.paymentPreview = true;
      this.breadcrumbs[0].disabled = true;
      this.breadcrumbs[1].disabled = false;
    },

    toSubsPlan() {
      this.paymentPreview = false;
      this.breadcrumbs[0].disabled = false;
      this.breadcrumbs[1].disabled = true;
    },

    toMenstrualCalendar() {
      this.showAlert = false;
      this.isSuccess = false;
      this.$router.push({ name: "menstrual-calendar-selection" });
    }
  }
};
</script>

<style lang="sass" scoped>
@import "@/common/styles/mixins.sass"

.menstrual-calendar
  &__subscription-payment-back-wrapper
    display:flex

  &__wrapper
    height: 100%

  &__subscription
    margin-top: 16px
    display: flex
    gap: 16px
    height: 593px

  &__subscription-text
    height: 593px

  &__subscription-text-span
    color: #FF8FCD
    @include button-2

  &__subscription-text-header
    @include h4-opensans

  &__subscription-plan-header
    @include h6-opensans

  &__plan-card-wrapper
    display: flex
    justify-content: space-between

  &__plan-card-desc
    color: #757274
    overflow:auto
    width:55%
    @include body-text-3

  &__subscription-plan-breadcrumbs
    margin: -22px

  &__plan-card-price
    justify-content:end
    text-align:right
    @include button-2

  &__plan-card-price-scratch
    text-align: right
    justify-content:end
    opacity: 0.6
    text-decoration: line-through
    @include body-text-4

  &__plan-card-price-convert
    text-align: right
    justify-content:end
    color: #FF56E0
    @include body-text-5

  &__plan-card-alert
    height: 24px
    margin-left: -40px
    background: #E0FFE1
    padding: 4px 12px

  &__plan-card-alert-text
    color: #32D47D
    font-size: 12px

  &__subscription-payment
    display: flex

  &__plan-payment-card
    margin-top: 20px

  &__plan-payment-card-title
    padding: 16px
    margin-bottom: -16px
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
    @include body-text-3-opensans

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

  &__alert
    height: auto
    padding: 2px
    margin-bottom: 1px

  &__alert-text
    color: #FF8F8F
    font-size: 12px
    text-transform: none !important

  &__list
    display: flex
    flex-direction: column
    margin-top: 20px !important
    gap: 20px

  &__content-list
    margin-top: 8px !important
    display: flex
    widows: 100%
    gap: 10px
</style>
