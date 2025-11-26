<template>
	<div class="dashboard-stat mb-0 rounded-lg pa-2">
		<v-card-title class="pa-0 d-inline" :class="color">
			{{ value }}
		</v-card-title>
		{{ label }}
	</div>
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
