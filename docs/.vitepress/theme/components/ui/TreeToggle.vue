<script setup lang="ts">
import { Primitive } from "reka-ui";
import { ChevronRight } from "lucide-vue-next";

defineProps<{ expanded: boolean; label: string }>();
</script>

<template>
	<Primitive
		as="button"
		type="button"
		class="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 max-[720px]:size-8"
		:aria-expanded="expanded"
		:aria-label="label"
	>
		<ChevronRight
			class="size-3.5 transition-transform"
			:class="{ 'rotate-90': expanded }"
			:stroke-width="2"
			aria-hidden="true"
		/>
	</Primitive>
</template>
