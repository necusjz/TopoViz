import Vue from 'vue';
import Router from 'vue-router';
import AppMain from './views/AppMain.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'AppMain',
      component: AppMain,
    },
  ],
});
