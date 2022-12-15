<template lang="pug">
  v-card.grant-access-card
    .grant-access-card__title Granted Access Personal Health Record

    v-divider.my-5

    label.text-label  Checklist to granted access
    v-checkbox(
      v-for="(phr, key) in phrList"
      v-model="grantedAccess"
      :label="phr"
      :key="key"
      :value="phr"
      color="primary"
      hide-details
    )

    .grant-access-card__nav
      a + Add New Personal Health Record

    .grant-access-card__button
      ui-debio-button(
        width="100px"
        :disabled="disable"
        block
        color="secondary"
        outlined
        @click="getBack"
      ) Back

      ui-debio-button.ml-5(
        width="100px"
        :disabled="disable"
        block
        color="secondary"
        @click="onSubmit"
      ) Next


  
</template>



<script>
export default {
  name: "GrantAccessPHR",

  data: () => ({
    phrList: ["Malaria Disease", "Covid-19", "Hypertension", "Diabetes", "TBC", "Lung Cancer", "Laryngitis"],
    grantedAccess: []
  }),

  methods: {
    getBack() {
      this.$emit("back")
    }
  }
}

</script>



<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .grant-access-card
    height: 540px

    &__title
      @include button-1

    &__nav      
      margin-top: 10px
    
    &__button
      max-width: 100px
      float: right
      display: flex
      justify-content: space-between
      margin: 20px 120px 0 0

</style>
