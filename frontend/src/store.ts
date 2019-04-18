import Vue from 'vue';
import Vuex from 'vuex';
import app from './store/app';
import project from './store/project';
import user from './store/user';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    
  },
  mutations: {
  },
  actions: {

  },
  modules: {
    app,
    project,
    user,
  }
});
