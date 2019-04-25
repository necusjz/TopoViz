<template>
  <div class="sub-table">
      <el-row class="sub-table-row body-item" v-for="(groupId, index) in tableData" :key="index">
        <el-col :span="24" class="leftAlign rightBorder bottomBorder" @click.native="viewGroup(groupId)">{{groupId}}</el-col>
      </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class SubTable extends Vue {
  @Prop() tableData!: string[];
  public viewGroup(groupId: string) {
    this.$store.commit('SET_ISCHECKSTATICS', false);
    this.$store.commit('SET_GROUPID', groupId);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$Gray-border: 1px solid #f8f9ff;
.sub-table {
  box-shadow: 0 0 6px 0 rgba(186, 186, 186, 0);
  .sub-table-row {
    line-height: 60px;
    border-bottom: $Gray-border;
    box-sizing: border-box;
    text-align: center;
    .leftAlign {
      text-align: left;
      padding-left: 20px;
    }
    &.body-item {
      cursor: pointer;
      &:hover {
        color: #319efa;
        background-color: #d2ecff;
      }
    }
  }
}
</style>
