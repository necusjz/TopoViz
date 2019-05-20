<template>
  <div class="app-query-tool">
    <div class="app-query-tool-item app-query-type-wrap">
      <el-radio v-model="radioType" label="1" :disabled="isNonImported" text-color="">{{$t('lang.knownAlarm')}}</el-radio>
      <el-radio v-model="radioType" label="2" :disabled="isNonImported">{{$t('lang.unknownAlarm')}}</el-radio>
    </div>
    <div class="app-query-tool-item app-query-date-wrap">
      <el-date-picker
        type="datetime"
        v-model="startTime"
        class="app-query-date"
        value-format="timestamp"
        :clearable="false"
        :disabled="isNonImported"
        @change="dateChange"
        :placeholder="$t('lang.selectStart')"
        size="mini"
      ></el-date-picker>
      <span style="padding-right: 5px;color:#C0C4CC">—</span>
      <el-date-picker
        type="datetime"
        v-model="endTime"
        class="app-query-date"
        value-format="timestamp"
        :clearable="false"
        :disabled="isNonImported"
        @change="dateChange"
        :placeholder="$t('lang.selectEnd')"
        size="mini"
      ></el-date-picker>
    </div>
    <div class="app-query-tool-item app-query-tool-group-wrap">
      <el-autocomplete
        :placeholder="$t('lang.enterGroup')"
        v-model="groupId"
        size="mini"
        :disabled="isNonImported"
        class="app-query-tool-group"
        :class="{'error-border-input': visibleErrorTip}"
        :fetch-suggestions="suggestion"
        @keyup.enter.native="queryTopoData">
        <el-button slot="append" class="query-btn" icon="el-icon-search" size="mini" @click="queryTopoData"></el-button>
      </el-autocomplete>
      <span class="query-none-groupId" v-show="visibleErrorTip">该时间段内没有分组数据</span>
    </div>
    <!-- <div class="app-query-tool-item app-query-tool-regulation">
      <el-cascader
        :placeholder="$t('lang.selectCondition')"
        :options="options"
        v-model="regulationValue"
        :clearable="true"
        popper-class="select-popper"
        @change="locateNetWork"
        :disabled="isNonImported"
        size="mini"
      ></el-cascader>
    </div> -->
    <div class="query-expand" v-show="!isCheckNone">
      <el-switch v-model="status" inactive-color="#B4B4B4" @change="expand" :disabled="isNoneTopoData"></el-switch>
      {{$t('lang.preExpand')}}
      <el-input-number v-model="interval" class="expand-input" size="mini" controls-position="right" @change="handleChange" :min="1" :max="9" :disabled="!status"></el-input-number>
      {{$t('lang.pstExpand')}}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from 'vuex-class';
import { ruleOptions } from '@/util/config';
import bus from '@/util/bus';
import { EventType, AlarmData, Rules, AnalyzeRes, SelectOption, RCAResult, Node, Edge} from '@/types/type';
import { getAlarmDatas, getGroupIdsDataByInterval, getExpandAlarmDatas, getInterval } from '@/api/request';
import { generateUUID, generateDateByTimestamp } from '@/util/util';


@Component
export default class QueryTool extends Vue {
  @Provide() public groupId: string = "";
  @Provide() public regulationValue: (string | number)[] = [];
  @Provide() public visibleErrorTip: boolean = false;
  @Provide() public options: SelectOption[] = [];
  @Provide() public startTime: number = 0;
  @Provide() public endTime: number = 0;
  @Provide() public status: boolean = false;
  @Provide() public interval: number = 5;
  @Provide() public radioType: string = '1';
  @State((state) => state.app.isNoneTopoData) private isNoneTopoData!: boolean;
  @State((state) => state.project.groupIds) public groupIds!: string[];
  @State((state) => state.app.isNonImported) public isNonImported!:boolean;
  @State((state) => state.app.alarmDatas) public alarmDatas!: AlarmData[];
  @State((state) => state.app.topoDatas) private topoDatas!: {elements: Node[], edges: Edge[]};
  @State((state) => state.app.groupId) public store_groupId!: string;
  @State((state) => state.app.regValue) public store_regValue!: string;
  @State((state) => state.app.defaultDate) public defaultDate!: number[];
  @State((state) => state.app.needSave) public needSave!: boolean;
  @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;

