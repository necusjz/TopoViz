
import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import VueI18n from 'vue-i18n';
import messages from './langs';
Vue.use(VueI18n)
const i18n = new VueI18n({
    locale: 'cn', //初始未选择默认中文cn
    messages,
})
locale.i18n((key: string, value: any) => i18n.t(key, value)) //兼容element

export default i18n;
