<template>
  <div class="rca-topo-table">
    <div class="topo-table-tabs">
      <div class="topo-table-tab" :class="{active: activeType === 0}" @click="activeType=0">待处理  {{this.tabData.length}}</div>
      <div class="topo-table-tab" :class="{active: activeType}" @click="activeType=1">已处理  0</div>
    </div>
    <TopoTable :editAble="activeType === 0" :tableData="tabData"></TopoTable>
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
  @State((state) => state.app.isNoneData) private isNoneData: any;
  @State((state) => state.app.alarmDatas) private alarmDatas: any;
  @State((state) => state.app.pageData) private pageData: any;
  @Watch('alarmDatas')
  public watchAlarmDatas(val: AlarmData[]) {
    this.changeTableData()
  }
  @Watch('pageData')
  public watchPageData(val: AlarmData[]) {
    this.tabData = val.slice(0);
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
    const lastRow = {
      uid: generateUUID(),
      type: "statics",
      ratio: "80%",
      alarmName: "当前组精准率: ",
      alarmSourceName: "保存",
      company: "",
      firstTime: "",
      lastTime: "",
      level: "",
      clearTime: "",
      domain: "",
      Group_ID: "",
      RCA_result: "",
      RCA_reg: "",
      isConfirmed: false
    }
    if (!this.activeType) {
      lastRow.ratio = '';
      lastRow.alarmName = '当前组精准率: --';
      lastRow.alarmSourceName = '一键确认';
    }
    this.tabData.push(lastRow);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.rca-topo-table {
  padding-left: 30px;
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
  }
}
</style>
