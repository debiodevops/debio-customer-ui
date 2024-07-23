<template lang="pug">
  v-dialog.staking-dialog(:value="show" width="775" persistent rounded )
    v-card.staking-dialog__dialog
      v-app-bar(flat dense color="white" )
        v-toolbar-title.staking-dialog__title Staking Coin Agreement
        v-spacer
        v-btn(icon @click="closeDialog")
          v-icon mdi-close
  
      v-card-text
        v-row.staking-dialog__row
          v-col.staking-dialog__card
            ol.staking-dialog__card-text.ml-3
              li.staking-dialog__card-text-content There's no locking period. Your fund can be unstaked anytime with your consent but there will be a period of 6 days to process it.
              li.staking-dialog__card-text-content Upon receiving your test result, you will be rewarded with DBIO as a token of gratitude for using our service. By unstaking your fund, you will lose this privilege.
              li.staking-dialog__card-text-content You will receive notification when requested service is available. You can proceed to request a test. If the staked amount is bigger than the service price, you will get refund for overpayment. If staked amount is smaller than the service price, to complete the purchase, you should pay for the outstanding amount to complete the purchase.

          v-col.staking-dialog__form
            label.staking-dialog__form-label Country
            v-autocomplete.staking-dialog__form-field(
              dense
              key="country"
              v-model="country"
              :items="countries"
              item-text="name"
              item-value="iso2"
              placeholder="Select Country"
              @change="onCountryChange"
              autocomplete="off"
              outlined
            )

            label.staking-dialog__form-label State/Province
            v-autocomplete.staking-dialog__form-field(
              dense
              key="state"
              v-model="state"
              :items="states"
              item-text="name"
              item-value="state_code"
              placeholder="Select State/Province"
              :disabled="!country"
              @change="onStateChange"
              autocomplete="off"
              outlined
            )

            label.staking-dialog__form-label City
            v-autocomplete.staking-dialog__form-field(
              dense
              key="city"
              v-model="city"
              :items="cities"
              item-text="name"
              return-object
              placeholder="Select City"
              :disabled="!state"
              @change="onCityChange"
              autocomplete="off"
              outlined
            )

            label.staking-dialog__form-label Category
            v-select.staking-dialog__form-field(
              dense
              :items="categories"
              v-model="category"
              item-text="service_categories"
              item-value="service_categories"
              menu-props="auto"
              placeholder="Select Category"
              :disabled="!city"
              @change="onCategoryChange"
              autocomplete="off"
              outlined
            )

            label.staking-dialog__form-label Staking Amount
            v-text-field.staking-dialog__form-field(
              v-model="amount"
              type="number"
              dense
              min="0"
              step=".001"
              placeholder="Amount (DBIO)"
              outlined
            )

            div.staking-dialog__alert.d-flex(v-if="showErrorAlert")
              ui-debio-icon.staking-dialog__icon(
                :icon="alertIcon"
                size="14"
                stroke
                color="#F5222D"
              )
              .staking-dialog__alert-text You cannot request a lab to provide this service since it's already available in your area. Click 
                a.link.staking-dialog__alert-text(@click="toSelectService") here 
                span.staking-dialog__alert-text to see the test

            v-checkbox.staking-dialog__checkbox(v-model="agree")
              template(v-slot:label) 
                div(style="font-size: 12px;") I have read and agree to the 
                  a.link(href="https://docs.debio.network/legal/terms-and-condition" target="_blank" rel="noreferrer noopener nofollow") terms and conditions

            .staking-dialog__trans-weight
              .staking-dialog__trans-weight-text Estimated transaction weight
                v-tooltip.visible(bottom )
                  template(v-slot:activator="{ on, attrs }")
                    v-icon.staking-dialog__trans-weight-icon(
                      style="font-size: 12px;"
                      color="primary"
                      dark
                      v-bind="attrs"
                      v-on="on"
                    ) mdi-alert-circle-outline 
                  span(style="font-size: 10px;") Total fee paid in DBIO to execute this transaction.

              div( style="font-size: 12px;" ) {{ Number(txWeight).toFixed(4) }} DBIO

            .staking-dialog__input-button
              ui-debio-button(
                color="secondary"
                width=140
                height=32
                outlined
              ) Cancel

              ui-debio-button(
                depressed
                color="secondary"
                large
                height=32
                width=140
                @click="submitServiceRequestStaking"
                :loading="isLoading"
                :disabled="disable"
              ) Stake

      v-progress-linear(
        v-if="isLoading"
        indeterminate
        color="primary"
      )
    ui-debio-error-dialog(
      :show="showError"
      :title="errorTitle"
      :message="errorMsg"
      @close="showError = false"
    )

