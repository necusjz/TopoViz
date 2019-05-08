<template>
  <div class="sub-table">
    <el-row class="sub-table-row">
      <el-col :span="12" class="leftAlign bottomBorder body-item" :class="getClass(groupId)" v-for="(groupId, index) in tableData" :key="index" @click.native="viewGroup(groupId)">{{groupId}}</el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide, Watch } from "vue-property-decorator";
import { State } from "vuex-class";

@Component
export default class SubTable extends Vue {
  @Prop() tableData!: string[];
  @Prop() wrong!: string[];
  public viewGroup(groupId: string) {
    this.$store.commit('SET_ISCHECKSTATICS', false);
    this.$store.commit('SET_GROUPID', groupId);
  }
  public getClass(groupId: string) {
    return this.wrong.includes(groupId) ? 'wrong' : '';
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$Gray-border: 1px solid #f8f9ff;
.sub-table {
  width: 100%;
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
    .body-item {
      cursor: pointer;
      &:hover {
        color: #319efa;
        background-color: #d2ecff;
      }
      &:nth-child(odd) {
        border-right: $Gray-border;
      }
    }
    .wrong {
      background: #FFF5F5;
      color: #FF8484;
    }
  }
}
</style>
