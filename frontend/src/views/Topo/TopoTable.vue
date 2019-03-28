<template>
  <el-table
    class="topoTable"
    :class="{'topoTable-none-confirm': editAble}"
    :data="tableData"
    tooltip-effect="dark"
    :cell-class-name="getCellClassName"
    :row-class-name="getRowClassName"
    header-cell-class-name="bg-gray"
    @selection-change="handleSelectionChange"
    :span-method="objectSpanMethod"
  >
    <el-table-column type="selection" width="55" v-if="editAble"></el-table-column>
    <el-table-column prop="alarmName" label="告警名称">
      <template slot-scope="scope">
        <span :id="scope.row.alarmName">{{scope.row.alarmName}}</span>
        <span class="static-ratio" v-if="scope.row.type === 'statics'">{{scope.row.ratio}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="alarmSourceName" label="告警源名称"></el-table-column>
    <el-table-column prop="company" label="厂商" width="50"></el-table-column>
    <el-table-column prop="firstTime" label="首次发生时间"></el-table-column>
    <el-table-column prop="lastTime" label="最近发生时间"></el-table-column>
    <el-table-column prop="level" label="级别" width="50"></el-table-column>
    <el-table-column prop="clearTime" label="清除时间"></el-table-column>
    <el-table-column prop="domain" label="域"></el-table-column>
    <el-table-column prop="Group_ID" label="Group ID"></el-table-column>
    <el-table-column prop="RCA_result" label="RCA结果"></el-table-column>
    <el-table-column prop="RCA_reg" label="RCA 规则"></el-table-column>
  </el-table>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { State } from "vuex-class";
import TableData from "./tableData.json";

interface CellData {
  row: any;
  column: any;
  rowIndex: number;
  columnIndex: number;
}

@Component
export default class StaticsBoard extends Vue {
  @Prop() private editAble!: boolean;
  @Prop() private tableData!: any[];
  public handleSelectionChange(val: any) {
    //console.log(val);
  }
  public getCellClassName(item: CellData) {
    if (
      item.column.property &&
      (item.column.property.includes("RCA_result") ||
        item.column.property.includes("RCA_reg"))
    ) {
      return "bg-gray";
    } else if (item.rowIndex === this.tableData.length - 1) {
      const index: number = this.editAble ? 1 : 0;
      if (item.columnIndex === index) {
        return "static-cell";
      } else if (item.columnIndex === index + 1) {
        return "submit-cell";
      }
    }
  }
  public getRowClassName(item: { row: any; rowIndex: number }): string {
    if (item.rowIndex === this.tableData.length - 1) {
      return "topo-table-static-row";
    }
    return "";
  }
  public objectSpanMethod(item: CellData) {
    if (item.rowIndex === this.tableData.length - 1) {
      const index: number = this.editAble ? 1 : 0;
      if (item.columnIndex === index) {
        return this.editAble ? {colspan: 10, rowspan: 1} : {colspan: 9, rowspan: 1};
      } else if (item.columnIndex === index + 1) {
        return { colspan: 2, rowspan: 1};
      } else {
        return { colspan: 0, rowspan: 0};
      }
    } 
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.topoTable {
  .bg-gray {
    background: rgba(67, 146, 255, 0.06);
  }
  .topo-table-static-row {
    &:hover {
      .static-cell, .submit-cell {
        background: none;
      }
      .submit-cell {
        background: #ccc;
      }
    }
    .cell {
      text-align: center;
    }
    .static-cell {
      border-right: 1px solid #EBEEF5;
      color: #4A96FF;
      .static-ratio {
        color: #D00000;
      }
    }
    .submit-cell {
      cursor: pointer;
      background: #E6E6E6;
      border-radius: 2px;
    }
  }
}
</style>
