import axios from "axios"

const baseUrl = process.env.VUE_APP_DEV_DEBIO_BACKEND_URL

const defaultState = {
  labRate: null,
  serviceRate: null
}

export default {
  namespaced: true,

  state: {
    ...defaultState
  },

  mutations: {
    SET_LAB_RATE(state, rate) {
      state.labRate = rate
    },

    SET_SERVICE_RATE(state, rate) {
      state.serviceRate = rate
    }
  },
  actions: {

    async getLabRate({ commit }, address ) {
      const rate = await axios.get(`${baseUrl}/rating/lab/${address}`)
      console.log("rate ==>", rate)
      commit("SET_LAB_RATE", rate.data)
      return rate.data
    },

    async getServiceRate({ commit }, address) {
      const rate = await axios.get(`${baseUrl}/rating/service/${address}`)
      console.log("service rate", rate)
      commit("SET_SERVICE_RATE", rate.data.data)
      return rate.data.data
    }
  },

  getters: {
    getLabRate(state) {
      return state.labRate
    },

    getServiceRate(state) {
      return state.serviceRate
    }
  }
}