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
          @blur="inputBlur"
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
          v-show="regulationType">
        </el-input>
      </div>
      <div class="app-query-tool-item">
        <el-button size="small" type="primary" class="confirm-btn" :class="{'none-status': !groupId && !regulationValue}"
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
import { VisibleType, AlarmData, Rules } from '@/types/type';
import TableData from "@/util/tableData.json";

@Component
export default class QueryTool extends Vue {
  @Provide() private groupId: string = "";
  @Provide() private regulationType: string = "";
  @Provide() private regulationValue: string = "";
  @Provide() private visibleErrorTip: boolean = false;
  @Provide() private options: { label: string; value: string }[] = [];
  @State((state) => state.app.alarmDatas) private alarmDatas: any;
  @State((state) => state.app.tableData) private tableData!: AlarmData[];
  mounted() {
    this.options = ruleOptions;
  }
  public suggestion(val: string, cb: any) {
    let suggestions = [];
    if (val) {
      suggestions = this.tableData.filter((alarmData: AlarmData) => alarmData.Group_ID.toLowerCase().includes(val.toLowerCase()))
                        .map((alarmData: AlarmData) => {
                          return {value: alarmData.Group_ID};
                        });
    } else {
      suggestions = this.tableData.map((alarmData: AlarmData) => {
        return {value: alarmData.Group_ID};
      }); 
    }
    cb(suggestions);
  }
  public inputBlur() {
    if (!this.groupId) {
      this.visibleErrorTip = true;
    }
  }
  public queryTopoData() {
    this.$store.commit("SET_GROUPID", this.groupId);
    this.$store.commit("SET_REGVALUE", this.regulationValue);
    const inde: any = this.regulationType.toUpperCase();
    this.$store.commit("SET_REGTYPE", Rules[inde]);
    this.visibleErrorTip = !this.groupId;
    this.$store.commit('SET_ISNONEDATA', !this.groupId);
    // bus.$emit(VisibleType.ERRORVISIBLE, '<p>无效的<span class="blue-text">Group ID</span>, 请查询后重新输入</p>');
    // bus.$emit(VisibleType.ERRORVISIBLE, '<p>一组Group ID的数据中至少包含一个P告警哦，请查询后再编辑。</p>');
    const tabData: AlarmData[] = [];
    const len: number = Math.floor(Math.random() * 500);
    for (let i = 2; i < len; i++) {
      tabData[i - 2] = { ...TableData[0], alarmName: `X0934_RTN950-0${i}`, Group_ID: `POS_32480${i}`, isConfirmed: Math.random() > 0.5};
    }
    this.$store.commit('SET_ALARMDATAS', tabData);
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

ß