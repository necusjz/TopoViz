<template>
  <div class="sub-table">
      <el-row class="sub-table-row">
          <el-col :span="12" class="left">Group ID</el-col>
          <el-col :span="12">精准率</el-col>
      </el-row>
      <el-row class="sub-table-row" v-for="(rowData, index) in tableData" :key="index">
        <el-col :span="12" class="left">{{rowData.groupId}}</el-col>
        <el-col :span="12">{{rowData.precision}}</el-col>
      </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

interface RowData {
  groupId: string;
  precision: string;
}
@Component
export default class SubTable extends Vue {
  @Prop() tableData!: RowData[];
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$Gray-border: 1px solid #f8f9ff;
.sub-table {
  .sub-table-row {
    line-height: 60px;
    border-bottom: $Gray-border;
    box-sizing: border-box;
    text-align: center;
    .left {
      text-align: left;
      padding-left: 20px;
    }
    &:hover {
      color: #319efa;
      background-color: #d2ecff;
    }
    
  }
}
</style>
