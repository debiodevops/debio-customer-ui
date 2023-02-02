<style scoped lang="scss">
.pop-up-main{
    justify-content: space-between;
    height: 100%;

    p {
        height: 27px;
    }
    .v-btn {
        margin-bottom: 58px;
    }
}
</style>

<template lang="pug">
     LandingPagePopUp(:previous="previous")
        template(v-slot:header) Input Mnemonic Phrase
        template(v-slot:main): div.pop-up-main
            div
                p Please type in your Mnemonic Phrase
                v-textarea(
                    v-model="mnemonic"
                    :rules="[mnemonicRule]"
                    no-resize
                    outlined
                )
            div: v-btn.white--text(
                :disabled="!checkIfValid"
                elevation="0" 
                color="primary" 
                @click="changePassword"
            ) Continue
</template>

<script>
import { mnemonicValidate } from "@polkadot/util-crypto"
import LandingPagePopUp from "@/views/LandingPage/LandingPagePopUp.vue"
import errorMessage from "@/common/constants/error-messages"
import localStorage from "@/common/lib/local-storage"

export default {
  name: "InputMnemonic",

  components: {
    LandingPagePopUp
  },

  data: () => ({
    errorMessage,
    mnemonic: ""
  }),
    
  computed: {
    mnemonicRule() {
      if(!this.mnemonic) {
        return this.errorMessage.REQUIRED
      }
      if(!mnemonicValidate(this.mnemonic)) {
        return this.errorMessage.INCORRECT("Mnemonic")
      }
      return true
    },

    checkIfValid(){
      return this.mnemonicRule === true
    }
  },

  methods: {
    previous() {
      this.$router.push({name: "sign-in"})
    },

    changePassword() {
      const dataAccountExist = localStorage.getKeystore() !== null
      this.$router.push({
        name: "change-password",
        params: { 
          mnemonic: this.mnemonic,
          openInfo: dataAccountExist ? "close" : "open"
        }
      })
    }
  }
}
</script>
