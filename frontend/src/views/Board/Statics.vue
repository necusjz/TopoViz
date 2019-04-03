<template>
  <div class="rca-statics-board">
    <div class="rca-dec blue-text" v-if="isCheckStatics">
      <i class="el-icon-warning"></i>
      <span class="rca-waring-dec">提示：只有当前数据的所有Group ID都确认过时才可得出RCA精准率哦</span>
    </div>
    <div class="rca-dec" v-else>
      <span>RCA结果汇总: </span>
      <div class="rca-statics" v-if="isImported">
        <span>共{{total_count}}个警告; 其中包含{{p_count}}个P警告, {{c_count}}个C警告;</span>
        <span class="dec-group" @click="checkStatics">共{{group_count}}个组，其中{{confirmed_count}}组已确认，{{unconfirmed_count}}组未确认</span>
      </div>
      <span v-else>无</span>
    </div>
    <span class="statics-precision" v-show="!isCheckStatics">RCA精准率: --</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { State } from 'vuex-class';
@Component
export default class StaticsBoard extends Vue {
  @State((state) => state.app.isImported) private isImported: any;
  @State((state) => state.app.isCheckStatics) private isCheckStatics: any;
  @State((state) => state.project.total_count) private total_count!: number;
  @State((state) => state.project.p_count) private p_count!: number;
  @State((state) => state.project.c_count) private c_count!: number;
  @State((state) => state.project.group_count) private group_count!: number;
  @State((state) => state.project.confirmed_count) private confirmed_count!: number;
  @State((state) => state.project.unconfirmed_count) private unconfirmed_count!: number;
  public checkStatics() {
    this.$store.commit('SET_ISCHECKSTATICS', true);
  }
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
.rca-waring-dec {
  padding-left: 15px;
}
.rca-statics {
  display: inline-block;
  transition: opacity 0.3;
}
.dec-group {
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: #338AFF;
  }
}
.statics-precision {
  padding-right: 5px;
  color: #282828;
}
</style>
