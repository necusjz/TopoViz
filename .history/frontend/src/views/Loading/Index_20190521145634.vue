<template>
  <div class="loading-wrap" v-show="visible">
    <div class="loading-content">
      <el-progress :stroke-width="12" :percentage="percent" :show-text="false"></el-progress>
      <p class="loading-text">正在导入数据，请稍等</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import bus from '@/util/bus';
import { EventType } from '@/types/type';

@Component
export default class Loading extends Vue{
  @Provide() private percent: number = 0;
  @Provide() private visible: boolean = false;
  mounted() {
    bus.$on(EventType.LOADINGVISIBLE, (visible: boolean) => {
      this.percent = 0;
      if (visible) {
        this.visible = visible;
        this.autoRun();
      } else {
        this.percent = 100;
        this.hiddenLoading();
      }
    });
  }
  private autoRun() {
    setTimeout(() => {
      this.percent += Math.floor(Math.random() * 10);
      this.percent = Math.min(this.percent, 100);
      if (this.percent < 100) {
        this.autoRun();
      } else {
        this.hiddenLoading();
      }
    }, 300);
  }
  public hiddenLoading() {
    setTimeout(() => {
      this.visible = false;
    }, 500);
  }
}
</script>
<style lang="scss" scoped>
.loading-wrap {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  text-align: center;
  z-index: 2000;
  .loading-content {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    transform: translate(-50%);
    .loading-text {
      color: #fff;
      font-size: 14px;
      line-height: 50px;
    }
  }
}
</style>

