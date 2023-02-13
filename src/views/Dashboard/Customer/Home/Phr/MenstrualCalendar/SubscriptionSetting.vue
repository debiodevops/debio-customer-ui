<template lang="pug">
.subscription-setting
  .subscription-setting__wrapper
    MenstrualCalendarBanner

    ui-debio-error-dialog(
      :show="!!error"
      :title="error ? error.title : ''"
      :message="error ? error.message : ''"
      @close="error = null"
    )

    ui-debio-modal.subscription-setting__modal(
      :show="showAlert",
      :show-title="false",
      :show-cta="false",
      disable-dismiss
    )
      .subscription-setting__modal-title Renew Menstrual Calendar

      ui-debio-icon(
        :icon="alertTriangleIcon",
        size="90",
        color="#c400a5",
        stroke
      )
      .subscription-setting__modal-desc Are you sure you want to pay selected menstrual calendar subscription?

      .subscription-setting__modal-buttons.justify-space-between.align-center.pa-10
        ui-debio-button(
          :disabled="loading"
          color="secondary",
          width="100px",
          height="35",
          style="font-size: 10px",
          outlined,
          @click="showAlert = false"
        ) No

        ui-debio-button(
          :loading="loading"
          color="secondary",
          width="100px",
          height="35",
          style="font-size: 10px",
          @click="toSusbsribe"
        ) Yes

    ui-debio-modal.subscription-setting__modal-success(
      :show="isSuccess",
      :show-title="false",
      :show-cta="false",
      disable-dismiss
    )
      .subscription-setting__modal-title Payment Success
      ui-debio-icon(
        :icon="checkCircleIcon",
        size="90",
        color="#c400a5",
        stroke
      )

      .subscription-setting__modal-desc Congratulations! You have unlocked the menstrual calendar feature

      ui-debio-button(
        color="secondary",
        width="100%",
        height="35",
        style="font-size: 10px",
        @click="paymentSuccessAction()"
      ) Continue to Menstrual Calendar

    .subscription-setting__my-subscription
      ui-debio-card.subscription-setting__calendar-selection(width="654")
        .subscription-setting__head
          v-btn(@click="backButton", icon)
            v-icon mdi-chevron-left
          .subscription-setting__head-text
            span.subscription-setting__head-text-primary My Subscription
            span.subscription-setting__head-text-secondary Your subscription will end in {{ reminder }}

        ui-debio-card.subscription-setting__subscription-detail(width="590")
          .subscription-setting__subscription-detail-head
            span.subscription-setting__head-text-primary My Subscription
          v-divider.subscription-setting__divider
          .subscription-setting__subscription-list-detail
            .subscription-setting__subscription-item-detail(
              v-for="subscription in subscriptionList"
            )
              .subscription-setting__subscription-wrapper-item-status
                span.subscription-setting__subscription-item-status(
                  :class="{ 'status-active': subscription.statusNumber === 1, 'status-in-queue': subscription.statusNumber === 2}"
                ) {{ subscription.status }}
              .subscription-setting__subscription-item-card
                .subscription-setting__subscription-item-card-text-status
                  .subscription-setting__subscription-item-card-text-status-primary {{ subscription.name }}
                  .subscription-setting__subscription-item-card-text-status-secondary {{ subscription.textStatus }}
                .subscription-setting__plan-card-price Burn {{ subscription.price }} DBIO
                  .subscription-setting__plan-card-price-convert ({{ subscription.usd }} USD)

      ui-debio-card.subscription-setting__subscription-plan(width="480")
        template(v-if="!paymentPreview")
          .subscription-setting__subscription-payment-back-wrapper
            .subscription-setting__subscription-plan-header Renew Subscription

        template(v-if="paymentPreview")
          .subscription-setting__subscription-payment-back-wrapper
            v-btn.subscription-setting__subscription-payment-back(
              icon,
              @click="toSubsPlan"
            )
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
                template(v-for="plan in plans")
                  ui-debio-card(width="410").my-1
                    .subscription-setting__plan-card-wrapper
                      v-radio.subscription-setting__plan-card-radio(
                        :label="plan.label"
                        :value="plan"
                        color="secondary"
                      )
                      v-alert.subscription-setting__plan-card-alert(v-if="plan.promo" color="#E7FFE6")
                        .subscription-setting__plan-card-alert-text {{ plan.promo }}
                      .subscription-setting__plan-card-price Burn {{ plan.price }} {{ plan.currency }}
                        .subscription-setting__plan-card-price-scratch(v-if="plan.promo") Burn {{ plan.promoPrice }} {{ plan.currency }}
                        .subscription-setting__plan-card-price-convert ({{ plan.usd }} USD)

                    .subscription-setting__plan-card-desc.pt-1.ml-8 {{ plan.description }}

            ui-debio-button(
              color="secondary",
              width="100%",
              @click="toPaymentPreview()"
            ) Select Plan

        template(v-if="paymentPreview")
          v-card.subscription-setting__plan-payment-card
            .subscription-setting__plan-payment-card-title Purchase Details
            v-divider.ma-4
            .subscription-setting__plan-payment-card-detail
              .subscription-setting__plan-payment-card-total-text Menstrual Date {{ subscription.duration }}
              .subscription-setting__plan-card-price Burn {{ subscription.price }} {{subscription.currency}}/ {{ subscription.periode }}
                .subscription-setting__plan-card-price-convert ({{ subscription.usd }} USD)
            .subscription-setting__plan-payment-card-notes Any eligible subscription credit will be applied until it runs out. Your subscription will renew for {{ subscription.price }} / {{ subscription.periode }} on {{getExpiredDate( subscription.periode )}}. Have any questions?
              a Contact our support team

          .subscription-setting__trans-weight
            .subscription-setting__trans-weight-text Estimated transaction weight
              v-tooltip.visible(bottom)
                template(v-slot:activator="{ on, attrs }")
                  v-icon.dialog-confirmation__trans-weight-icon(
                    style="font-size: 12px",
                    color="primary",
                    dark,
                    v-bind="attrs",
                    v-on="on"
                  ) mdi-alert-circle-outline
                span(style="font-size: 10px") Total fee paid in DBIO to execute this transaction.

            div(style="font-size: 12px") {{txWeight}}

          ui-debio-button(
            color="secondary",
            width="100%",
            @click="showAlert = true"
          ) Pay Now!
