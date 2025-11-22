<template>
	<p class="mb-0 rounded-lg pa-2">
		<span class="v-card__title pa-0 d-inline" :class="color">
			{{ value }}
		</span>
		{{ label }}
	</p>
</template>

<script>
export default {
	name: "dashboard-stat",
	props: {
		label: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number],
			required: true,
		},
		color: {
			type: String,
			required: false,
			default: "text--primary",
		},
	},
};
</script>
