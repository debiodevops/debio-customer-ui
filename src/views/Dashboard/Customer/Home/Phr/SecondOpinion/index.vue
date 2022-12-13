.<template lang="pug">
  .second-opinion
    .second-opinion__wrapper
      SecondOpinionBanner

      ui-debio-button.second-opinion__button(
        color="#FF8EF4"
        dark
      ) + Request Second Opinion

      ui-debio-data-table.second-opinion__table(
        :headers="headers"
        :loading="isLoading"
        :items="secondOpinionData"
      )

        
</template>

<script>
import SecondOpinionBanner from "./Banner"

export default {
  name: "SecondOpinion",

  components: { SecondOpinionBanner },

  data: () => ({
    headers: [
      {
        text: "Category",
        value: "category",
        sortable: true
      },
      {
        text: "Granted PHR",
        value: "grantedPHR",
        sortable: true
      },
      {
        text: "Description",
        value: "description",
        sortable: true
      },
      {
        text: "Opinion Available",
        value: "opinionAvailable",
        sortable: true
      },
      {
        text: "Action",
        value: "action",
        sortable: true
      }
    ],
    secondOpinionData: []
  })
}

</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"
 
  .second-opinion
    &__wrapper
      height: 100%

    &__button
      margin: 30px 0
      font-size: 12px

</style>



