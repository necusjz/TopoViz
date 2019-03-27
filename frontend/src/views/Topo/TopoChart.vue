<template>
  <div class="rca-topo-table">
    <div class="topo-table-tabs">
      <div class="topo-table-tab" :class="{active: activeType}" @click="activeType='none'">未确认</div>
      <div class="topo-table-tab" :class="{active: !activeType}" @click="activeType=''">已确认</div>
    </div>
    <TopoTable :editAble="activeType === 'none'" :tableData="tabData"></TopoTable>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import TopoTable from "./TopoTable.vue";
import TableData from "./tableData.json";

@Component({
  components: {
    TopoTable
  }
})
export default class StaticsBoard extends Vue {
  @Provide() private activeType: string = 'none';
  @Provide() private tabData: any = [];
  @State((state) => state.app.isNoneData) private isNoneData: any;
  @Watch('activeType')
  private watchType(val: string, oval: string) {
    this.tabData.pop();
    this.setLastRow();
  }
  created() {
    for (let i = 2; i < 12; i++) {
      this.tabData[i - 2] = { ...TableData[0], alarmName: `X0934_RTN950-0${i}`};
    }
    this.setLastRow();
  }
  public setLastRow() {
    const lastRow = {
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
      RCA_reg: ""
    }
    if (this.activeType === 'none') {
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
    padding: 0 40px;
    color: #282828;
    cursor: pointer;
    &.active {
      font-weight: 600;
      color: #4a96ff;
      border-bottom:2px solid #4a96ff;
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
