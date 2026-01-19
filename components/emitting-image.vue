<template>
	<div style="position: relative">
		<v-img
			class="rounded"
			:class="$listeners.fullscreen && 'cursor-pointer'"
			:src="src"
			v-bind="$attrs"
			@click.stop="$emit('fullscreen')"
		>
			<template #placeholder>
				<v-row
					class="fill-height ma-0"
					align="center"
					justify="center"
					style="background-color: rgba(255, 255, 255, 0.1)"
				>
					<v-progress-circular v-if="src !== null" indeterminate color="grey lighten-5" />
					<v-icon v-else x-large>mdi-image-off</v-icon>
				</v-row>
			</template>
		</v-img>
		<v-card class="d-inline-block ma-2" rounded style="position: absolute; right: 0; top: 0">
			<v-icon
				v-if="$listeners.fullscreen"
				class="ma-1"
				small
				@click.stop="$emit('fullscreen', src)"
			>
				mdi-fullscreen
			</v-icon>
			<v-icon v-if="deletable" class="ma-1" small @click.stop="$emit('delete', src)">
				mdi-delete
			</v-icon>
		</v-card>
	</div>
</template>

<script>
export default {
	name: "emitting-image",
	props: {
		src: {
			type: [String, Blob],
			required: false,
			default: null,
		},
		deletable: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
};
</script>
