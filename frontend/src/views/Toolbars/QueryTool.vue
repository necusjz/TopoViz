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
          :default-time="['12:00:00']"
          value-format="timestamp"
          :clearable="false"
          @change="dateChange"
          size="small"
        ></el-date-picker>
      </div>
      <div class="app-query-tool-item app-query-tool-group-wrap">
        <el-autocomplete
          placeholder="请输入Group ID"
          suffix-icon="el-icon-search"
          v-model="groupId"
          size="small"
          class="app-query-tool-group"
          :class="{'error-border-input': visibleErrorTip}"
          :fetch-suggestions="suggestion"
          @focus="clearErrorTip"
          @keyup.enter.native="queryTopoData">
        </el-autocomplete>
        <span class="query-none-groupId" v-show="visibleErrorTip">注意: 请输入Group ID方可查看topo图</span>
      </div>
      <div class="app-query-tool-item app-query-tool-regulation">
        <el-select
          v-model="regulationType"
          class="query-tool-reg-select"
          placeholder="请选择相关查询信息"
          size="small">
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
        <el-input
          placeholder="请输入"
          v-model="regulationValue"
          size="small"
          class="app-query-tool-reg"
          v-if="!this.groupId && regulationType !== ''">
        </el-input>
        <el-autocomplete
          placeholder="请输入"
          v-model="regulationValue"
          size="small"
          class="app-query-tool-reg"
          :fetch-suggestions="suggestion1"
          v-else-if="regulationType !== ''">
        </el-autocomplete>
      </div>
      <div class="app-query-tool-item">
        <el-button size="small" type="primary" class=" confirm-btn" :class="{'none-status': isNonImported || (!groupId && !regulationValue)}"
          @click="queryTopoData">查看</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from 'vuex-class';
import { ruleOptions } from '@/util/config';
import bus from '@/util/bus';
import { EventType, AlarmData, Rules, AnalyzeRes } from '@/types/type';
import TableData from "@/util/tableData.json";
import { getAlarmDatas, getGroupIdsDataByInterval } from '@/api/request';
import { generateUUID, generateDateByTimestamp } from '@/util/util';

