<template>
	<div class="d-flex flex-column align-center justify-center flex-grow-1 my-5" style="height: 100%">
		<v-progress-circular :size="150" :width="10" indeterminate />
		<p class="text-h6 mt-10 mb-0">
			<slot>{{ $root.lang().global.loading }}</slot>
		</p>
	</div>
</template>

<script>
// really handy since a lot of pages block on an image
// todo: probably use skeletons more for better design
export default {
	name: "loading-page",
};
</script>
