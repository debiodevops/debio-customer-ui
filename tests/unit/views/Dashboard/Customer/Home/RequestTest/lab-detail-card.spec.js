import { createLocalVue, shallowMount, config } from "@vue/test-utils"
import Vue from "vue"
import Vuetify from "vuetify"
import VueRouter from "vue-router"
import LabDetailCard from "@/views/Dashboard/Customer/Home/RequestTest/LabDetailCard"

config.stubs["ui-debio-avatar"] = { template: "<div></div>" }
config.stubs["ui-debio-rating"] = { template: "<div></div>" }

Vue.use(Vuetify)

const localVue = createLocalVue()
localVue.use(VueRouter)

describe("Lab Detail Card", () => {
  let container
  let vuetify
  let router

  beforeEach(() => {
    vuetify = new Vuetify()
    router = new VueRouter()

  })

  it("should render", () => {
    LabDetailCard.computed = {
      computeAvatar: jest.fn()
    }

    LabDetailCard.methods = {
      getCountries: jest.fn(),
      computeCountry: jest.fn()
    }
    container = shallowMount(LabDetailCard, {
      localVue,
      vuetify,
      router,
      propsData: {
        serviceDetail: {
          serviceName: "",
          serviceRate: "",
          countServiceRate: "",
          totalPrice: 10,
          currency: "",
          duration: 1,
          durationType: "",
          labImage: "",
          labName: "",
          labRate: "",
          labAddress: "",
          city: "",
          country: "",
          labWebsite: ""
        }
      },
      data: () => ({
        countries: []
      })
    })

    expect(container.exists()).toBe(true)
  })
})

