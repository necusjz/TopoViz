<template>
  <el-pagination
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
    :current-page="currentPage"
    :page-sizes="pageSizes"
    :page-size="10"
    layout="total, sizes, prev, pager, next, jumper"
    :total="400"
  ></el-pagination>
</template>

<script lang="ts">
import { Component, Vue, Provide } from "vue-property-decorator";

@Component
export default class TopoTablePagination extends Vue {
    @Provide() private currentPage: number = 1;
    @Provide() private pageSizes: number[] = [5, 10, 15];
    public handleSizeChange(size: number) {
        console.log(`每页${size}条数据`);
    }
    public handleCurrentChange(page: number) {
        console.log(`当前页: ${page}页`);
    }
}
</script>
