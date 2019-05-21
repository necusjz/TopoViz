<template>
  <div class="loading-wrap" v-show="visible">
    <div class="loading-content">
      <el-progress :text-inside="true" :stroke-width="18" :percentage="percent"></el-progress>
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
      this.visible = visible;
      this.percent = 0;
      if (this.visible) {
        this.autoRun();
      }
    });
  }
  private autoRun() {
    setTimeout(() => {
      this.percent += Math.floor(Math.random() * 5);
      this.percent = Math.min(this.percent, 100);
      if (this.percent < 100) {
        this.autoRun();
      }
    }, 300);
  }
}
</script>
<style lang="scss" scoped>
.loading-wrap {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  text-align: center;
  .loading-content {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    .loading-text {
      color: #fff;
    }
  }
}
</style>

