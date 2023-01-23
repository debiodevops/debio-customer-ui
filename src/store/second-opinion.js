const defaultState = {
  category: null,
  symptoms: null,
  phrIds: null
}

export default {
  namespaced: true,
  state: { ...defaultState },
  mutations: {
    SET_SECOND_OPINION_CATEGORY(state, category) {
      state.category = category
    },
    SET_SECOND_OPINION_SYMPTOMS(state, symptoms) {
      state.symptoms = symptoms
    },
    SET_PHR_IDS(state, ids) {
      state.phrIds = ids
    }
  }
}
