<template>
  <el-table
    class="topoTable"
    :class="{'topoTable-none-confirm': editAble}"
    :data="tableData"
    tooltip-effect="dark"
    :cell-class-name="getCellClassName"
    :row-class-name="getRowClassName"
    :header-cell-class-name="getHeaderCellClass"
    header-row-class-name="topoTable-header-row"
    @selection-change="handleSelectionChange"
    @cell-dblclick="handleCellDbclick"
    :span-method="objectSpanMethod"
  >
    <el-table-column type="selection" width="55" v-if="editAble"></el-table-column>
    <el-table-column prop="alarmName" label="告警名称">
      <template slot-scope="scope">
        <span :id="scope.row.alarmName" :title="scope.row.alarmName">{{scope.row.alarmName}}</span>
        <span class="static-ratio" v-if="scope.row.type === 'statics'">{{scope.row.ratio}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="alarmSourceName" label="告警源名称">
      <template slot-scope="scope">
        <span :title="scope.row.alarmSourceName">{{scope.row.alarmSourceName}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="company" label="厂商" min-width="60">
      <template slot-scope="scope">
        <span :title="scope.row.company">{{scope.row.company}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="firstTime" label="首次发生时间">
      <template slot-scope="scope">
        <span :title="scope.row.firstTime">{{scope.row.firstTime}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="lastTime" label="最近发生时间">
      <template slot-scope="scope">
        <span :title="scope.row.lastTime">{{scope.row.lastTime}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="level" label="级别" width="50">
      <template slot-scope="scope">
        <span :title="scope.row.level">{{scope.row.level}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="clearTime" label="清除时间">
      <template slot-scope="scope">
        <span :title="scope.row.clearTime">{{scope.row.clearTime}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="domain" label="域">
      <template slot-scope="scope">
        <span :title="scope.row.domain">{{scope.row.domain}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="Group_ID" label="Group ID">
      <template slot-scope="scope">
        <span :title="scope.row.Group_ID">{{scope.row.Group_ID}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="RCA_result" label="RCA结果">
      <template slot-scope="scope">
        <span v-show="editCellId !== `${scope.row.alarmName}-result`">{{scope.row.RCA_result}}</span>
        <TopoInput
          class="topoTable-hidden-input"
          v-if="editCellId === `${scope.row.alarmName}-result`"
          :row="scope.row"
          attr="RCA_result"
          @blur="inputBlur"
        ></TopoInput>
      </template>
    </el-table-column>
    <el-table-column prop="RCA_reg" label="RCA 规则">
      <template slot-scope="scope">
        <span v-show="editCellId !== `${scope.row.alarmName}-reg`" :title="scope.row.RCA_reg">{{scope.row.RCA_reg}}</span>
        <TopoInput
          class="topoTable-hidden-input"
          v-if="editCellId === `${scope.row.alarmName}-reg`"
          :row="scope.row"
          attr="RCA_reg"
          @blur="inputBlur"
        ></TopoInput>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import TopoInput from "../Edit/TopoInput.vue";
import { AlarmData } from '@/types/type';

interface CellData {
  row: any;
  column: any;
  rowIndex: number;
  columnIndex: number;
}

@Component({
  components: {
    TopoInput
  }
})
export default class TopoTable extends Vue {
  @Provide() private editCellId: string = "";
  @Provide() private inputValue: string = "";
  @Prop() private editAble!: boolean;
  @Prop() private tableData!: any[];
  @State((state) => state.app.pageData) private pageData: any;
  public handleSelectionChange(val: any) {
    //console.log(val);
  }
  public handleCellDbclick(row: any, column: any) {
    if (this.editAble && column.property) {
      if (column.property.includes("RCA_reg")) {
        this.editCellId = `${row.alarmName}-reg`;
        this.inputValue = row.RCA_reg;
      } else if (column.property.includes("RCA_result")) {
        this.editCellId = `${row.alarmName}-result`;
        this.inputValue = row.RCA_result;
      }
    }
  }
  public inputBlur(newRow: AlarmData) {
    console.log(newRow);
    this.editCellId = "";
  }
  public getHeaderCellClass(item: CellData) {
    let headerCellClassName: string = "bg-gray ";
    if (item.column.property && item.column.property.includes("alarmName")) {
      headerCellClassName += "left-align";
    }
    return headerCellClassName;
  }
  public getCellClassName(item: CellData): string {
    let cellClassName: string = "topoTable-cell ";
    if (
      item.column.property &&
      (item.column.property.includes("RCA_result") ||
        item.column.property.includes("RCA_reg"))
    ) {
      cellClassName += "bg-gray";
    } else if (item.rowIndex === this.tableData.length - 1) {
      const index: number = this.editAble ? 1 : 0;
      if (item.columnIndex === index) {
        cellClassName += "static-cell";
      } else if (item.columnIndex === index + 1) {
        cellClassName += "submit-cell";
      }
    }
    return cellClassName;
  }
  public getRowClassName(item: { row: object; rowIndex: number }): string {
    if (item.rowIndex === this.tableData.length - 1) {
      return "topo-table-static-row";
    }
    return "";
  }
  public objectSpanMethod(item: CellData) {
    if (item.rowIndex === this.tableData.length - 1) {
      const index: number = this.editAble ? 1 : 0;
      if (item.columnIndex === index) {
        return this.editAble
          ? { colspan: 10, rowspan: 1 }
          : { colspan: 9, rowspan: 1 };
      } else if (item.columnIndex === index + 1) {
        return { colspan: 2, rowspan: 1 };
      } else {
        return { colspan: 0, rowspan: 0 };
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.topoTable {
  .topoTable-header-row .cell {
    color: #55657e;
    text-align: center;
    font-weight: 600;
  }
  .bg-gray {
    background: rgba(67, 146, 255, 0.06);
  }
  .topoTable-cell {
    .cell {
      position: relative;
      text-align: center;
      color: #282828;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    span {
      display: inline-block;
      text-align: left;
    }
  }
  .topo-table-static-row {
    &:hover {
      .static-cell {
        background: none;
      }
      .submit-cell {
        background: #ccc;
      }
    }
    .static-cell {
      border-right: 1px solid #ebeef5;
      .cell {
        color: #4a96ff;
      }
      .static-ratio {
        color: #d00000;
      }
    }
    .submit-cell {
      cursor: pointer;
      background: #e6e6e6;
      border-radius: 2px;
      .cell {
        color: #999999;
      }
    }
  }
  .topoTable-hidden-input {
    position: relative;
  }
}
</style>
