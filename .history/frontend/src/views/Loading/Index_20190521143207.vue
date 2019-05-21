<template>
  <div class="loading-wrap">
    <div class="loading-content">
      <el-progress :text-inside="true" :stroke-width="18" :percentage="percent"></el-progress>
      <p class="loading-text">正在导入数据，请稍等</p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
@Component
export default class Loading extends Vue{
  @Provide() private percent: number = 0;
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

