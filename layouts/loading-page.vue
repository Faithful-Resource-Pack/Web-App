<template>
	<div class="d-flex flex-column align-center justify-center flex-grow-1 py-5" style="height: 100%">
		<slot name="logo">
			<v-progress-circular :size="150" :width="10" indeterminate />
		</slot>
		<p class="text-h6 text-center mt-10 mb-0">
			<slot>{{ $root.lang().global.loading }}</slot>
		</p>
		<slot name="actions" />
	</div>
</template>

<script>
// really handy since a lot of pages don't function until a request is processed
// in general skeletons are used for placeholder content but this also works pretty well
export default {
	name: "loading-page",
};
</script>
