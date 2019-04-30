<template>
  <div class="rca-topo-board">
    <div class="topo-board-item" v-if="isNoneTopoData">
      <i class="el-icon-warning"></i>
      无数据
    </div>
    <div class="topo-board-left" v-else>
      <div class="topo-board-item" v-show="groupId">
        <span class="tag-square tag-orange"></span>
        <span class="tag-label">Group ID: {{groupId}}</span>
        <i class="el-icon-arrow-right" v-show="regType"></i>
      </div>
      <div class="topo-board-item" v-show="regType">
        <span class="tag-square tag-red"></span>
        <span class="tag-label">{{conditionLabel}}: {{regValue}}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch, Mixins } from "vue-property-decorator";
import { State } from 'vuex-class';
import { Rules, AlarmData, Node, Edge, EventType } from '@/types/type';
import CommonMixin from '@/components/mixins/commonMixin.vue';
import bus from '@/util/bus';

@Component
export default class StaticsBoard extends Mixins(CommonMixin) {
  @State((state) => state.app.groupId) private groupId: any;
  @State((state) => state.app.regValue) private regValue: any;
  @State((state) => state.app.regType) private regType: any;
  @State((state) => state.app.isNoneTopoData) private isNoneTopoData!: boolean;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.topoDatas) private topoDatas!: {elements: Node[], edges: Edge[]};
  @Provide() private conditionLabel: string = '';

  @Watch('regType')
  public watchRegType(val: string) {
    if (val) {
      const temp: {[k: string]: string} = {
        company: '厂商',
        rcaReg: 'RCA 规则'
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
      display: flex;
      align-items: center;
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
