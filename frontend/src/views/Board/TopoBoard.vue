<template>
  <div class="rca-topo-board">
    <div class="topo-board-item" v-if="isNoneData">
      <i class="el-icon-warning"></i>
      无数据
    </div>
    <div class="topo-board-left" v-else>
      <div class="topo-board-item" v-show="groupId">
        <span class="tag-square tag-orange"></span>
        <span class="tag-label">Group ID: {{groupId}}</span>
        <i class="el-icon-arrow-right" v-show="regValue"></i>
      </div>
      <div class="topo-board-item" v-show="regValue">
        <span class="tag-square tag-red"></span>
        <span class="tag-label">{{conditionLabel}}: {{regValue}}</span>
      </div>
    </div>
    <div class="topo-board-right">
      <el-switch v-model="status" active-color="#FFE10B" inactive-color="#B4B4B4"></el-switch>
      <span class="timer-hint" :class="{active: status}">当前状态下{{status ? '已' : '未'}}显示P告警前后5min告警数据</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from 'vuex-class';
import { Rules } from '@/types/type';
@Component
export default class StaticsBoard extends Vue {
  @State((state) => state.app.groupId) private groupId: any;
  @State((state) => state.app.regValue) private regValue: any;
  @State((state) => state.app.regType) private regType: any;
  @State((state) => state.app.isNoneData) private isNoneData: any;
  @Provide() private status: boolean = false;
  @Provide() private conditionLabel: string = '';
  @Watch('regType')
  public watchRegType(val: string) {
    if (val) {
      const temp: {[k: string]: string} = {
        company: '厂商',
        rcaReg: 'RCA规则'
      };
      this.conditionLabel = temp[val] || '告警名称';
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.rca-topo-board {
  height: 50px;
  border-bottom: 1px solid #DFDFDF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  .topo-board-left {
    display: flex;
    color: #55657E;
    .topo-board-item {
      padding-left: 5px;
    }
  }
  .tag-square {
    display: inline-block;
    width: 10px;
    height: 10px;
  }
  .tag-blue {
    background: #0276F7;
  }
  .tag-orange {
    background-image: linear-gradient(133deg, #ffc77f, #fea954);
  }
  .tag-red {
    background-image: linear-gradient(133deg, #ec7d85, #f54d4d);
  }
  .tag-green {
    background: #32CD98;
  }
  .tag-label {
    padding-left: 10px;
  }
  .timer-hint {
    width: 150px;
    display: inline-block;
    padding-left: 10px;
    vertical-align: middle;
    text-align: left;
    font-size: 12px;
    color: #778296;
    &:active {
      color: #55657e;
    }
  }
}
</style>
