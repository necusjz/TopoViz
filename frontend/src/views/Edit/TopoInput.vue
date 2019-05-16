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
import { checkId } from '@/api/request';
import { EventType } from '@/types/type';
import bus from '@/util/bus';

@Component
export default class TopoInput extends Vue {
  @Prop() private row!: any;
  @Prop() private attr!: string;
  @Provide() private inputValue: string = "";
  @State((state) => state.app.isCheckNone) private isCheckNone!: boolean;
  mounted() {
    this.inputValue = this.row[this.attr] || '';
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
    let validStr: string = this.inputValue.trim();
    if (validStr === this.row[this.attr]) {
      this.$emit("blur");
    } else if (this.isCheckNone && this.attr === 'groupId_edit') {
      if (!validStr) {
        this.$emit('blur');
      } else {
        validStr = `EXTRA_${validStr}`;
        checkId(validStr).then((res) => {
          if (res && !res.exist) {
            this.row[this.attr] = validStr;
            this.$emit("blur", this.row);
          } else {
            bus.$emit(EventType.ERRORVISIBLE, {
              title: 'Error',
              type: 'error',
              content: `<p>The Group ID you entered already exists.</p>`
            });
            this.$emit("blur");
          }
        })
      }
    } else {
      this.row[this.attr] = validStr;
      this.$emit("blur", this.row);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
</style>
