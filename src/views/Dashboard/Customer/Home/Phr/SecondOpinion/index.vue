.<template lang="pug">
  .second-opinion
    .second-opinion__wrapper
      SecondOpinionBanner

      ui-debio-button.second-opinion__button(
        color="#FF8EF4"
        dark
        @click="toRequest"
      ) + Request Second Opinion

      ui-debio-data-table.second-opinion__table(
        :headers="headers"
        :loading="isLoading"
        :items="secondOpinionData"
      )

      ui-debio-modal(
        :show="isNotInstalled"
        :show-title="false"
        :show-cta="false"
        @onClose="isNotInstalled = false"
      )
        h2.mt-5 Install Polkadot Extension
        ui-debio-icon.mb-8(:icon="alertTriangleIcon" stroke size="80")
        p.second-opinion__subtitle This action requires you to install Polkadot Extension and redirect to myriad.social platform. Press Install to read the instruction and install the extension

        ui-debio-button(
          block
          color="secondary"
          @click="toInstall"
        ) Install

        
</template>

<script>
import SecondOpinionBanner from "./Banner"
import { alertTriangleIcon } from "@debionetwork/ui-icons"
import { isWeb3Injected } from "@polkadot/extension-dapp"

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
    secondOpinionData: [],
    isNotInstalled: false,
    alertTriangleIcon,
    isLoading: false
  }),

  methods: {
    async toRequest() {
      this.isNotInstalled = !isWeb3Injected

      if (!this.isNotInstalled) {
        this.$router.push({name: "second-opinion-request"})
      }
    },

    async toInstall() {
      window.open("https://polkadot.js.org/extension/", "_blank")
    }
  }
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

    &__subtitle
      max-width: 280px
      @include body-text-2-opensans

</style>



