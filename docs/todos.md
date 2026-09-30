---
title: GitHub TODO Tree
---

<TodoDashboard />

<script setup lang="ts">
import TodoDashboard from "./.vitepress/theme/components/TodoDashboard.vue";
</script>

<style>
/* TODO Explorer 是应用型页面，占满首屏；隐藏文档页的 changelog / footer / 文章更新等区域，避免页面级双滚动 */
.vp-doc > div > .todo-dashboard ~ *,
.VPDocFooter,
.tk-article-update {
	display: none !important;
}
</style>
