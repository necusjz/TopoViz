<template>
  <div class="rca-topo-table">
    <div class="topo-table-tabs">
      <div class="topo-table-tab" :class="{active: activeType === 0}" @click="activeType=0">未确认  {{unconfirm_count}}</div>
      <div class="topo-table-tab" :class="{active: activeType}" @click="activeType=1">已确认  {{confirm_count}}</div>
    </div>
    <TopoTable :isunConfirmed="activeType === 0" :tableData="tabData" @updateCount="updateConfirmCOunt"></TopoTable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import TopoTable from "../Table/TopoTable.vue";
import TableData from "./tableData.json";
import { AlarmData } from '@/types/type';
import { generateUUID } from '@/util/util';

@Component({
  components: {
    TopoTable
  }
})
export default class StaticsBoard extends Vue {
  @Provide() private activeType: number = 0;
  @Provide() private tabData: AlarmData[] = [];
  @Provide() private confirm_count: number = 0;
  @Provide() private unconfirm_count: number = 0;
  @State((state) => state.app.isNoneTopoData) private isNoneTopoData!: boolean;
  @State((state) => state.app.isNoneTableData) private isNoneTableData!: boolean;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.pageData) private pageData!: AlarmData[];
  @Watch('alarmDatas')
  public watchAlarmDatas(val: AlarmData[]) {
    this.activeType = 0;
    this.changeTableData()
    this.updateConfirmCOunt();
  }
  @Watch('pageData')
  public watchPageData(val: AlarmData[]) {
    this.tabData = [...val];
    this.setLastRow();
  }
  @Watch('activeType')
  private watchType(val: string, oval: string) {
    this.changeTableData();
  }
  public changeTableData() {
    let filt: boolean = !!this.activeType;
    const tableData: AlarmData[] = this.alarmDatas.filter((alarmData: AlarmData) => alarmData.isConfirmed === filt);
    this.$store.commit('SET_TABLEDATA', tableData);
  }
  public setLastRow() {
    if (this.tabData.length === 0) {
      return;
    }
    const lastRow = {
      uid: generateUUID(),
      index: -9999,
      type: "statics",
      ratio: "",
      alarmName: "",
      alarmSourceName: "保存",
      company: "",
      firstTime: "",
      lastTime: "",
      level: "",
      clearTime: "",
      domain: "",
      groupId: "",
      groupId_edit: "",
      rcaResult: "",
      rcaResult_edit: "",
      rcaReg: "",
      rcaReg_edit: "",
      isConfirmed: false
    }
    if (!this.activeType) {
      lastRow.ratio = '';
      lastRow.alarmName = '';
      lastRow.alarmSourceName = '一键确认';
    }
    this.tabData.splice(this.tabData.length, 0, lastRow);
  }
  public updateConfirmCOunt() {
    this.confirm_count = this.alarmDatas.filter((alarmData: AlarmData) => alarmData.isConfirmed).length;
    this.unconfirm_count = this.alarmDatas.length - this.confirm_count;
    this.changeTableData();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.rca-topo-table {
  padding: 0 0px 0 0px;
  .topo-table-tab {
    color: #282828;
    cursor: pointer;
    padding: 0 40px;
    &.active {
      font-weight: 600;
      color: #4a96ff;
      border-bottom:4px solid #4a96ff;
    }
  }
  .topo-table-tabs {
    display: flex;
    justify-content: flex-start;
    height: 50px;
    line-height: 50px;
    border-bottom: 1px solid #ededed;
    padding-left: 20px;
  }
}
</style>