  @Watch('defaultDate')
  public watchDefaultDate(val: number[]) {
    this.startTime = val[0];
    this.endTime = val[1];
    this.dateChange();
  }
  @Watch('store_groupId')
  public watchStoreGroupId(val: string) {
    if (this.groupId !== val) {
      this.groupId = val;
      if (this.groupId) {
        this.queryTopoData();
      }
    }
  }
  @Watch('alarmDatas')
  public watchAlarmDatas() {
    this.formatSelectOption();
  }
  @Watch('radioType')
  public watchRadioType(val: string) {
    this.$store.commit('SET_ISCHECKNONE', val === '2');
  }
  @Watch('isCheckNone')
  public watchIsCheckNone(val: boolean) {
    this.$store.commit('SET_SELECTALARM', '');
    getInterval({xAlarm: val}).then((res) => {
      debugger
      if (res.start === 0 && res.end === 0) {
        bus.$emit(EventType.ERRORVISIBLE, {
          title: 'Tip',
          content: '<p>There is no data.</p>',
          type: 'info'
        });
        this.groupId = '';
        this.$store.commit('SET_DEFAULTDATE', [0, 0]);
      } else {
        const dateValue = [res.start * 1000 - 8 * 3600 * 1000, res.end * 1000 - 8 * 3600 * 1000];
        this.$store.commit('SET_DEFAULTDATE', dateValue);
      }
    })
  }
  mounted() {
    this.options = ruleOptions;
    bus.$on(EventType.FILTERRESET, () => {
      this.regulationValue = [];
      this.$store.commit("SET_REGVALUE", '');
      this.$store.commit("SET_REGTYPE", '');
    });
  }
  public suggestion(val: string, cb: any) {
    const suggestions = this.groupIds.filter((id: string) => val ? id.toLowerCase().includes(val.toLowerCase()) : true)
      .map((id: string) => {
        return {value: id};
      });
    cb(suggestions);
  }
  public dateChange() {
    if (this.startTime && this.endTime) {
      if (this.endTime < this.startTime) {
        bus.$emit(EventType.ERRORVISIBLE, '<p>End time cannot be earlier than start time.</p>');
        return;
      }
      getGroupIdsDataByInterval({start: (this.startTime / 1000).toString(), end: (this.endTime / 1000).toString(), xAlarm: this.isCheckNone}).then((res) => {
        if (res) {
          const groupIds = res['group_id'].filter((groupId: string) => !!groupId);
          this.$store.commit('SET_GROUPIDS', groupIds);
          if (res['group_id'].length > 0) {
            this.visibleErrorTip = false;
            // if (!this.store_groupId) {
              // 初始化groupId
              this.$store.commit('SET_GROUPID', res['group_id'][0]);
            // }
          } else {
            this.visibleErrorTip = true;
          }
        }
      })
    }
  }
  public queryTopoData() {
    if (!this.groupId || !this.groupIds.includes(this.groupId)) {
      this.groupId = this.store_groupId;
      bus.$emit(EventType.ERRORVISIBLE, '<p>Invalid Group ID, please re-enter after querying.</p>');
      return;
    }
    if (this.needSave) {
      bus.$emit(EventType.ERRORVISIBLE, {
        title: 'Error',
        content: '<p>The current result is not saved. Are you sure you want to leave?</p>',
        confirmCallback: () => {
          this.$store.commit('SET_NEEDSAVE', false);
          this.doQuery();
        },
        saveCallback: () => {
          this.groupId = this.store_groupId;
          bus.$emit(EventType.SAVEDATA);
        },
        cancelCallback: () => {
          this.groupId = this.store_groupId;
        }
      });
    } else {
      this.doQuery();
    }
  }
  public doQuery() {
    this.regulationValue = [];
    this.$store.commit("SET_REGVALUE", '');
    this.$store.commit("SET_REGTYPE", '');
    bus.$emit(EventType.CLEARALL);
    this.status = false;
    this.interval = 5;
    getAlarmDatas({groupId: this.groupId, xAlarm: this.isCheckNone}).then((data: AnalyzeRes) => {
      this.setData(data);
    });
    this.$store.commit("SET_GROUPID", this.groupId);
    this.visibleErrorTip = !this.groupId;
  }
  public expand(val: boolean) {
    bus.$emit(EventType.FILTERRESET);
    if (val) {
      getExpandAlarmDatas({groupId: this.groupId, addTime: this.interval, xAlarm: this.isCheckNone}).then((res: AnalyzeRes) => {
        this.setData(res);
      });
    } else {
      this.queryTopoData();
    }
  }
  public setData(res: AnalyzeRes) {
    if (res.table) {
      this.$store.commit('SET_ISNONETABLEDATA', false);
      const alarmDatas = res.table.map((item: any) => this.formatData(item));
      this.$store.commit('SET_ALARMDATAS', alarmDatas);
    }
    if (res.topo) {
      this.$store.commit('SET_ISNONETOPODATA', false);
      const topoTreeData = res.topo.map((path: any) => {
        return path.map((node: any) => {
          const color = this.getElementColor(node.NEName);
          return { name: node.NEName, type: node.NEType, color, level: node.Layer };
        });
      });
      this.$store.commit('SET_TOPODATA', topoTreeData);
    }
  }
  public handleChange() {
    this.expand(true);
  }
  public getElementColor(name: string): string {
    if (this.alarmDatas.some((alarmData) => alarmData.alarmSourceName === name)) {
      return 'Warning';
    } else {
      return '';
    }
  }
  public locateNetWork() {
    if (this.groupId !== this.store_groupId) {
      this.groupId = this.store_groupId;
    }
    if (this.regulationValue.length < 2) {
      this.$store.commit("SET_REGVALUE", '');
      this.$store.commit("SET_REGTYPE", '');
      bus.$emit(EventType.RESETREDALARM);
    } else {
      this.$store.commit("SET_REGVALUE", this.regulationValue[1]);
      this.$store.commit("SET_REGTYPE", Rules[this.regulationValue[0] as number]);
      bus.$emit(EventType.NETWORKFILTER, this.filterAlarmData(this.alarmDatas));
    }
  }
  public filterAlarmData(alarmDatas: AlarmData[]): string[] {
    if (this.regulationValue.length < 2) return [];
    const rule: number = this.regulationValue[0] as number;
    const value: string = this.regulationValue[1] as string;
    return alarmDatas.filter((alarmData: AlarmData) => {
      if (rule === Rules.company) {
        return alarmData.company === value;
      } else if (rule === Rules.rcaReg) {
        return alarmData.rcaReg === value;
      } else if (rule === Rules.alarmName) {
        return alarmData.alarmName === value;
      } else if (rule === Rules.pAlarm) {
        return alarmData.alarmName === value && alarmData.rcaResult === RCAResult.P;
      } else if (rule === Rules.cAlarm) {
        return alarmData.alarmName === value && alarmData.rcaResult === RCAResult.C;
      }
    }).map((alarmData) => alarmData.alarmSourceName);
  }
  public formatData(item: any): AlarmData {
    return {
      uid: generateUUID(),
      index: item['Index'],
      alarmName: item['AlarmName'] || '',
      alarmSourceName: item['AlarmSource'] || '',
      company: item['Vendor'],
      firstTime: isNaN(item['First']) ? item['First'] : generateDateByTimestamp(item['First'] - 8 * 3600 * 1000),
      lastTime: item['Last'],
      level: item['Level'],
      clearTime: item['Clear'],
      domain: item['Domain'],
      groupId: item['GroupId'] || '',
      groupId_edit: item['GroupId_Edited'] || '',
      rcaResult: item['RcaResult'] || '',
      rcaResult_edit: item['RcaResult_Edited'] || '',
      rcaReg: item['RuleName'] || '',
      rcaReg_edit: item['RuleName_Edited'] || '',
      isConfirmed: !!item['Confirmed']
    };
  }
  public formatSelectOption() {
    const alarmDatas  = this.alarmDatas;
    this.options = [...ruleOptions];
    for (const parent of this.options) {
      let temp: string[] = []
      if (parent.value === Rules.company) {
        temp = alarmDatas.map((alarmData) => alarmData.company);
      } else if (parent.value === Rules.alarmName) {
        temp = alarmDatas.map((alarmData) => alarmData.alarmName);
      } else if (parent.value === Rules.rcaReg) {
        temp = alarmDatas.map((alarmData) => alarmData.rcaReg);
      } else if (parent.value === Rules.pAlarm) {
        temp = alarmDatas.filter((alarmData) => alarmData.rcaResult === RCAResult.P).map((alarmData) => alarmData.alarmName);
      } else if (parent.value === Rules.cAlarm) {
        temp = alarmDatas.filter((alarmData) => alarmData.rcaResult === RCAResult.C).map((alarmData) => alarmData.alarmName);
      }
      temp = [...new Set(temp)];
      const children = temp.map((name) => {
        return {label: name, value: name}
      })
      parent.children = children;
    }
  }
}
</script>
<style lang="scss">
$Btn_Background: linear-gradient(0deg, #f2f2f2 1%, #f7faff 100%);
.query-item {
  padding-left: 20px;
}
.app-query-tool {
  position: absolute;
  display: flex;
  width: 100%;
  padding: 10px 0 10px 20px;
  align-items: center;
  z-index: 5;
  user-select: none;
  background: #FFFFFF;
  box-sizing: border-box;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
  .app-query-tool-group-wrap {
    .query-btn {
      color: #FFF;
      background-color: #409EFF;
      border-color: #409EFF;
      border-radius: 0;
      &:active {
        color: #ddd;
        border-color: #399bff;
        background-color: #399bff;
      }
    }
    .el-input-group__append {
      border: 1px solid #409EFF;
      .el-input__inner {
        border-right: none;
      }
    }
  }
  .app-query-tool-group {
    width: 210px;
  }
  .app-query-tool-item {
    position: relative;
    &:not(:last-child) {
      padding-right: 10px;
    }
    &:not(:first-child) {
      padding-left: 10px;
    }
    .query-none-groupId {
      position: absolute;
      left: 20px;
      top: 28px;
      font-size: 12px;
      color: #e40303;
    }
  }
  .app-query-type-wrap {
    &:first-child {
      padding-right: 0;
    }
    line-height: 30px;
    border-right: 1px solid #DFDFDF;
    .el-radio {
      margin-right: 15px;
    }
  }
  .app-query-date-wrap {
    display: flex;
    .app-query-date {
      width: 175px;
      height: 30px;
      color: #778296;
      padding-right: 5px;
      .el-input__inner {
        padding-right: 0;
      }
      .el-range__close-icon {
        display: none;
      }
    }
  }
  .app-query-tool-regulation {
    display: flex;
    justify-content: space-between;
    .query-tool-reg-select {
      .el-input__inner {
        background-image: linear-gradient(to top, #f2f2f2, #f7faff);
      }
    }
    .el-input__inner {
      width: 190px;
    }
    .app-query-tool-reg {
      margin-left: 10px;
      width: 170px;
    }
  }
  .query-expand {
    position: absolute;
    right: 40px;
    font-size: 12px;
    .expand-input {
      width: 60px;
      .el-input__inner {
        padding-left: 10px;
        padding-right: 40px;
      }
    }
  }
}
.select-popper .el-cascader-menu {
  max-width: 160px;
}
</style>
