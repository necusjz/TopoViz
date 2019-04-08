<template>
  <div class="app-query-wrap">
    <div class="app-query-title">查询条件</div>
    <div class="app-query-tool">
      <div class="app-query-tool-item">
        <el-autocomplete
          placeholder="请输入Group ID"
          suffix-icon="el-icon-search"
          v-model="groupId"
          size="small"
          class="app-query-tool-group"
          :class="{'error-border-input': visibleErrorTip}"
          :fetch-suggestions="suggestion"
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
          v-show="regulationType !== ''">
        </el-input>
      </div>
      <div class="app-query-tool-item">
        <el-button size="small" type="primary" class=" confirm-btn" :class="{'none-status': !isImported || (!groupId && !regulationValue)}"
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
import { VisibleType, AlarmData, Rules, AnalyzeRes } from '@/types/type';
import TableData from "@/util/tableData.json";
import { getAlarmDatas } from '@/api/request';
import { generateUUID, generateDateByTimestamp } from '@/util/util';

@Component
export default class QueryTool extends Vue {
  @Provide() private groupId: string = "";
  @Provide() private regulationType: string = "";
  @Provide() private regulationValue: string = "";
  @Provide() private visibleErrorTip: boolean = false;
  @Provide() private options: { label: string; value: number }[] = [];
  @State((state) => state.project.groupIds) private groupIds!: string[];
  @State((state) => state.app.isImported) private isImported!:boolean;
  @Watch('groupId')
  public watchGroupId(val: string) {
    if (val && !this.visibleErrorTip) {
      this.visibleErrorTip = false;
    }
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
  public queryTopoData() {
    if (!this.isImported) {
      bus.$emit(VisibleType.ERRORVISIBLE, '<p>请上传数据后再查询!</p>');
      return;
    }
    this.$store.commit("SET_GROUPID", this.groupId);
    this.$store.commit("SET_REGVALUE", this.regulationValue);
    const inde: any = this.regulationType;
    this.$store.commit("SET_REGTYPE", Rules[inde]);
    this.visibleErrorTip = !this.groupId;
    this.$store.commit('SET_ISNONEDATA', !this.groupId);
    if (!this.groupId) {
      this.visibleErrorTip = true;
    }
    getAlarmDatas({groupId: this.groupId, addCondition: inde, addValue: this.regulationValue}).then((data: AnalyzeRes) => {
      const table = data.table;
      if (table) {
        const alarmdatas: AlarmData[] = table.map((item: any) => {
          return this.formatData(item);
        })
        this.$store.commit('SET_ALARMDATAS', alarmdatas);
      }
    });
    // bus.$emit(VisibleType.ERRORVISIBLE, '<p>无效的<span class="blue-text">Group ID</span>, 请查询后重新输入</p>');
    // bus.$emit(VisibleType.ERRORVISIBLE, '<p>一组Group ID的数据中至少包含一个P告警哦，请查询后再编辑。</p>');
  }
  public formatData(item: any): AlarmData {
    return {
      uid: generateUUID(),
      alarmName: item['Alarm Name'],
      alarmSourceName: item['Alarm Source'],
      company: item['Vendor'],
      firstTime: generateDateByTimestamp(item['First Occurrence']),
      lastTime: item['Last Occurrence'],
      level: item['Raw Severity'],
      clearTime: item['Cleared On'],
      domain: item['Domain'],
      Group_ID: item['RCA Group ID'],
      RCA_result: item['RCA Result'].toString(),
      RCA_reg: item['RCA Rule Name'],
      isConfirmed: false
    };
  }
}
</script>
<style lang="scss">
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