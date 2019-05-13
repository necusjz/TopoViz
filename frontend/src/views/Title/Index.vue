<template>
  <div class="app-title-wrap">
    <div class="app-back-wrap" v-if="isCheckStatics" @click="goBack">
      <i class="el-icon-back"></i>
      <span class="app-back">返回</span>
    </div>
    <div class="app-top-right">
      <div @click="switchLang" class="lang-type">
        <span class="bg-text">{{lang === 'cn' ? '中/' : 'EN/'}}</span>
        {{lang === 'cn' ? 'EN' : '中'}}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide } from 'vue-property-decorator';
import { State } from 'vuex-class';

@Component
export default class Title extends Vue {
  @Provide() private lang: string = 'cn';
  @State((state) => state.user.userName) private userName!: string;
  @State((state) => state.app.isCheckStatics) private isCheckStatics!: boolean;
  public switchLang() {
    this.lang = this.lang === 'en' ? 'cn' : 'en';
    this.$i18n.locale = this.lang;
  }
  public goBack() {
    this.$store.commit('SET_ISCHECKSTATICS', false);
  }
}
</script>
<style lang="scss" scoped>
.app-title-wrap {
  position: relative;
  width: 100%;
  height: 50px;
  text-align: left;
  background-image: linear-gradient(-180deg, #2FA3FA 0%, #437AF9 100%);
  .app-back-wrap {
    line-height: 50px;
    padding-left: 20px;
    color: #ffffff;
    cursor: pointer;
    &:hover {
      color: #DFDFDF;
    }
    .app-back {
      padding-left: 10px;
    }
  }
  .app-top-right {
    position: absolute;
    height: 50px;
    top: 0;
    right: 10px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    cursor: pointer;
    .lang-type {
      margin-right: 40px;
      font-size: 12px;
      color: #FFFFFF;
      font-weight: 500;
      .bg-text {
        font-size: 18px;
      }
    }
    .app-icon {
      width: 20px;
      height: 20px;
      background-size: contain;
      margin-right: 10px;
    }
    .app-help {
      background-image: url('../../assets/help-icon.png');
    }
    .app-account {
      background-image: url('../../assets/account.png');
    }
    .app-user-dropdown {
      .app-user {
        display: inline-block;
        max-width: 60px;
        vertical-align: middle;
        color: #FFFFFF;
        overflow: hidden;
        text-overflow:ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>

