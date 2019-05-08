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
    <div class="topo-board-right">
      <el-switch v-model="checkNone" active-color="#FFE10B" inactive-color="#B4B4B4" @change="switchStatus"></el-switch>
      <span class="timer-hint" :class="{active: checkNone}">查看{{checkNone ? '未' : '已'}}知告警</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch, Mixins } from "vue-property-decorator";
import { State } from 'vuex-class';
import { Rules, AlarmData, Node, Edge, EventType } from '@/types/type';
import CommonMixin from '@/components/mixins/commonMixin.vue';
import bus from '@/util/bus';
import { getInterval } from '@/api/request';

@Component
export default class StaticsBoard extends Mixins(CommonMixin) {
  @State((state) => state.app.groupId) private groupId: any;
  @State((state) => state.app.regValue) private regValue: any;
  @State((state) => state.app.regType) private regType: any;
  @State((state) => state.app.isNoneTopoData) private isNoneTopoData!: boolean;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.topoDatas) private topoDatas!: {elements: Node[], edges: Edge[]};
  @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;
  @Provide() private conditionLabel: string = '';
  @Provide() private checkNone: boolean = false;

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
  @Watch('isCheckNone')
  public watchIsCheckNone(val: boolean) {
    getInterval({xAlarm: this.isCheckNone}).then((res) => {
      const dateValue = [res.start * 1000 - 8 * 3600 * 1000, res.end * 1000 - 8 * 3600 * 1000];
      this.$store.commit('SET_DEFAULTDATE', dateValue);
    })
  }
  public switchStatus(val: boolean) {
    this.$store.commit('SET_ISCHECKNONE', val);
  }
  public goBack() {
    this.$store.commit('SET_ISCHECKNONE', false);
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
  .topo-back {
    cursor: pointer;
    &:hover {
      color: #338AFF;
    }
    .app-back {
      padding-left: 10px;
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
    display: inline-block;
    padding-left: 10px;
    vertical-align: middle;
    text-align: left;
    font-size: 14px;
    color: #778296;
    &:active {
      color: #55657e;
    }
  }
}
</style>
