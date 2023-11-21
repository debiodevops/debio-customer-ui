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
  myriadPostCreate,
  getMyriadListByRole } from "@/common/lib/api"
import { generateUsername } from "@/common/lib/username-generator.js"
import { postRequestOpinion } from "@/common/lib/polkadot-provider/command/second-opinion"
import { u8aToHex } from "@polkadot/util"
import {
  queryElectronicMedicalRecordById,
  queryElectronicMedicalRecordFileById
} from "@debionetwork/polkadot-provider"
import getEnv from "@/common/lib/utils/env"
import { downloadFile, decryptFile, uploadFile, getFileUrl } from "@/common/lib/pinata-proxy"
import { findMyriadExperience } from "../../../../../../common/lib/api/customer/myriad"


export default {
  name: "ConnectingPage",

  data: () => ({
    isConnected: false,
    addressHex: "",
    publicKey: null,
    secretKey: null
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
      if (cred) {
        this.publicKey = u8aToHex(cred.boxKeyPair.publicKey)
        this.secretKey = u8aToHex(cred.boxKeyPair.secretKey)

        this.addressHex =  cred.signPublicKeyAsHex
        await this.checkMyriadUser(this.addressHex)
      }

    },

    async checkMyriadUser(address) {
      try {
        const timelineId = await findMyriadExperience(address)
        const data = await myriadCheckUser(address)
        const userIds = await getMyriadListByRole(this.category)
        const userIdList = userIds.data.map((user) => user.user_id)
        
        await this.createMyriadPost(data.jwt, data.user_id, userIdList, timelineId)

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
      const hexNonce = nonce.toString(16)
      const formatedNonce =  hexNonce.length > 7 ? "0x" + nonce.toString(16) : "0x0" + nonce.toString(16)
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

    async createMyriadPost(userJwt, userId, phIds, timelineId) {
      const links = await this.prepareData()
      const text = [{
        "type": "p",
        "children": [{
          "text": this.text.replace(/\n/g, "")
        }]
      }]
      text.push(links)

      const info = {
        createdBy: userId,
        isNSFW: false,
        mentions: [],
        rawText: this.text.replace(/\n/g, ""),
        text: JSON.stringify(text),
        status: "published",
        tag: [this.category],
        selectedUserIds: phIds,
        visibility: "selected_user",
        postType:this.category.toUpperCase().split(" ").join("_"),
        selectedTimelineIds: [],
        timelineId: timelineId
      }

      const res = await myriadPostCreate(userJwt, info)      
      await this.postToSubstrate(res.data, this.text)
      return res
    },

    async postToSubstrate(data, description) {
      const info = {
        category: this.category,
        description,
        electronicMedicalRecordIds: this.phrIds,
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
    },

    async prepareData() {
      const ids = this.phrIds
      const text = { type: "ol", children: [] }

      for (const id of ids) {
        const data = await queryElectronicMedicalRecordById(this.api, id)
        data.fileDetails = []
        data.newLinks = []
        text.children.push({
          type: "li",
          children: [{
            type: "lic",
            children: [{
              bold: true,
              text: data.title
            },
            {
              type: "ul",
              children: []              
            }]
          }]
        })

        for (const file of data.files) {
          const detailFile = await queryElectronicMedicalRecordFileById(this.api, file)
          data.fileDetails.push(detailFile)

          const innerText = {
            type: "li",
            children: [{
              type: "lic",
              children: [
                { text: detailFile.title + " - "}
              ]
            }]
          }

          try {    
            const pair = { publicKey: this.publicKey, secretKey: this.secretKey }
            const dataFile = await downloadFile(detailFile.recordLink, true)
            const decryptedFile = decryptFile(dataFile.data, pair, dataFile.type)
            const blob = new Blob([decryptedFile], { type: dataFile.type })
            const fileBlob = new File([blob], dataFile.name)

            const result = await uploadFile({
              title: dataFile.name,
              type: dataFile.type,
              size: blob.size,
              file: fileBlob
            })
            const newLink = await getFileUrl(result.IpfsHash)
            innerText.children[0].children.push({
              "type": "a",
              "url": newLink,
              "children": [{
                "text": newLink
              }]
            })
            data.newLinks.push(newLink)
          } catch (error) {
            console.error(error)
          }
          const _text = text.children[text.children.length-1]
          const __text = _text.children[_text.children.length-1]
          __text.children[__text.children.length-1].children.push(innerText)
        }
      }
      return text
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
