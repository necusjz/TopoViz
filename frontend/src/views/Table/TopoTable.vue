<template>
  <el-table
    class="topoTable"
    :class="{'topoTable-none-confirm': isunConfirmed}"
    :data="tableData"
    tooltip-effect="dark"
    :cell-class-name="getCellClassName"
    :row-class-name="getRowClassName"
    :header-cell-class-name="getHeaderCellClass"
    header-row-class-name="topoTable-header-row"
    @selection-change="handleSelectionChange"
    @cell-dblclick="handleCellDbclick"
    @cell-click="confirm"
    @row-click="handleRowClick"
    row-key="uid"
    :span-method="objectSpanMethod"
  >
    <el-table-column type="selection" width="55" v-if="isunConfirmed"></el-table-column>
    <el-table-column prop="alarmName" label="告警名称">
      <template slot-scope="scope">
        <span :title="scope.row.alarmName">{{scope.row.alarmName}}</span>
        <span class="static-ratio" v-if="scope.row.type === 'statics'">{{scope.row.ratio}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="alarmSourceName" label="告警源名称">
      <template slot-scope="scope">
        <span :id="scope.row.alarmSourceName" :title="scope.row.alarmSourceName">{{scope.row.alarmSourceName}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="company" label="厂商" min-width="60">
      <template slot-scope="scope">
        <span :title="scope.row.company">{{scope.row.company}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="firstTime" label="首次发生时间" min-width="150">
      <template slot-scope="scope">
        <span :title="scope.row.firstTime">{{scope.row.firstTime}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="lastTime" label="最近发生时间" min-width="150">
      <template slot-scope="scope">
        <span :title="scope.row.lastTime">{{scope.row.lastTime}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="level" label="级别">
      <template slot-scope="scope">
        <span :title="scope.row.level">{{scope.row.level}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="clearTime" label="清除时间" min-width="150">
      <template slot-scope="scope">
        <span :title="scope.row.clearTime">{{scope.row.clearTime}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="domain" label="域">
      <template slot-scope="scope">
        <span :title="scope.row.domain">{{scope.row.domain}}</span>
      </template>
    </el-table-column>
    <el-table-column prop="groupId_edit" label="Group ID" width="180">
      <template slot-scope="scope">
        <el-popover placement="bottom" popper-class="drop-select" trigger="click">
          <div class="drop-label">{{dropLabel}}</div>
          <span :title="scope.row.groupId_edit" slot="reference">{{scope.row.groupId_edit}}
            <i class="el-icon-arrow-down"></i>
          </span>
        </el-popover>
      </template>
    </el-table-column>
    <el-table-column prop="rcaResult_edit" label="RCA结果">
      <template slot-scope="scope">
        <span v-show="editCellId !== `${scope.row.uid}-result`">{{scope.row.rcaResult_edit}}</span>
        <el-popover placement="bottom" popper-class="drop-select" trigger="click">
          <div class="drop-label">{{dropLabel}}</div>
          <span :title="scope.row.rcaResult_edit" slot="reference">{{scope.row.rcaResult_edit}}
            <i class="el-icon-arrow-down"></i>
          </span>
        </el-popover>
      </template>
    </el-table-column>
    <el-table-column prop="rcaReg_edit" label="RCA 规则">
      <template slot-scope="scope">
        <span v-show="editCellId !== `${scope.row.uid}-reg`" :title="scope.row.rcaReg_edit">{{scope.row.rcaReg_edit}}</span>
        <TopoInput
          class="topoTable-hidden-input"
          v-if="editCellId === `${scope.row.uid}-reg`"
          :row="scope.row"
          attr="rcaReg_edit"
          @blur="inputBlur"
        ></TopoInput>
      </template>
    </el-table-column>
    <div slot="empty" class="none-tableData-wrap">
      <span class="none-table-label">
        <i class="el-icon-warning"></i>
        {{ isunConfirmed ? '无数据' : '您还没有确认过的数据哦，去未确认里看看吧'}}
      </span>
    </div>
  </el-table>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import TopoInput from "../Edit/TopoInput.vue";
import { AlarmData, RCAResult } from '@/types/type';

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
  @Provide() private editRows: AlarmData[] = [];
  @Provide() private needSave: boolean = false;
  @Provide() private showTip: boolean = true;
  @Provide() private activeItem!: AlarmData;
  @Provide() private dropLabel: string = '空';
  @Prop() private isunConfirmed!: boolean;
  @Prop() private tableData!: AlarmData[];
  @State((state) => state.app.pageData) private pageData: any;
  @State((state) => state.app.selectAlarm) private selectAlarm!: string;
  @State((state) => state.app.groupId) private groupId!: string;
  @Watch('pageData')
  public watchPageData(val: AlarmData[]) {
    this.$nextTick(() => {
      this.updateStyleOfPrev();
    });
  }
  @Watch('selectAlarm')
  public watxhSelectAlarm(val: string) {
    this.$nextTick(() => {
      this.updateStyleOfPrev();
    });
  }
  public handleSelectionChange(rows: AlarmData[]) {
    this.editRows = Array.from(new Set(rows));
    this.needSave = this.editRows.length > 0;
  }
  public handleCellDbclick(row: any, column: any) {
    if (column.property) {
      if (column.property.includes("rcaReg_edit")) {
        this.editCellId = `${row.uid}-reg`;
        this.inputValue = row.rcaReg_edit;
      } else if (column.property.includes("rcaResult_edit")) {
        this.editCellId = `${row.uid}-result`;
        this.inputValue = row.rcaResult_edit;
      }
    }
  }
  public handleRowClick(row: any, column: any) {
    if (column.property) {
      if (column.property === 'groupId_edit') {
        this.dropLabel = row.groupId_edit === '空' ? this.groupId : row.groupId_edit === this.groupId ? row.groupId : '空';
      } else if (column.property === 'rcaResult_edit') {
        this.dropLabel = row.rcaResult_edit === RCAResult.P ? RCAResult.C : RCAResult.P;
      }
    }
    if (row.type === 'statics' || column.property && /(rcaReg_edit)|(groupId_edit)|(rcaResult_edit)/.test(column.property)) {
      return;
    }
    window.location.hash = '#stage';
    this.$store.commit('SET_SELECTALARM', row.alarmSourceName);
    setTimeout(() => {
      window.location.hash = '';
    });
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
    if (item.rowIndex === this.tableData.length - 1) {
      const index: number = this.isunConfirmed ? 1 : 0;
      if (item.columnIndex === index) {
        cellClassName += "static-cell";
      } else if (item.columnIndex === index + 1) {
        cellClassName += "submit-cell";
        if (this.needSave) {
          cellClassName += " active";
        }
      }
    }
    return cellClassName;
  }
  public getRowClassName(item: { row: any; rowIndex: number }): string {
    if (item.rowIndex === this.tableData.length - 1) {
      return "topo-table-static-row";
    }
    if (item.row.alarmSourceName === this.selectAlarm) {
      return 'topo-table-row-active';
    }
    return "";
  }
  public objectSpanMethod(item: CellData) {
    if (item.rowIndex === this.tableData.length - 1) {
      const index: number = this.isunConfirmed ? 1 : 0;
      if (item.columnIndex === index) {
        return this.isunConfirmed
          ? { colspan: 10, rowspan: 1 }
          : { colspan: 9, rowspan: 1 };
      } else if (item.columnIndex === index + 1) {
        return { colspan: 2, rowspan: 1 };
      } else {
        return { colspan: 0, rowspan: 0 };
      }
    }
  }
  // 更新相邻行选中的样式
  public updateStyleOfPrev() {
    const eles = document.querySelectorAll('.topo-table-row-active');
    for (let i = 0; i < eles.length; i++) {
      const selfDom = eles[i] as HTMLElement;
      const pre = (selfDom.previousElementSibling || selfDom.previousSibling) as HTMLElement;
      const next = (selfDom.nextElementSibling) as HTMLElement;
      if (pre && pre.classList.contains('topo-table-row-active')) {
        pre.style.borderBottom = 'none';
      }
    }
  }
  // 提交确认的数据
  public confirm(row: any, column: any) {
    if (row.type === 'statics' && column.property === 'alarmSourceName') {
      this.editRows.forEach((row) => {
        row.isConfirmed = true;
      });
      this.$emit('updateCount');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.topoTable {
  cursor: pointer;
  table {
    border-collapse: collapse;
  }
  .topo-table-row-active {
    border: 2px solid #4a96ff;
    border-left: 1px solid #4a96ff;
    & + .topo-table-row-active {
      border-top: none;
    }

  }
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
      &.active {
        background-image: linear-gradient(99deg, #4d97ff, #3189ff);
        .cell {
          color: #ffffff;
        }
      }
      .cell {
        color: #999999;
      }
    }
  }
  .topoTable-hidden-input {
    position: relative;
  }
  .none-tableData-wrap {
    min-height: 600px;
    .none-table-label {
      display: inline-block;
      position: absolute;
      left: 50%;
      top: 50%;
      margin-top: 12%;
      transform: translateX(-50%);
      font-size: 20px;
      i {
        padding-right: 10px;
      }
    }
  }
  .el-table__empty-block {
    background-image: url('../../assets/none-topoChart.png');
    background-position: center 40%;
    background-size: 30% auto;
    background-repeat: no-repeat;
  }
}
.drop-select {
  min-width: 80px!important;
  cursor: pointer;
  .drop-label {
    &:hover {
      background: #3189ff;
    }
  }
}
</style>
