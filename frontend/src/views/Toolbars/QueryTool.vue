<template>
  <div class="app-query-wrap">
    <div class="app-query-title">查询条件</div>
    <div class="app-query-tool">
      <div class="app-query-tool-item app-query-date-wrap">
        <el-date-picker
          v-model="dateValue"
          type="datetimerange"
          class="app-query-date"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="['00:00:00']"
          value-format="timestamp"
          range-separator="--"
          :clearable="false"
          :disabled="isNonImported"
          @change="dateChange"
          size="small"
        ></el-date-picker>
      </div>
      <div class="app-query-tool-item app-query-tool-group-wrap">
        <el-autocomplete
          placeholder="请输入Group ID"
          v-model="groupId"
          size="small"
          class="app-query-tool-group"
          :class="{'error-border-input': visibleErrorTip}"
          :fetch-suggestions="suggestion"
          @select="updateCurGroupId"
          @keyup.enter.native="queryTopoData">
          <el-button slot="append" class="query-btn" icon="el-icon-search" size="small" @click="queryTopoData"></el-button>
        </el-autocomplete>
        <span class="query-none-groupId" v-show="visibleErrorTip">该时间段内没有分组数据</span>
      </div>
      <div class="app-query-tool-item app-query-tool-regulation">
        <el-cascader
          :options="options"
          v-model="regulationValue"
          :clearable="true"
          popper-class="select-popper"
          @change="locateNetWork"
          size="small"
        ></el-cascader>
      </div>
      <!-- <div class="app-query-tool-item">
        <el-button size="small" type="primary" class=" confirm-btn" :class="{'none-status': isNonImported || (!groupId && !regulationValue)}"
          @click="queryTopoData">查看</el-button>
      </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from 'vuex-class';
import { ruleOptions } from '@/util/config';
import bus from '@/util/bus';
import { EventType, AlarmData, Rules, AnalyzeRes, SelectOption, RCAResult} from '@/types/type';
import TableData from "@/util/tableData.json";
import { getAlarmDatas, getGroupIdsDataByInterval } from '@/api/request';
import { generateUUID, generateDateByTimestamp } from '@/util/util';


@Component
export default class QueryTool extends Vue {
  @Provide() private groupId: string = "";
  @Provide() private regulationValue: (string | number)[] = [];
  @Provide() private visibleErrorTip: boolean = false;
  @Provide() private options: SelectOption[] = [];
  @Provide() private dateValue: number[] = [];
  @State((state) => state.project.groupIds) private groupIds!: string[];
  @State((state) => state.app.isNonImported) private isNonImported!:boolean;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.groupId) private store_groupId!: string;
  @State((state) => state.app.regValue) private store_regValue!: string;
  @State((state) => state.app.defaultDate) private defaultDate!: number[];
  @Watch('defaultDate')
  public watchDefaultDate(val: number[]) {
    this.dateValue = this.defaultDate;
    this.dateChange(val);
  }
  @Watch('store_groupId')
  public watchStoreGroupId(val: string) {
    if (val && this.groupId !== val) {
      this.groupId = val;
      this.queryTopoData();
    }
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
  public updateCurGroupId() {
    getAlarmDatas({groupId: this.groupId}).then((res: any) => {
      if (res.table) {
        const alarmDatas: AlarmData[] = res.table.map((item: any) => this.formatData(item));
        this.formatSelectOption(alarmDatas);
      }
    });
  }
  public dateChange(value: number[]) {
    getGroupIdsDataByInterval({start: (value[0] / 1000).toString(), end: (value[1] / 1000).toString()}).then((res) => {
      if (res) {
        this.$store.commit('SET_GROUPIDS', res['group_id']);
        if (res['group_id'].length > 0) {
          this.visibleErrorTip = false;
          if (!this.store_groupId) {
            // 初始化groupId
            this.$store.commit('SET_GROUPID', res['group_id'][0]);
          }
        } else {
          this.visibleErrorTip = true;
        }
      }
    })
  }
  public queryTopoData() {
    if (!this.groupId || !this.groupIds.includes(this.groupId)) {
      this.groupId = this.store_groupId;
      bus.$emit(EventType.ERRORVISIBLE, '<p>无效的<span class="blue-text">Group ID</span>, 请查询后重新输入</p>');
      return;
    }
    this.regulationValue = [];
    this.$store.commit("SET_REGVALUE", '');
    this.$store.commit("SET_REGTYPE", '');
    getAlarmDatas({groupId: this.groupId}).then((data: AnalyzeRes) => {
      const table = data.table;
      const topoData = data.topo;
      if (topoData && topoData.length > 0) {
        this.$store.commit('SET_ISNONETOPODATA', false);
        const topoTreeData = data.topo.map((path: any) => {
          return path.reverse().map((node: any) => {
            return { name: node.NEName, type: node.NEType };
          });
        });
        this.$store.commit('SET_TOPODATA', topoTreeData);
      }
      if (table && table.length > 0) {
        this.$store.commit('SET_ISNONETABLEDATA', false);
        const alarmDatas: AlarmData[] = table.map((item: any) => {
          return this.formatData(item);
        })
        this.$store.commit('SET_ALARMDATAS', alarmDatas);
        this.formatSelectOption(alarmDatas);
      }
    });
    this.$store.commit("SET_GROUPID", this.groupId);
    this.visibleErrorTip = !this.groupId;
    // bus.$emit(EventType.ERRORVISIBLE, '<p>一组Group ID的数据中至少包含一个P告警哦，请查询后再编辑。</p>');
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
      alarmName: item['AlarmName'],
      alarmSourceName: item['AlarmSource'],
      company: item['Vendor'],
      firstTime: generateDateByTimestamp(item['First']),
      lastTime: item['Last'],
      level: item['Level'],
      clearTime: item['Clear'],
      domain: item['Domain'],
      groupId: item['GroupId'],
      groupId_edit: item['GroupId_Edited'],
      rcaResult: item['RcaResult'].toString(),
      rcaResult_edit: item['RcaResult_Edited'],
      rcaReg: item['RuleName'],
      rcaReg_edit: item['RuleName_Edited'],
      isConfirmed: !!item['Confirmed']
    };
  }
  public formatSelectOption(alarmDatas: AlarmData[]) {
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
.app-query-wrap {
  background: #fff;
  box-shadow: 0 4px 6px 0 rgba(186, 186, 186, 0.5);
  border-radius: 8px;
  .app-query-title {
    text-align: left;
    font-size: 16px;
    color: #282828;
    line-height: 40px;
    border-bottom: 1px solid #dfdfdf;
    @extend .query-item;
  }
  .app-query-tool {
    display: flex;
    padding: 20px;
    padding-right: 0;
    .app-query-tool-group-wrap {
      padding-left: 20px;
      .query-btn:active {
        color: #b3d8ff;
      }
    }
    .app-query-tool-group {
      width: 220px;
    }
    .app-query-tool-item {
      position: relative;
      line-height: 30px;
      &:not(:last-child) {
        padding-right: 20px;
      }
      .query-none-groupId {
        position: absolute;
        left: 20px;
        top: 28px;
        font-size: 12px;
        color: #e40303;
      }
    }
    .app-query-date-wrap {
      border-right: 1px solid #dfdfdf;
      .app-query-date {
        width: 370px;
        height: 30px;
        background-image: $Btn_Background;
        color: #778296;
        padding-right: 5px;
        .el-range-input {
          background-image: $Btn_Background;
          cursor: pointer;
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
      .app-query-tool-reg {
        margin-left: 10px;
        width: 170px;
      }
    }
  }
}
.select-popper .el-cascader-menu {
  max-width: 160px;
}
</style>