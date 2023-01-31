<template lang="pug">
  .connecting-page
    p.connecting-page__subtitle Connecting your request into Myriad
    .connecting-page__loading
      .connecting-page__logo-debio(v-if="!isConnected")
        v-img(
          alt="dbio-logo"
          src="@/assets/debio-logo.png"
          width="56px"
          height="56px"
        )

      .connecting-page__logo-myriad(v-if="isConnected")
        v-img(
          alt="myriad-logo"
          src="@/assets/myriad-logo.png"
          width="56px"
          height="56px"
        )
 
</template>

<script>
import { mapState } from "vuex"
import Kilt from "@kiltprotocol/sdk-js"
import CryptoJS from "crypto-js"
import { 
  myriadCheckUser, 
  checkMyriadUsername, 
  myriadRegistration, 
  getNonce, 
  myriadAuth,
  registerVisibilityTimeline,
  myriadPostCreate,
  getMyriadListByRole } from "@/common/lib/api"
import { generateUsername } from "@/common/lib/username-generator.js"
import { postRequestOpinion } from "@/common/lib/polkadot-provider/command/second-opinion"
import { u8aToHex } from "@polkadot/util"
import getEnv from "@/common/lib/utils/env"

export default {
  name: "ConnectingPage",

  data: () => ({
    isConnected: false,
    addressHex: ""
  }),

  computed: {
    ...mapState({
      api: (state) => state.substrate.api,
      wallet: (state) => state.substrate.wallet,
      mnemonicData: (state) => state.substrate.mnemonicData,
      category: (state) => state.secondOpinion.category,
      text: (state) => state.secondOpinion.symptoms,
      phrIds: (state) => state.secondOpinion.phrIds,
      lastEventData: (state) => state.substrate.lastEventData
    })
  },

  watch: {
    mnemonicData(val) {
      if(val) this.getInitialData()
    }
  },

  async created() {
    if(this.mnemonicData) {
      await this.getInitialData()
    } 
    
    if (!this.category || !this.mnemonicData) {
      this.$router.push({ name: "customer-dashboard"})
    }
  },

  mounted() {
    setTimeout(() => {
      this.isConnected = true
    }, 2000)
  },

  methods: {
    async getInitialData() {
      const cred = Kilt.Identity.buildFromMnemonic(this.mnemonicData.toString(CryptoJS.enc.Utf8))
      this.addressHex =  cred.signPublicKeyAsHex
      await this.checkMyriadUser(this.addressHex)
    },

    async checkMyriadUser(address) {
      try {
        const data = await myriadCheckUser(address)
        const timelineId = this.category === "Physical Health" ? getEnv("VUE_APP_PHYSICAL_HEALTH_TIMELINE_ID") : getEnv("VUE_APP_MENTAL_HEALTH_TIMELINE_ID")
        await registerVisibilityTimeline(timelineId, data.user_id)
        const userIds = await getMyriadListByRole(this.category)
        const userIdList = userIds.data.map((user) => user.user_id)
        
        await this.createMyriadPost(data.jwt, data.user_id, userIdList)

        return data
      } catch (err) {
        if(err.response.status === 404) await this.generateUsername()
        if(err.response.status === 401) await this.myriadAuthentication()
      }
    },

    async generateUsername() {
      let name = ""
      do {
        name = await generateUsername()
      } while (name.length > 16)
      

      const username = name.split(" ").join("").toLowerCase()
      const isUsernameExisted = (await checkMyriadUsername(username)).status
      if (!isUsernameExisted) {
        try {
          await myriadRegistration({
            username,
            name,
            address: this.addressHex,
            role: "customer"
          })
        } catch (err) {
          console.error(err)
        }
        await this.myriadAuthentication() 
      }
    },

    async myriadAuthentication() {
      const nonce = await getNonce(this.addressHex)
      if(!nonce) return
      const formatedNonce = "0x" + nonce.toString(16)
      const signature = this.wallet.sign(formatedNonce)
      const jwt = await myriadAuth({
        nonce,
        publicAddress: this.addressHex,
        signature: u8aToHex(signature),
        walletType: "polkadot{.js}",
        networkType: "debio",
        role: "customer"
      })

      await this.checkMyriadUser(this.addressHex)
      return jwt
    },

    async createMyriadPost(userJwt, userId, phIds) {
      const info = {
        createdBy: userId,
        isNSFW: false,
        mentions: [],
        rawText: this.text,
        text: this.text,
        status: "published",
        tag: [this.category],
        selectedUserIds: phIds,
        visibility: "selected_user",
        postType:this.category.toUpperCase().split(" ").join("_")
      }

      const res = await myriadPostCreate(userJwt, info)      
      await this.postToSubstrate(res.data)
      return res
    },

    async postToSubstrate(data) {
      const info = {
        category: this.category,
        description: this.text,
        geneticDataIds: this.phrIds,
        opinionIds: [],
        myriadPostId: data.id
      }

      await postRequestOpinion(
        this.api, 
        this.wallet, 
        info,
        window.open(`${getEnv("VUE_APP_MYRIAD_URL")}/login?redirect=${getEnv("VUE_APP_MYRIAD_URL")}%2Fpost%2F${data.id}`)
      )
      this.$router.push({ name: "customer-dashboard" })
    }
  }
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .connecting-page
    height: 100vh
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center

    &__subtitle
      color: #8B93A7
      margin-bottom: 64px
      @include h5-opensans

    &__loading
      position: absolute
      width: 360px
      height: 72px
      top: 50%
      background: linear-gradient(90deg, #FFC6F4 0.79%, #C4DBFF 100%)
      border-radius: 50px

    &__logo-debio
      position: absolute
      top: 8px
      left: 8px
      animation-name: logo
      animation-duration: 3s

      @keyframes logo
        0%   
          left: 8px
        100%  
          left: 300px

    &__logo-myriad
      position: absolute
      top: 8px
      left: 300px
      animation-name: logo

  </style>