@Component
export default class QueryTool extends Vue {
  @Provide() private groupId: string = "";
  @Provide() private regulationType: string = "";
  @Provide() private regulationValue: string = "";
  @Provide() private visibleErrorTip: boolean = false;
  @Provide() private options: { label: string; value: number }[] = [];
  @Provide() private dateValue: number[] = [];
  @State((state) => state.project.groupIds) private groupIds!: string[];
  @State((state) => state.app.isNonImported) private isNonImported!:boolean;
  @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
  @State((state) => state.app.groupId) private store_groupId!: string;
  @State((state) => state.app.regValue) private store_regValue!: string;
  @State((state) => state.app.defaultDate) private defaultDate!: number[];
  @Watch('groupId')
  public watchGroupId(val: string) {
    if (val && !this.visibleErrorTip) {
      this.visibleErrorTip = false;
    }
    this.regulationType = '';
  }
  @Watch('defaultDate')
  public watchDefaultDate(val: number[]) {
    this.dateValue = this.defaultDate;
    this.dateChange(val);
  }
  mounted() {
    this.options = ruleOptions;
  }
  public suggestion(val: string, cb: any) {
    const suggestions = this.groupIds.filter((id: string) => val ? id.toLowerCase().includes(val.toLowerCase()) : true)
      .map((id: string) => {
        return {value: id};
      });
    cb(suggestions);
  }
  public suggestion1(val: string, cb: any) {
    if (this.groupId && this.groupId === this.store_groupId && this.regulationType !== '') {
      const index: any = this.regulationType;
      let res: string[] = [];
      for (const alarmData of this.alarmDatas) {
        if (index === Rules.pAlarm && alarmData.rcaResult === '1') {
          res.push(alarmData.alarmName);
        } else if (index === Rules.cAlarm && alarmData.rcaResult === '2') {
          res.push(alarmData.alarmName);
        } else {
          res.push(alarmData[Rules[index]]);
        }
      }
      const result: {value: string}[] = Array.from(new Set(res)).map((str: string) => {
        return {value: str};
      })
      cb(result);
    } else {
      cb([]);
    }
  }
  public dateChange(value: number[]) {
    getGroupIdsDataByInterval({start: (value[0] / 1000).toString(), end: (value[1] / 1000).toString()}).then((res) => {
      this.$store.commit('SET_GROUPIDS', res['group_id']);
    })
  }
  public queryTopoData() {
    if (this.isNonImported) {
      bus.$emit(EventType.ERRORVISIBLE, '<p>请上传数据后再查询!</p>');
      return;
    }
    if (!this.groupId && !this.regulationValue) {
      return;
    }
    const index: any = this.regulationType;
    // 前后两次查询groupId一致时，拦截请求
    if (this.groupId === this.store_groupId) {
      const alarmDatas = this.filterAlarmData();
      bus.$emit('NETWORKFILTER', alarmDatas.map((alarmData) => alarmData.alarmSourceName));
    } else {
      getAlarmDatas({groupId: this.groupId}).then((data: AnalyzeRes) => {
        const table = JSON.parse(data.table);
        // data.topo.push([{NEName: "DJLKE 3E - GJKLEW GJLEW", NEType: "MicroWave"}, {NEName: "DJLKE 3E - GJKLEW GJLEW1", NEType: "nodeB"}])
        const topoTreeData = data.topo.map((path: any) => {
          return path.reverse().map((node: any) => {
            return { name: node.NEName, type: node.NEType };
          });
        });
        this.$store.commit('SET_TOPODATA', topoTreeData);
        if (table) {
          const alarmDatas: AlarmData[] = table.map((item: any) => {
            return this.formatData(item);
          })
          this.$store.commit('SET_ALARMDATAS', alarmDatas);
        }
      });
    }
    this.$store.commit("SET_GROUPID", this.groupId);
    this.$store.commit("SET_REGVALUE", this.regulationValue);
    this.$store.commit("SET_REGTYPE", Rules[index]);
    this.visibleErrorTip = !this.groupId;
    this.$store.commit('SET_ISNONEDATA', !this.groupId);
    if (!this.groupId) {
      this.visibleErrorTip = true;
    }
    // bus.$emit(EventType.ERRORVISIBLE, '<p>无效的<span class="blue-text">Group ID</span>, 请查询后重新输入</p>');
    // bus.$emit(EventType.ERRORVISIBLE, '<p>一组Group ID的数据中至少包含一个P告警哦，请查询后再编辑。</p>');
  }
  public filterAlarmData(): AlarmData[] {
    const index: any = this.regulationType;
    const queryValue: string = this.regulationValue;
    return this.alarmDatas.filter((alarmData: AlarmData) => {
      if (index === Rules.company) {
        return alarmData.company === queryValue;
      } else if (index === Rules.rcaReg) {
        return alarmData.rcaReg === queryValue;
      } else if (index === Rules.alarmName) {
        return alarmData.alarmName === queryValue;
      } else if (index === Rules.pAlarm) {
        return alarmData.alarmName === queryValue && alarmData.rcaResult === '1';
      } else if (index === Rules.cAlarm) {
        return alarmData.alarmName === queryValue && alarmData.rcaResult === '2';
      }
    });
  }
  public formatData(item: any): AlarmData {
    return {
      uid: generateUUID(),
      index: item['Index'],
      alarmName: item['Alarm Name'],
      alarmSourceName: item['Alarm Source'],
      company: item['Vendor'],
      firstTime: generateDateByTimestamp(item['First Occurrence']),
      lastTime: item['Last Occurrence'],
      level: item['Raw Severity'],
      clearTime: item['Cleared On'],
      domain: item['Domain'],
      Group_ID: item['RCA Group ID'],
      rcaResult: item['RCA Result'].toString(),
      rcaReg: item['RCA Rule Name'],
      isConfirmed: false
    };
  }
  public clearErrorTip() {
    this.visibleErrorTip = false;
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
        left: 0;
        top: 28px;
        font-size: 12px;
        color: #bf0000;
      }
    }
    .app-query-date-wrap {
      border-right: 1px solid #dfdfdf;
      .app-query-date {
        width: 300px;
        height: 30px;
        background-image: $Btn_Background;
        color: #778296;
        cursor: pointer;
        padding-right: 5px;
        .el-range-input {
          background-image: $Btn_Background;
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
</style>