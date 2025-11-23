<template>
	<v-dialog v-model="modalOpened" :width="`${aspectRatio * 90}vh`" height="90vh">
		<v-card>
			<v-img
				:style="styles"
				:src="src"
				:alt="alt"
				:aspect-ratio="aspectRatio"
				contain
				@click="close"
			/>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
	name: "fullscreen-preview",
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		aspectRatio: {
			type: Number,
			required: false,
			default: 16 / 9,
		},
		src: {
			type: String,
			required: false,
			default: "",
		},
		alt: {
			type: String,
			required: false,
			default: "fullscreen preview",
		},
		texture: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	data() {
		return {
			modalOpened: false,
		};
	},
	methods: {
		close() {
			this.modalOpened = false;
		},
	},
	computed: {
		styles() {
			return this.texture ? { "image-rendering": "pixelated" } : {};
		},
	},
	watch: {
		value(newValue) {
			this.modalOpened = newValue;
		},
		modalOpened(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
