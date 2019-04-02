import Vue from 'vue';
import Vuex from 'vuex';
import app from './store/app';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    author: 'alan',
  },
  mutations: {
    SET_AUTHOR: (state, name) => {
      state.author = name;
    }
  },
  actions: {

  },
  modules: {
    app,
  }
});