</template>

<script>
import { mapState } from "vuex"
import { createRequest } from "@/common/lib/polkadot-provider/command/service-request"
import { createRequestFee } from "@debionetwork/polkadot-provider"
import errorMessage from "@/common/constants/error-messages"
import {errorHandler} from "@/common/lib/error-handler"
import { getLocations, getStates, getCities, getCategories } from "@/common/lib/api"
import { alertIcon } from "@debionetwork/ui-icons"
import Web3 from "web3"


export default {
  name: "AgreementDialog",

  props: {
    show: Boolean
  },

  data: () => ({
    alertIcon,
    errorMessage,
    currencyList: ["DBIO"], 
    currencyType: "DBIO",
    agree: false,
    amount: "",
    dialogAlert: false,
    isLoading: false,
    transactionStep: "",
    txWeight: 0,
    showError: false,
    errorTitle: "",
    errorMsg: "",

    country: "",
    state: "",
    city: "",
    category: "",

    states: [],
    cities: [],
    categories: [],
    countries: [],
    noState: false,
    noCity: false,
    countryName: "",
    showErrorAlert: false

  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      pair: (state) => state.substrate.wallet,
      setCountry: (state) => state.lab.country,
      setState: (state) => state.lab.region,
      setCity: (state) => state.lab.city,
      setCategory: (state) => state.lab.category,
      lastEventData: (state) => state.substrate.lastEventData,
      walletBalance: (state) => state.substrate.walletBalance
    }),

    amountRules() {
      return [
        val => !!val || this.errorMessage.REQUIRED,
        val => !!/^[0-9]\d*(\.\d{0,9})?$/.test(val) || this.errorMessage.INPUT_CHARACTER("Numbers (e.g. 20.005)"),
        val => val > 0 || this.errorMessage.AMOUNT
      ]
    },

    disable() {
      const {country, state, city, category} = this
      return !(country && state && city && category && this.amount && this.agree && this.amount > 0)
    }
  },

  async mounted () {
    await this.getCountries()
    await this.getServiceCategory()

    const txWeight = await createRequestFee(this.api, this.pair, this.country, this.state, this.city, this.category)
    this.txWeight = Web3.utils.fromWei(String(txWeight.partialFee), "ether")
  },

  watch: {
    lastEventData() {
      if (this.lastEventData) {
        if (this.lastEventData.method === "ServiceRequestCreated") {
          this.isLoading = false
          this.dialogAlert = true
          this.$emit("click")
        }
      }      
    }
  },
  
  methods: {
    closeDialog() {
      this.$emit("close")
    },

    toSelectService() {
      this.$emit("fetch")
    },

    async getServiceCategory() {
      const data = await getCategories()
      this.categories = data

      if (this.setCategory) {
        this.category = this.setCategory
      }
    },

    async getCountries() {
      this.noState = false
      this.noCity = false

      const { data : { data }} = await getLocations()
      this.countries = data

      if (this.setCountry) {
        this.country = this.setCountry
        await this.onCountryChange(this.country)
      }
    },

    async onCountryChange(selectedCountry) {
      this.states = []
      this.cities = []

      this.countryName = this.countries.filter((c) => c.iso2 === selectedCountry)[0].name
      const { data : { data }} = await getStates(selectedCountry)

      if (data.length < 1) {
        this.states.push(this.countryName)
        this.noState = true
        this.country = selectedCountry
        return
      }

      this.states = data
      this.country = selectedCountry
      this.noState = false

      if (this.setState) {
        this.state = this.setState
        await this.onStateChange(this.state)
      }
    },

    async onStateChange(selectedState) {
      this.noCity = false

      if (this.noState) {
        this.state = this.country
        this.cities.push(this.countryName)
        return
      }

      const { data : { data }} = await getCities(this.country, selectedState)

      if (data.length < 1) {
        this.noCity = true
        this.stateName = this.states.filter((s) => s.state_code === selectedState)[0].name
        this.cities.push(this.stateName)
      } else {
        this.cities = data
      }
      
      this.state = selectedState

      if (this.setCity) {
        this.city = this.setCity
      }
    },

    async onCityChange(selectedCity) {
      if (this.noState || this.noCity) {
        this.city = selectedCity
        return
      }

      this.city = selectedCity.name
    },

    async onCategoryChange(selectedCategory) {
      this.category = selectedCategory
    },

    async submitServiceRequestStaking() {
      const sufficientBalance = (Number(this.amount) + Number(this.txWeight)) <= Number(this.walletBalance)

      if (!sufficientBalance) {
        const error = await errorHandler("Insufficient Balance")
        this.errorTitle = error.title
        this.errorMsg = error.message
        this.showError = true
        return 
      }

      this.isLoading = true

      const country = this.country
      const region = this.state
      const city = this.city
      const category = this.category
      const status = "All"
      await this.$store.dispatch("lab/setCountryRegionCity", {country, region, city})
      const services = await this.$store.dispatch("lab/getServicesByCategory", {category, status})

      if (!services.length) {
        try {
          await createRequest(
            this.api,
            this.pair,
            this.country,
            this.state,
            this.city,
            this.category,
            this.amount
          )

        } catch (err) {
          const error = await errorHandler(err.message)
          
          this.errorTitle = error.title
          this.errorMsg = error.message
          this.showError = true
          this.isLoading = false
        }
      }

      if (services.length) {
        this.showErrorAlert = true
        this.isLoading = false
      }
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
  
  .staking-dialog
    height: 580px
    background-color: #FF0000

    &__title
      display: flex
      align-items: center
      letter-spacing: 0.0075em
      margin-left: 20px
      margin-top: 10px
      @include button-1
    
    &__card
      background-color: #F5F7F9
      margin: 26px 30px
      height: 500px

    &__card-text
      padding: 18px 12px
      letter-spacing: -0.004em

    &__card-text-content
      margin-bottom: 4px
      @include body-text-3-opensans

    &__form
      margin-top: 6px
      height: 465px
      gap: 10px
      padding: 12px 8px

    &__form-label
      font-size: 12px

    &__form-field
      font-size: 12px
      max-width: 340px
      max-height: 48px

    &__checkbox
      margin-top: 12px
      margin-bottom: -10px
   
    &__trans-weight
      display: flex
      justify-content: space-between

    &__trans-weight-text
      max-width: 330px
      margin-bottom: 10px
      letter-spacing: -0.004em
      display: flex
      align-items: center
      @include body-text-3-opensans

    &__input-button
      display: flex
      align-items: center
      justify-content: space-between
      letter-spacing: -0.015em
      @include tiny-semi-bold

    &__trans-weight-icon
      margin-left: 5px

    &__alert
      max-width: 100%
      margin-bottom: 2%
      margin-top: 2%
      color:#F92020
      @include body-text-2

    &__icon
      margin-top: 1px
      margin-right: 3px

    &__alert-text
      @include tiny-semi-bold

</style>
