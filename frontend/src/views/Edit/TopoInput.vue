<template>
  <el-input
    size="mini"
    v-model="inputValue"
    ref="editInput"
    :clearable="true"
    @blur="emitData"
    @keyup.enter.native="enter"
  ></el-input>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { State } from "vuex-class";
import { checkId } from '@/api/request';

@Component
export default class TopoInput extends Vue {
  @Prop() private row!: any;
  @Prop() private attr!: string;
  @Provide() private inputValue: string = "";
  @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;
  mounted() {
    this.inputValue = this.row[this.attr];
    this.$nextTick(() => {
      const inputCom: any = this.$refs.editInput;
      inputCom.focus();
    });
  }
  public enter() {
    const inputCom: any = this.$refs.editInput;
    inputCom.blur();
  }
  public emitData() {
    // 校验输入的数据
    setTimeout(() => {
      let validStr: string = this.inputValue.trim();
      if (validStr === this.row[this.attr]) {
        this.$emit("blur");
      } else if (this.isCheckNone && this.attr === 'groupId_edit') {
        if (!validStr) {
          this.$emit('blur');
        } else {
          validStr = `TOPO_TREE_${validStr}`;
          checkId(validStr).then((res) => {
            if (res && !res.exist) {
              this.row[this.attr] = validStr;
              this.$emit("blur", this.row);
            }
          })
        }
      } else {
        this.row[this.attr] = validStr;
        this.$emit("blur", this.row);
      }
    }, 200);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
</style>
