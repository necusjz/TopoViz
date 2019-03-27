import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import vuescroll from 'vuescroll';
import 'element-ui/lib/theme-chalk/index.css';
import './styles/global.scss';

Vue.use(ElementUI);
Vue.use(vuescroll, {
  ops: {
    vuescroll: {
      detectResize: false
    },
    bar: {
        background: '#b4b4b4'
    }
  },
  name: 'vuescroll'
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
