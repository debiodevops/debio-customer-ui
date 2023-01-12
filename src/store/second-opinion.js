const defaultState = {
  category: null,
  symptoms: null
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
    }
  }
}
