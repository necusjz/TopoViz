<template>
  <div class="statics-table">
    <el-row class="statics-table-row">
      <el-col :span="12" class="rightBorder">未确认</el-col>
      <el-col :span="12">已确认</el-col>
    </el-row>
    <el-row class="statics-table-row">
      <el-col :span="12" class="leftAlign rightBorder">Group ID</el-col>
      <el-col :span="12" class="leftAlign">Group ID</el-col>
    </el-row>
    <el-scrollbar :native="false" wrapClass="statics-table-scroll-wrap" viewClass="" :noresize="false" class="statics-table-scroll">
      <div class="statics-sub-table">
        <div class="statics-left-subtable sub">
          <SubTable :tableData="unconfirmData"></SubTable>
        </div>
        <div class="statics-right-subtable sub">
          <SubTable :tableData="confirmData"></SubTable>
        </div>
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
    @State((state) => state.app.alarmDatas) private alarmDatas: any;
    created() {
      getStaticsGroupData().then((res) => {
        if (res) {
          this.confirmData = res.confirmed;
          this.unconfirmData = res.unconfirmed;
        }
      });
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
$Gray-border: 1px solid #f8f9ff;
.statics-table {
  height: calc(100vh - 200px);
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 0 0 rgba(186, 186, 186, 0.5);
  background-color: #ffffff;
  .statics-table-row {
    line-height: 60px;
    box-sizing: border-box;
    border-bottom: $Gray-border;
    .leftAlign {
      text-align: left;
      padding-left: 20px;
    }
  }
  .statics-sub-table {
    display: flex;
    background: #FFFFFF;
    .sub {
        flex: 1;
    }
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