</template>

<script>
import { alertTriangleIcon, checkCircleIcon } from "@debionetwork/ui-icons";
import MenstrualCalendarBanner from "./Banner";
import { mapState } from "vuex";
import { generalDebounce } from "@/common/lib/utils";
import {
  getMenstrualSubscriptionPrices, getActiveSubscriptionByOwner, getMenstrualSubscriptionById, getMenstrualSubscriptionByOwner
} from "@/common/lib/polkadot-provider/query/menstrual-subscription";
import {
  addMenstrualSubscriptionFee,
  addMenstrualSubscription,
  setMenstrualSubscriptionPaid
} from "@/common/lib/polkadot-provider/command/menstrual-subscription";
import { formatPrice } from "@/common/lib/price-format";
import { getConversion } from "@/common/lib/api";

export default {
  name: "SubscriptionSetting",

  components: {
    MenstrualCalendarBanner
  },

  data: () => ({
    alertTriangleIcon,
    checkCircleIcon,
    paymentPreview: false,
    isSuccess: false,
    showAlert: false,
    subscription: null,
    durationSubscription: {
      "Monthly": 30 * 24 * 60 * 60 * 1000,
      "Quarterly": 3 * 30 * 24 * 60 * 60 * 1000,
      "Yearly": 12 * 30 * 24 * 60 * 60 * 1000
    },
    reminder: "",
    subscriptionList: [],
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
      { label: "Monthly", duration: "Monthly", description: "For users on a budget who want to try out menstrual calendar", price: 0, currency: "DBIO", usd: 0, promo: "", periode: "Month", promoPrice: 0 },
      { label: "Quarterly", duration: "Quarterly", description: "Get full benefits on a discounted price", price: 0, currency: "DBIO", usd: 0, promo: "Save 10%", periode: "3 Months", promoPrice: 0 },
      { label: "Annualy", duration: "Yearly", description: "Get full benefits on a discounted price", price: 0, currency: "DBIO", usd: 0, promo: "Save 50%", periode: "Year", promoPrice: 0 }
    ],
    loading: false,
    error: null
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
      handler: generalDebounce(async function () {
        await this.getTxWeight();
      }, 500)
    }
  },

  async created() {
    await this.getSubscriptionPrices();
    await this.getTxWeight();
    await this.getActiveSubscription();
    await this.getSubscriptonByOwner();
  },

  async mounted() {
    await this.getActiveSubscription();
    await this.getSubscriptonByOwner();
  },

  methods: {
    backButton() {
      this.$router.push({ name: "menstrual-calendar-detail" })
    },
    async getSubscriptonByOwner() {
      const subscriptions = await getMenstrualSubscriptionByOwner(this.api, this.wallet.address);
      const subsIds = await Promise.all(subscriptions.map(subs => getMenstrualSubscriptionById(this.api, subs)));
      const subsPrices = await Promise.all(subsIds.map(subsId => getMenstrualSubscriptionPrices(this.api, subsId.duration, subsId.currency)));
      const rate = await this.getRate();
      let activeDate;
      this.subscriptionList = subsIds.filter(subsId => subsId.status !== "Inactive").map((subsId, index) => {
        const period = subsId.duration === "Monthly" ? "Month" : (subsId.duration === "Quarterly" ? "3 Months" : "Year")
        const price = formatPrice(subsPrices[index].amount, subsId.currency)
        if (subsId.status === "Active") {
          activeDate = this.getExpiredDateSubsList(period, subsId.updatedAt)
        }
        const inQueueDate = subsId.status === "InQueue" ? this.getInQueueDate(period, activeDate ? activeDate.createdDate : subsId.updatedAt) : null
        return {
          statusNumber: subsId.status === "Active" ? 1 : subsId.status === "InQueue" ? 2 : null,
          status: subsId.status,
          name: `Menstrual Date ${subsId.duration}`,
          textStatus: subsId.status === "Active" ? `Active until ${activeDate.day} ${activeDate.month} ${activeDate.year}` : `Start on ${activeDate.day + 1} ${activeDate.month} ${activeDate.year} until ${inQueueDate.day} ${inQueueDate.month} ${inQueueDate.year}`,
          price: price,
          usd: (parseFloat(price.split(",").join("")) * rate).toFixed(8)
        }
      });
    },

    getExpiredDateSubsList(period, startDate) {
      startDate = startDate.replace(/,/g, "")
      let timestamp = parseInt(startDate);
      const today = new Date(timestamp);
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
      let month = newDate.toLocaleString("default", { month: "long" });
      let year = newDate.getFullYear();

      return {
        day: day,
        month: month,
        year: year,
        createdDate: newDate
      }
    },
    getInQueueDate(period, startDate) {
      let timestamp = new Date(startDate).getTime();
      const today = new Date(timestamp);
      let newDate;

      let createdDate = today.toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric" })

      if (period === "Month") {
        newDate = new Date(today.setMonth(today.getMonth() + 1));
      }

      if (period === "3 Months") {
        newDate = new Date(today.setMonth(today.getMonth() + 3));
      }

      if (period === "Year") {
        newDate = new Date(today.setMonth(today.getMonth() + 12));
      }

      let day = newDate.getDate();
      newDate.setDate(day);
      let month = newDate.toLocaleString("default", { month: "long" });
      let year = newDate.getFullYear();

      return {
        day: day,
        month: month,
        year: year,
        createdDate: createdDate
      }
    },

    getMonthNumber(month) {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      return months.indexOf(month);
    },

    async getActiveSubscription() {
      const activeSubs = await getActiveSubscriptionByOwner(this.api, this.wallet.address)
      const subscriptionDetail = await getMenstrualSubscriptionById(this.api, activeSubs)
      // get current date
      let currentDate = new Date().getTime()
      // date subscription
      const date = subscriptionDetail.updatedAt === "0" ? Number(subscriptionDetail.createdAt.split(",").join("")) : Number(subscriptionDetail.updatedAt.split(",").join(""))
      const endDateSubscription = date + this.durationSubscription[subscriptionDetail.duration]
      const reminder = Math.ceil((endDateSubscription - currentDate) / (24 * 60 * 60 * 1000))
      if (reminder <= 30) {
        this.reminder = reminder === 1 ? `${reminder} Day` : `${reminder} Days`
      } else if (reminder < 365) {
        const month = Math.floor(reminder / 30)
        const days = reminder % 30
        if (days > 0) {
          this.reminder = `${month} ${month === 1 ? "Month" : "Months"} ${days} ${days === 1 ? "Day" : "Days"}`
        } else {
          this.reminder = `${month} ${month === 1 ? "Month" : "Months"}`
        }
      } else {
        const year = Math.floor(reminder / 365)

        this.reminder = `${year} ${year === 1 ? "Year" : "Years"}`
      }
    },

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

      const price = Number(String(this.subscription.price).split(",").join(""));
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

    async getSubscriptionPrices() {
      let monthlyPrice
      this.plans.forEach(async (plan) => {
        getMenstrualSubscriptionPrices(
          this.api,
          plan.duration,
          plan.currency
        ).then((data) => {
          this.getRate().then((rate) => {
            plan.price = formatPrice(data.amount, plan.currency);
            plan.usd = (Number(plan.price.split(",").join("")) * rate).toFixed(8);
            if (plan.duration === "Monthly") {
              monthlyPrice = plan.price
            }
            if (plan.duration === "Quarterly") {
              plan.promoPrice = (Number(monthlyPrice.split(",").join("")) * 3);
            }
            if (plan.duration === "Yearly") {
              plan.promoPrice = (Number(monthlyPrice.split(",").join("")) * 12);
            }
          });
        });
      });
    },

    async getTxWeight() {
      const txWeight = await addMenstrualSubscriptionFee(
        this.api,
        this.wallet,
        this.subscription?.duration,
        this.subscription?.currency
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
    async paymentSuccessAction() {
      this.isSuccess = false
      this.submitPreview = true
      this.nextStatus = true
      this.$router.push({ name: "menstrual-calendar-detail" })
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
    font-weight: 800
    font-size: 16px
    line-height: 20px

  &__subscription-item-card-text-price-convert
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
    overflow:auto
    width:55%
    @include body-text-3

  &__subscription-plan-breadcrumbs
    margin: -22px

  &__subscription-plan-breadcrumbs
    margin: -22px

  &__plan-card-price
    justify-content:end
    text-align:end
    @include button-2

  &__plan-card-price-scratch
    text-align:end
    justify-content:end
    opacity: 0.6
    text-decoration: line-through
    @include body-text-4

  &__plan-card-price-convert
    text-align:end
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
