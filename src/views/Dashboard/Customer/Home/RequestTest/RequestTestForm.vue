<template lang="pug">
  v-row(class="d-flex justify-center mt-16")
    v-col(cols="5")
      label.request-test-form Country
      v-autocomplete.request-test-form(
        dense
        key="country"
        v-model="country"
        :items="countries"
        item-text="name"
        item-value="iso2"
        placeholder="Select Country"
        :rules="[val => !!val || errorMessage.REQUIRED]"
        @change="onCountryChange"
        autocomplete="off"
        outlined)

      label.request-test-form State/Province
        ui-debio-button.request-test-form__label-desc(
          disabled
          style="font-size: 8px;"
          width="40"
          height="20"          
          ) Optional
      v-autocomplete.request-test-form(
        dense
        key="state"
        v-model="state"
        :items="states"
        item-text="name"
        item-value="state_code"
        placeholder="Any"
        :disabled="!country"
        @change="onStateChange"
        autocomplete="off"
        outlined)

      label.request-test-form City
        ui-debio-button.request-test-form__label-desc(
          disabled
          style="font-size: 8px;"
          width="40"
          height="20"          
          ) Optional
      v-autocomplete.request-test-form(
        dense
        key="city"
        v-model="city"
        :items="cities"
        item-text="name"
        return-object
        placeholder="Any"
        :disabled="!state"
        @change="onCityChange"
        autocomplete="off"
        outlined)

      label.request-test-form Test Category
        ui-debio-button.request-test-form__label-desc(
          disabled
          style="font-size: 8px;"
          width="40"
          height="20"
          ) Optional
      v-select.request-test-form(
        dense
        :items="categories"
        item-text="service_categories"
        item-value="service_categories"
        menu-props="auto"
        placeholder="Any"
        :disabled="!city"
        @change="onCategoryChange"
        autocomplete="off"
        outlined)

      ui-debio-button.request-test-button(
        :disabled="disable"
        color="secondary" 
        width="100%"
        height="38"
        @click= "onSubmit"
        ) Continue
</template>

<script>
import { mapState, mapMutations } from "vuex"
import { getLocations, getStates, getCities, getCategories } from "@/common/lib/api"
import errorMessage from "@/common/constants/error-messages"


export default {
  name: "RequestTestForm",

  data: () => ({
    errorMessage,
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
    countryName: ""
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet
    }),

    disable() {
      const { country } = this
      return !country
    }
  },

  async mounted() {
    await this.getCountries()
    await this.getServiceCategory()
  },

  methods: {
    ...mapMutations({
      setCategory: "lab/SET_CATEGORY"
    }),

    async getServiceCategory() {
      const data = await getCategories()
      this.categories = data
    },

    async getCountries() {

      this.noState = false
      this.noCity = false

      const { data: { data } } = await getLocations()
      this.countries = data
    },

    async onCountryChange(selectedCountry) {

      this.states = []
      this.cities = []

      this.countryName = this.countries.filter((c) => c.iso2 === selectedCountry)[0].name
      const { data: { data } } = await getStates(selectedCountry)

      if (data.length < 1) {
        this.states.push(this.countryName)
        this.noState = true
        this.country = selectedCountry
        return
      }

      this.states = data
      this.country = selectedCountry
      this.noState = false

    },

    async onStateChange(selectedState) {

      this.noCity = false

      if (this.noState) {
        this.state = this.country
        this.cities.push(this.countryName)
        return
      }

      const { data: { data } } = await getCities(this.country, selectedState)

      if (data.length < 1) {
        this.noCity = true
        this.stateName = this.states.filter((s) => s.state_code === selectedState)[0].name
        this.cities.push(this.stateName)
      } else {
        this.cities = data
      }

      this.state = selectedState

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

    async onSubmit() {
      const country = this.country
      const region = this.state
      const city = this.city
      const category = this.category
      const status = "All"
      this.setCategory(category)
      await this.$store.dispatch("lab/setCountryRegionCity", { country, region, city })
      await this.$store.dispatch("lab/getServicesByCategory", { category, status })

      this.$emit("click")
    }
  }
}


</script>


<style lang="sass">
  @import "@/common/styles/mixins.sass"

  .request-test-form
    margin-bottom: 6px
    @include body-text-3-opensans

    &__label-desc
      margin-left: 8px
      margin-bottom: 6px
  
  .request-test-button
    @include button-2

</style>
