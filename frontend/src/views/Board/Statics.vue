<template>
  <div class="rca-statics-board">
    <div class="rca-dec">
      <span>RCA结果汇总: </span>
      <span v-if="isNoneData">无数据</span>
      <div class="rca-statics" v-else>
        <span>共38个警告; 其中包含24个P警告, 14个C警告;</span>
        <span class="dec-group">共12个组，其中5组已确认，7组未确认</span>
      </div>
    </div>
    <span class="statics-precision">RCA精准率: --</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { State } from 'vuex-class';
@Component
export default class StaticsBoard extends Vue {
  @State((state) => state.app.isNoneData) private isNoneData: any;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.rca-statics-board {
  font-size: 16px;
  color: #55657e;
  line-height: 20px;
  padding: 20px 0;
  text-align: left;
  display: flex;
  justify-content: space-between;
}
.rca-statics {
  display: inline-block;
}
.dec-group {
  text-decoration: underline;
  cursor: pointer;
}
.statics-precision {
  padding-right: 5px;
  color: #282828;
}
</style>
