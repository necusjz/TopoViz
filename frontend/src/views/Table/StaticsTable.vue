<template>
  <div class="statics-table">
    <el-row class="statics-table-row">
      <div class="statics-table-tabs" v-show="!isCheckNone">
        <div class="statics-tab" :class="{active: activeType === 0}" @click="switchTab(0)">
          <span class="statics-tab-content">未确认 {{this.unconfirmData.length}}</span>
        </div>
        <div class="statics-tab" :class="{active: activeType === 1}" @click="switchTab(1)">
          <span class="statics-tab-content">已确认 {{this.confirmData.length}}</span>
        </div>
      </div>
      <el-button type="primary" size="mini" class="statics-confirm-btn">一键确认</el-button>
    </el-row>
    <el-scrollbar :native="false" wrapClass="statics-table-scroll-wrap" viewClass="" :noresize="false" class="statics-table-scroll">
      <div class="statics-sub-table">
        <SubTable :tableData="tableData" :wrong="wrongData"></SubTable>
      </div>
    </el-scrollbar>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import SubTable from "./SubTable.vue";
import { AlarmData, StaticsRes } from '@/types/type';
import { getStaticsGroupData } from '@/api/request';

@Component({
  components: {
    SubTable
  }
})
export default class StaticsTable extends Vue {
    @Provide() private confirmData: string[] = [];
    @Provide() private unconfirmData: string[] = [];
    @Provide() private tableData: string[] = [];
    @Provide() private activeType: number = 0;
    @Provide() private wrongData: string[] = [];
    @State((state) => state.app.alarmDatas) private alarmDatas!: AlarmData[];
    @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;
    @State((state) => state.app.isNonImported) private isNonImported!: boolean;
    created() {
      if (!this.isNonImported) {
        getStaticsGroupData({xAlarm: this.isCheckNone}).then((res) => {
          if (res) {
            this.confirmData = res.confirmed;
            this.unconfirmData = res.unconfirmed;
            this.wrongData = res.wrong;
            if (this.isCheckNone) {
              this.tableData = res.alarm_tree;
            } else {
              this.tableData = this.unconfirmData;
            }
          }
        });
      }
    }
    public switchTab(type: number) {
      this.activeType = type;
      this.tableData = this.activeType ? this.confirmData : this.unconfirmData;
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
$Gray-border: 1px solid #f8f9ff;
.statics-table {
  height: calc(100vh - 200px);
  margin-top: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 0 0 rgba(186, 186, 186, 0.5);
  background-color: #ffffff;
  .statics-table-row {
    height: 60px;
    line-height: 60px;
    box-sizing: border-box;
    border-bottom: $Gray-border;
    .statics-table-tabs {
      display: flex;
      padding-left: 10px;
      .statics-tab {
        position: relative;
        cursor: pointer;
        &.active {
          color: #338AFF;
          font-weight: 500;
        }
        &.active:after {
          content: '';
          height: 3px;
          width: 100%;
          display: inline-block;
          background: #338AFF;
          position: absolute;
          left: 0;
          bottom: 0;
        }
      }
      .statics-tab-content {
        padding: 0 35px;
      }
    }
    .statics-confirm-btn {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
    }
    .leftAlign {
      text-align: left;
      padding-left: 20px;
    }
  }
  .statics-sub-table {
    display: flex;
    background: #FFFFFF;
  }
  .statics-left-subtable {
    border-right: $Gray-border;
  }
  .statics-table-scroll {
    height: 100%;
    background: #f8f9ff;
    .el-scrollbar__thumb {
      background-color: rgba(144,147,153,.1);
    }
  }
  .statics-table-scroll-wrap {
    height: 100%;
    overflow-x: hidden;
  }
}
</style>
