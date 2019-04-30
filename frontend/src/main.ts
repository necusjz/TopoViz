import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './styles/global.scss';
import 'nprogress/nprogress.css';
import '@/util/brower';
import i18n from '@/i18n/i18n';

Vue.use(ElementUI);

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
