<template>
	<v-container :class="[sources.length ? 'px-0 pt-0' : 'pa-0']">
		<div class="scroller" style="overflow: auto; white-space: nowrap">
			<div class="scroller-content">
				<v-card
					v-for="(url, index) in sources"
					:key="url"
					class="pa-0 mr-2"
					style="display: inline-block"
				>
					<v-img
						class="rounded cursor-pointer"
						:src="url"
						height="150"
						:width="(150 * 16) / 9"
						:aspect-ratio="16 / 9"
						alt="preview"
						@click="onFullscreen(index)"
					/>
					<v-card
						class="ma-2"
						dark
						rounded
						style="display: inline-block; position: absolute; right: 0; top: 0"
					>
						<v-icon small class="ma-1" @click.stop="(e) => onFullscreen(index, e)">
							mdi-fullscreen
						</v-icon>
						<v-icon
							v-if="deletable"
							small
							class="ma-1"
							@click.stop="(e) => onDelete(url, index, e)"
						>
							mdi-delete
						</v-icon>
					</v-card>
				</v-card>
			</div>
		</div>

		<fullscreen-preview v-model="previewOpen" :src="fullscreenItem" />
	</v-container>
</template>

<script>
import FullscreenPreview from "@components/fullscreen-preview.vue";

export default {
	name: "image-previewer",
	components: {
		FullscreenPreview,
	},
	props: {
		sources: {
			type: Array,
			required: true,
		},
		ids: {
			type: Array,
			required: false,
			default: undefined,
		},
		deletable: {
			type: Boolean,
			required: false,
			default: true,
		},
	},
	data() {
		return {
			fullscreenIndex: undefined,
			previewOpen: false,
		};
	},
	computed: {
		fullscreenItem() {
			if (this.fullscreenIndex === undefined) return "";
			return this.sources[this.fullscreenIndex];
		},
		empty() {
			return !this.sources.length;
		},
	},
	methods: {
		onDelete(item, index, e) {
			if (e) e.target.blur();
			this.$emit("delete", item, index, this.ids === undefined ? undefined : this.ids[index]);
		},
		onFullscreen(index, e) {
			if (e) e.target.blur();
			this.fullscreenIndex = index;
			this.previewOpen = true;
		},
	},
};
</script>
