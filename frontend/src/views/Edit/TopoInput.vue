<template>
  <el-input
    size="mini"
    v-model="inputValue"
    ref="editInput"
    @blur="emitData"
    @keyup.enter.native="enter"
  ></el-input>
</template>

<script lang="ts">
import { Component, Prop, Vue, Provide } from "vue-property-decorator";
import { State } from "vuex-class";
@Component
export default class TopoInput extends Vue {
  @Prop() private row!: any;
  @Prop() private attr!: string;
  @Provide() private inputValue: string = "";
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
    const validStr: string = this.inputValue.trim();
    this.row[this.attr] = validStr;
    this.$emit("blur", this.row);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
</style>
