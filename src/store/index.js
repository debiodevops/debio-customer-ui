import Vue from "vue"
import Vuex from "vuex"
import auth from "./auth"
import metamask from "./metamask"
import testRequest from "./test-request"
import substrate from "./substrate"
import lab from "./lab"
import rating from "./rating"
import geneticData from "./genetic-data"
import menstrualCalendar from "./menstrual-calendar"
import secondOpinion from "./second-opinion"



Vue.use(Vuex)
Vue.config.devtools = true

export default new Vuex.Store({
  modules: {
    auth,
    metamask,
    testRequest,
    substrate,
    lab,
    rating,
    geneticData,
    menstrualCalendar,
    secondOpinion
  },
  state: {
  },
  mutations: {
  },
  actions: {
  },
  getters: {}
})

