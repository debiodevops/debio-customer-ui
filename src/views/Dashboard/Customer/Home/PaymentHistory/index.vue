<template lang="pug">
.payment-history
  .payment-history__wrapper
    ui-debio-data-table(
      :headers="paymentHeaders",
      :loading="isLoading",
      :items="payments"
    )
      template(slot="prepend")
        .payment-history__nav
          .payment-history__nav-text
            h2.payment-history__title Payment History
            p.payment-history__subtitle.mb-0 Your most recent transactions
          ui-debio-input.payment-history__search-bar(
            v-model="searchQuery",
            variant="small",
            width="270",
            placeholder="Service Name, Payment Status, Lab Name",
            outlined,
            @input="onSearchInput(searchQuery)"
          )
            ui-debio-icon(
              slot="icon-append",
              size="20",
              @click="onSearchInput(searchQuery)",
              role="button",
              :icon="searchIcon",
              stroke
            )

      template(
        v-slot:[`item.price`]="{ item }"
      )
        .payment-history__price-details
          | {{ formatPrice(item.price.replaceAll(',', ''), item.currency) }}
          | {{ formatUSDTE(item.currency) }}

      template(v-slot:[`item.status`]="{ item }")
        span(:style="{ color: setButtonBackground(item.status) }") {{ item.status }}

      template(v-slot:[`item.actions`]="{ item }")
        ui-debio-button(
          :color="item.status === 'Unpaid' ? 'secondary' : 'primary'",
          width="80",
          height="25",
          dark,
          @click="handleDetails(item)",
          block
        ) {{ item.status === 'Unpaid' ? 'Pay' : 'Details' }}
</template>

<script>
import { mapState } from "vuex"
import { searchIcon } from "@debionetwork/ui-icons"
import { generalDebounce } from "@/common/lib/utils"
import { getOrderList } from "@/common/lib/api"
import { formatPrice, formatUSDTE } from "@/common/lib/price-format.js"
import { getMenstrualSubscriptionPrices } from "@/common/lib/polkadot-provider/query/menstrual-subscription"


export default {
  name: "CustomerPaymentHistory",

  data: () => ({
    searchIcon,
    formatPrice,
    formatUSDTE,

    searchQuery: "",
    paymentHeaders: [
      { text: "Service Name", value: "service_info.name", sortable: true },
      { text: "Service Provider", value: "provider", sortable: true },
      { text: "Order Date", value: "created_at", sortable: true },
      { text: "Price", value: "price", sortable: true },
      { text: "Status", value: "status", align: "right", sortable: true },
      { text: "Actions", value: "actions", sortable: false, align: "center", width: "5%" }
    ],
    payments: []
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      web3: (state) => state.metamask.web3,
      lastEventData: (state) => state.substrate.lastEventData
    })
  },

  watch: {
    searchQuery(newVal, oldVal) {
      if (newVal === "" && oldVal) this.metamaskDispatchAction(this.onSearchInput)
    },

    lastEventData(event) {
      if (!event) return
      const methodToRefetch = ["OrderCreated", "OrderCancelled"]
      if (methodToRefetch.includes(event.method)) getOrderList()
    }
  },

  async created() {
    await this.onSearchInput()
  },

  methods: {
    onSearchInput: generalDebounce(async function (val) {
      try {
        this.isLoading = true
        const { orders, ordersGA, menstrualSubscription } = await getOrderList(val)
        const menstrualSubscriptionPriceRequests = menstrualSubscription.data.map((subs) => {
          const info = subs._source
          return getMenstrualSubscriptionPrices(this.api, info.duration, info.currency )
        })

        const menstrualSubscriptionPrices = await Promise.all([...menstrualSubscriptionPriceRequests])

        // Assign each menstrualSubscribtionPrices into menstrualSubscription by index
        menstrualSubscription.data.map((data, index) => {
          data.price = menstrualSubscriptionPrices[index]
        })
        const results = [...orders.data, ...ordersGA.data, ...menstrualSubscription.data]

        results.map((result) => {
          const analystName = `
            ${result._source?.genetic_analyst_info?.first_name ?? ""}
            ${result?._source?.genetic_analyst_info?.last_name ?? ""}
          `

          const computeAnalystName = !/^\s*$/.test(analystName)
            ? analystName
            : "Unknown Analyst Provider"

          const date = typeof(result._source.created_at) === "string" ? result._source.created_at.replaceAll(",", "") : result._source.created_at
          if(result._index === "menstrual-subscription") {
            this.payments.push({
              service_info: {
                name: `Menstrual Calendar ${result._source.duration} Subscription` 
              },
              id: result._id,
              provider: "DeBio Network",
              timestamp: parseInt(date),
              created_at: new Date(parseInt(date)).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }),
              price: result.price.amount,
              currency: result.price.currency,
              status: "Paid"
            })          
          } else {
            this.payments.push(
              {
                ...result._source,
                id: result._id,
                provider: result._index === "orders"
                  ? result._source?.lab_info?.name ?? "Unknown Lab Provider"
                  : computeAnalystName,
                timestamp: parseInt(date),
                created_at: new Date(parseInt(date)).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                }),
                price: result._source.service_info.prices_by_currency[0].total_price,
                currency: result._source.currency
              }
            )
          }
        })

        // NOTE: Set unpaid status to always be in the top position
        this.payments.sort((a, b) => {
          if (b.status === "Unpaid") return
          else return b.timestamp - a.timestamp
        })
        this.isLoading = false
      } catch (error) {
        this.isLoading = false
        console.error(error)
      }
    }, 250),

    setButtonBackground(status) {
      const colors = Object.freeze({
        FULFILLED: "#5640a5",
        PAID: "#5640a5",
        CANCELLED: "#9B1B37",
        REFUNDED: "#595959",
        UNPAID: "#E27625"
      })

      return colors[status.toUpperCase()]
    },

    handleDetails(item) {
      let id = ""
      if (item.id) id = item.id
      else id = item.orderId

      if (item["genetic_data_id"]) {
        if (item.status === "Unpaid") this.$router.push({
          name: "customer-request-analysis-payment",
          params: { id }
        })
        else this.$router.push({
          name: "customer-payment-details",
          params: { id }
        })
        return
      }

      if (item.status === "Unpaid") this.$router.push({
        name: "customer-request-test-checkout",
        params: { id }
      })
      else this.$router.push({ name: "customer-payment-details", params: { id } })
    }
  }
}
</script>

<style lang="sass">
@import "@/common/styles/mixins.sass"

.payment-history
  &__nav
    display: flex
    align-items: center
    justify-content: space-between

    &__name-details
      display: flex
      gap: 15px
      align-items: center

    &__item-details
      display: flex
      gap: 8px
      flex-direction: column

    &__item-name
      @include body-text-medium-3

    &__item-speciment
      color: #757274
      @include body-text-4
</style>
