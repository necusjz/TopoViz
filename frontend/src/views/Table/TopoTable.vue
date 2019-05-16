<template>
  <div>
    <el-table
      ref="table"
      class="topoTable"
      :class="{'topoTable-none-confirm': isunConfirmed}"
      :data="tableData"
      tooltip-effect="dark"
      cell-class-name="topoTable-cell"
      :row-class-name="getRowClassName"
      :header-cell-class-name="getHeaderCellClass"
      header-row-class-name="topoTable-header-row"
      @selection-change="handleSelectionChange"
      @cell-click="confirm"
      @row-click="handleRowClick"
      row-key="uid"
    >
      <el-table-column type="selection" width="60" v-if="isunConfirmed"></el-table-column>
      <el-table-column prop="alarmName" :label="$t('lang.alarmName')" width="110">
        <template slot-scope="scope">
          <span :title="scope.row.alarmName">{{scope.row.alarmName}}</span>
          <span class="static-ratio" v-if="scope.row.type === 'statics'">{{scope.row.ratio}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="alarmSourceName" :label="$t('lang.alarmSource')" width="110">
        <template slot-scope="scope">
          <span :id="scope.row.alarmSourceName" :title="scope.row.alarmSourceName">{{scope.row.alarmSourceName}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="company" :label="$t('lang.firm')" min-width="80">
        <template slot-scope="scope">
          <span :title="scope.row.company">{{scope.row.company}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="firstTime" :label="$t('lang.firstTime')" width="150">
        <template slot-scope="scope">
          <span :title="scope.row.firstTime">{{scope.row.firstTime}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="lastTime" :label="$t('lang.lastTime')" width="150">
        <template slot-scope="scope">
          <span :title="scope.row.lastTime">{{scope.row.lastTime}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="level" :label="$t('lang.level')" width="110">
        <template slot-scope="scope">
          <span :title="scope.row.level">{{scope.row.level}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="clearTime" :label="$t('lang.clearTime')" width="150">
        <template slot-scope="scope">
          <span :title="scope.row.clearTime">{{scope.row.clearTime}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="domain" :label="$t('lang.domain')" width="90">
        <template slot-scope="scope">
          <span :title="scope.row.domain">{{scope.row.domain}}</span>
        </template>
      </el-table-column>
      <el-table-column prop="groupId_edit" label="Group ID" width="180">
        <template slot-scope="scope">
          <div v-if="isCheckNone">
            <el-popover
                popper-class="edit-history-wrap"
                placement="bottom"
                :disabled="isunConfirmed || popoverDisable || scope.row.groupId === scope.row.groupId_edit"
                trigger="hover">
              <div class="edit-record">
                <p class="gray-text">{{$t('lang.beforeEdit')}}：</p>
                <p>{{scope.row.groupId}}</p>
                <p class="gray-text">{{$t('lang.afterEdit')}}：</p>
                <p>{{scope.row.groupId_edit}}</p>
              </div>
              <div class="rcaGroup-wrap" v-show="editCellId !== `${scope.row.uid}-groupId`" slot="reference" @click="handleCellClick(scope.row, 'groupId')">
                <span :title="scope.row.groupId_edit" class="rcaReg-label edit-label">{{scope.row.groupId_edit || '空'}}</span>
                <i class="el-icon-edit"></i>
              </div>
            </el-popover>
            <TopoInput
              class="topoTable-hidden-input"
              v-if="editCellId === `${scope.row.uid}-groupId`"
              :row="scope.row"
              attr="groupId_edit"
              @blur="inputBlur"
            ></TopoInput>
          </div>
          <el-popover
              popper-class="edit-history-wrap"
              placement="bottom"
              :width="100"
              :disabled="isunConfirmed || popoverDisable || scope.row.groupId === scope.row.groupId_edit"
              trigger="hover" v-else>
              <div class="edit-record">
                <p class="gray-text">{{$t('lang.beforeEdit')}}：</p>
                <p>{{scope.row.groupId}}</p>
                <p class="gray-text">{{$t('lang.afterEdit')}}：</p>
                <p>{{scope.row.groupId_edit}}</p>
              </div>
              <el-dropdown trigger="click" size="small" @visible-change="dropDownVisble" @command="handleCommandGroupId" placement="bottom" slot="reference">
                <span :title="scope.row.groupId_edit" class="edit-text">
                  {{scope.row.groupId_edit}}
                  <i class="el-icon-arrow-down"></i>
                </span>
                <el-dropdown-menu slot="dropdown" class="group_dropdown">
                  <el-dropdown-item :command="scope.row">{{getEditGroupIdLabel(scope.row)}}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="rcaResult_edit" :label="$t('lang.rcaResult')" width="120">
        <template slot-scope="scope">
          <el-popover
              popper-class="edit-history-wrap"
              placement="bottom"
              :disabled="isunConfirmed || popoverDisable || scope.row.rcaResult === scope.row.rcaResult_edit"
              trigger="hover"
              >
              <div class="edit-record">
                <p class="gray-text">{{$t('lang.beforeEdit')}}：</p>
                <p>{{scope.row.rcaResult}}</p>
                <p class="gray-text">{{$t('lang.afterEdit')}}：</p>
                <p>{{scope.row.rcaResult_edit}}</p>
              </div>
              <el-dropdown trigger="click" size="small" @command="handleCommandRCAResult" @visible-change="dropDownVisble" placement="bottom" slot="reference">
                <span :title="scope.row.rcaResult_edit" class="edit-text">
                  {{scope.row.rcaResult_edit}}
                  <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item :command="scope.row">{{scope.row.rcaResult_edit === 'C' ? 'P' : 'C'}}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="rcaReg_edit" :label="$t('lang.rcaReg')" min-width="180px">
        <template slot-scope="scope">
          <el-popover
              popper-class="edit-history-wrap"
              placement="bottom"
              :disabled="isunConfirmed || popoverDisable || scope.row.rcaReg === scope.row.rcaReg_edit"
              trigger="hover">
            <div class="edit-record">
              <p class="gray-text">{{$t('lang.beforeEdit')}}：</p>
              <p>{{scope.row.rcaReg}}</p>
              <p class="gray-text">{{$t('lang.afterEdit')}}：</p>
              <p>{{scope.row.rcaReg_edit}}</p>
            </div>
            <div class="rcaReg-wrap" v-show="editCellId !== `${scope.row.uid}-reg`" slot="reference" @click="handleCellClick(scope.row, 'reg')">
              <span :title="scope.row.rcaReg_edit" class="rcaReg-label edit-label">{{scope.row.rcaReg_edit}}</span>
              <i class="el-icon-edit"></i>
            </div>
          </el-popover>
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
          {{ isunConfirmed ? $t('lang.noData') : $t('lang.noDataMsg') }}
        </span>
      </div>
    </el-table>
    <el-row v-if="tableData.length > 0">
      <el-col :offset="20" :span="4" class="topotable-confirm-btn" :class="{active: needSave}" @click.native="confirm('save')">
        {{isunConfirmed ? $t('lang.confirmText') : $t('lang.saveText')}}
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import TopoInput from "../Edit/TopoInput.vue";
import { AlarmData, RCAResult, EventType } from '@/types/type';
import { confirmAlarmDatas } from '@/api/request';
import bus from '@/util/bus';

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
  @Provide() private showTip: boolean = true;
  @Provide() private dropLabel: string = '空';
  @Provide() private popoverDisable: boolean = false;
  @Prop() private isunConfirmed!: boolean;
  @Prop() private tableData!: AlarmData[];
  @State((state) => state.app.pageData) private pageData: any;
  @State((state) => state.app.selectAlarm) private selectAlarm!: string;
  @State((state) => state.app.groupId) private groupId!: string;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.needSave) private needSave!: boolean;
  @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;
  @Watch('pageData')
  public watchPageData(val: AlarmData[]) {
    this.$nextTick(() => {
      this.updateStyleOfPrev();
    });
  }
  @Watch('selectAlarm')
  public watchSelectAlarm(val: string) {
    this.$nextTick(() => {
      this.updateStyleOfPrev();
    });
  }
  mounted() {
    bus.$on(EventType.SAVEDATA, () => {
      this.confirm('save');
    });
  }
  public handleSelectionChange(rows: AlarmData[]) {
    this.editRows = Array.from(new Set(rows));
    this.$store.commit('SET_NEEDSAVE', this.editRows.length > 0);
  }
  public handleCellClick(row: AlarmData, tag: string) {
    this.editCellId = `${row.uid}-${tag}`;
    this.inputValue = row.rcaReg_edit;
    this.popoverDisable = true;
  }
  public handleRowClick(row: AlarmData, column: any) {
    if (row.type === 'statics' || !column) return;
    if (column && column.property) {
      if (column.property === 'groupId_edit') {
        // 同组
        if (row.groupId === this.groupId) {
          this.dropLabel = row.groupId_edit === '空' ? this.groupId : '空';
        } else {
          this.dropLabel = row.groupId_edit === this.groupId ? row.groupId : this.groupId;
        }
      } else if (column.property === 'rcaResult_edit') {
        this.dropLabel = row.rcaResult_edit === RCAResult.P ? RCAResult.C : RCAResult.P;
      }
      if (/(rcaReg_edit)|(groupId_edit)|(rcaResult_edit)/.test(column.property)) return;
    }
    window.location.hash = '#stage';
    this.$store.commit('SET_SELECTALARM', row.alarmSourceName);
    setTimeout(() => {
      window.location.hash = '';
    });
  }
  public inputBlur(newRow?: AlarmData) {
    this.editCellId = "";
    if (newRow) {
      this.setSelectedRow(newRow);
    }
    this.popoverDisable = false;
  }
  public getHeaderCellClass(item: CellData) {
    let headerCellClassName: string = "bg-gray ";
    if (item.column.property && item.column.property.includes("alarmName")) {
      headerCellClassName += "left-align";
    }
    return headerCellClassName;
  }
  public getRowClassName(item: { row: any; rowIndex: number }): string {
    if (item.row.alarmSourceName === this.selectAlarm) {
      return 'topo-table-row-active';
    }
    return "";
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
  // popover是否可见
  public dropDownVisble(visible: boolean) {
    this.popoverDisable = visible;
  }
  public getEditGroupIdLabel(item: AlarmData): string {
    if (item.groupId_edit === '空') {
      return this.groupId;
    } else if (item.groupId === this.groupId) {
      return '空';
    } else {
      return item.groupId_edit === this.groupId ? item.groupId : this.groupId;
    }
  }
  public handleCommandRCAResult(item: AlarmData) {
    const result: string = item.rcaResult_edit === RCAResult.P ? RCAResult.C : RCAResult.P;
    item.rcaResult_edit = result;
    if (item.rcaResult_edit !== item.rcaResult) {
      this.setSelectedRow(item);
    } else {
      this.cancelSelectRow(item);
    }
  }
  public handleCommandGroupId(item: AlarmData) {
    const edit_groupId = this.getEditGroupIdLabel(item).trim();
    item.groupId_edit = edit_groupId;
    if (item.groupId_edit !== item.groupId) {
      this.setSelectedRow(item);
    } else {
      this.cancelSelectRow(item);
    }
  }
  // 设置选中的行
  public setSelectedRow(row: AlarmData) {
    const table: any = this.$refs.table;
    table.toggleRowSelection(row, true);
    this.$store.commit('SET_NEEDSAVE', true);
  }
  public cancelSelectRow(row: AlarmData) {
    const table: any = this.$refs.table;
    table.toggleRowSelection(row, false);
  }
  // 提交确认的数据
  public confirm(row: AlarmData | string, column?: any) {
    if (row === 'save') {
      this.saveData();
    } else if (typeof row !== 'string' && row.type === 'statics' && column && column.property === 'alarmSourceName') {
      this.saveData();
    }
  }
  public saveData() {
    if (!this.vertifyRCA() || !this.needSave) return;
    const data: {row: number[], columns: string[][], values: string[][]} = {row: [], columns: [], values: []};
    const noGroupAlarmsSet: Set<string> = new Set();
    const rows = this.editRows;
    rows.forEach((grow: AlarmData) => {
      if (grow.type === 'statics') return;
      const columns: string[] = [];
      const values: string[] = [];
      const propsMapping: {[k: string]: string} = {
        groupId: 'GroupId_Edited',
        rcaResult: 'RcaResult_Edited',
        rcaReg: 'RuleName_Edited',
      }
      for (const key of Object.keys(propsMapping)) {
        if (this.checkEdited(grow, key)) {
          columns.push(propsMapping[key]);
          const value = grow[`${key}_edit`] === '空' ? '' : grow[`${key}_edit`];
          values.push(value);
        }
      }
      if (grow.groupId_edit === '空' && !this.isCheckNone) {
        noGroupAlarmsSet.add(grow.alarmSourceName);
      } else {
        grow.isConfirmed = true;
      }
      data.row.push(grow.index);
      data.columns.push(columns);
      data.values.push(values);
    });
    this.$emit('updateCount');
    confirmAlarmDatas(this.groupId, data).then((res) => {
      this.$store.commit('SET_STATICS', res);
      this.$message.success('保存成功');
      this.$store.commit('SET_NEEDSAVE', false);
    })
    this.findClearAlars(noGroupAlarmsSet);
  }
  public checkEdited(grow: AlarmData, key: string): boolean {
    if (grow[key] !== grow[`${key}_edit`]) {
      if (key === 'rcaResult') {
        // groupId存在rcaResult的值才需要保存
        return !!grow.groupId_edit && grow.groupId_edit !== '空';
      }
      return true;
    }
    return false;
  }
  public vertifyRCA(): boolean {
    // 验证本组最少有一个P警告
    if (this.isCheckNone) {
      const distinctGroupIds: string[] = [...new Set(this.editRows.map((alarmData: AlarmData) => alarmData.groupId_edit))];
      for (const groupId of distinctGroupIds) {
        if (groupId) {
          const alarmDatas = this.alarmDatas.filter((alarmData: AlarmData) => alarmData.groupId_edit === groupId)
          if (!alarmDatas.some((alarmData: AlarmData) => alarmData.rcaResult_edit === RCAResult.P)) {
            bus.$emit(EventType.ERRORVISIBLE, '<p>A group of data contains at least one P alarm. Please check and edit.</p>');
            return false;
          }
        }
      }
    } else {
      let alarmDatas: AlarmData[] = this.alarmDatas;
      if (!this.isCheckNone) {
        alarmDatas = this.alarmDatas.filter((alarmData) => alarmData.groupId_edit === this.groupId);
      }
      const pAlarms = alarmDatas.filter((alarmData) => alarmData.rcaResult_edit === RCAResult.P);
      if (pAlarms.length === 0) {
        bus.$emit(EventType.ERRORVISIBLE, '<p>A group of data contains at least one P alarm. Please check and edit.</p>');
        return false;
      }
    }
    return true;
  }
  public findClearAlars(noGroupAlarmsSet: Set<string>) {
    for (let i = this.alarmDatas.length - 1; i >= 0; i--) {
      const alarmData = this.alarmDatas[i];
      if ((alarmData.groupId_edit === '空' || alarmData.groupId_edit === '')&& !this.isCheckNone) {
        this.alarmDatas.splice(i, 1);
      } else if (noGroupAlarmsSet.has(alarmData.alarmSourceName) && alarmData.groupId_edit !== '空') {
        noGroupAlarmsSet.delete(alarmData.alarmSourceName);
      }
    }
    if (noGroupAlarmsSet.size > 0) {
      bus.$emit(EventType.CLEARALARMNET, noGroupAlarmsSet);
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
    border: 3px solid #4a96ff;
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
  .rcaReg-label {
    padding-right: 5px;
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
      margin-top: 8%;
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
    background-size: 290px 190px;
    background-repeat: no-repeat;
  }
  .el-icon-arrow-down {
    color: #4a96ff;
  }
}
.drop-select {
  min-width: 80px!important;
  padding: 5px 0!important;
  cursor: pointer;
  .drop-label {
    padding: 0 7px;
    &:hover {
      background: #f5f7fa;
    }
  }
}
.rcaGroup-wrap {
  display: flex;
  align-items: center;
  .edit-label {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.group_dropdown {
  min-width: 120px;
}
.edit-history-wrap {
  min-width: fit-content!important;
}
.edit-record {
  font-size: 12px;
  color: #282828;
  line-height: 20px;
}
.edit-label:hover {
  color: #368cff;
}
.topotable-confirm-btn {
  height: 48px;
  line-height: 48px;
  background: #e6e6e6;
  color: #999999;
  border-radius: 2px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: #bfbfbf;
  }
  &.active {
    color: #ffffff;
    background-image: linear-gradient(99deg, #4d97ff, #3189ff);
  }
}
</style>
