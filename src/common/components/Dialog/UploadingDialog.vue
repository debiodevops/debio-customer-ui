<template lang="pug">
  .dialog-uploading
    v-dialog(:value="show" height="500" width="400" persistent )
      v-card 
        v-app-bar( flat dense color="white" ) 

        v-card-text
          .dialog-uploading__title {{ type }} in Progress {{ progress }}

          .dialog-uploading__card-loading
            SpinnerLoader(
              :color="'#C400A5'"
              :size="140"
            )

          template(v-if="type !== 'Processing'" )
            .dialog-uploading__message
              b Your file is still {{ type }}. 
              b Please wait, do not close this tab.
            .dialog-uploading__border
              .dialog-uploading__border-text We support file sizes up to 200 MB, there may be longer upload/download time associated with larger files on slower Internet connections.
              .dialog-uploading__border-text The larger the file size, the longer it will take to upload/download 
                a.link(
                  target="_blank"
                  :href="renderUrlDownload"
                  @click.stop
                ) here’s why

          template(v-if="type === 'Processing'" )
            .dialog-uploading__message
              b We are processing your order.
              b Please wait, do not close this tab. 
            
            .dialog-uploading__border
              .dialog-uploading__border-text The process may take a while. Larger data sets and/or slower Internet connections may result in longer wait times.
              .dialog-uploading__border-text Larger data sets will take longer to process. 
                a.link(
                  target="_blank"
                  :href="renderUrlDownload"
                  @click.stop
                ) here’s why          

</template>

<script>
import checkCircle from "@/assets/check-circle-primary.png"
import SpinnerLoader from "@bit/joshk.vue-spinners-css.spinner-loader"
import { mapState } from "vuex"



export default {
  name: "UploadingDialog",

  data: () => ({
    progress: "0%",
    checkCircle,
    urlUpload: "https://docs.debio.network/complete-guidelines/user-guideline/upload-and-encrypt-data",
    urlDownload: "https://docs.debio.network/complete-guidelines/genetic-analyst-guideline/download-and-decrypt-data"
  }),

  components: {
    SpinnerLoader
  },

  props: {
    show: Boolean,
    type: String,
    url: String
  },

  watch: {
    loadingProgress() {
      this.progress = `${this.loadingProgress || 0}%`
    }
  },


  computed: {
    ...mapState({
      loadingProgress: (state) => state.geneticData.loadingProgress
    }),

    renderUrlDownload() {
      return this.type === "download" ? this.urlDownload : this.urlUpload
    }
  }
}
</script>


<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .dialog-uploading
    &__title
      display: flex
      justify-content: center
      align-items: center
      letter-spacing: 0.0044em
      margin-top: 12px
      @include h6-opensans

    &__image
      display: flex
      justify-content: center
      align-items: center
      margin: 30px 0px

    &__message
      display: flex
      flex-direction: column
      justify-content: center
      align-items: center
      text-align: center
      letter-spacing: -0.0075em
      text-transform: initial
      margin-bottom: 5px
      @include button-2

    &__border
      border: 1px solid #E9E9E9
      border-radius: 4px
      margin: 20px 27px

    &__border-text
      padding: 12px 16px
      align-items: center
      text-align: justify
      letter-spacing: -0.004em
      @include body-text-3-opensans

    &__card-loading
      padding: 50px 0 50px 105px

</style>
