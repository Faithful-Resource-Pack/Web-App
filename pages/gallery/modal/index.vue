<template>
	<fullscreen-modal
		v-model="modalOpened"
		:loading="loading"
		:title="modalTitle"
		@close="closeModal"
	>
		<template #toolbar>
			<v-btn icon @click="$emit('share', textureID)">
				<v-icon>mdi-share-variant</v-icon>
			</v-btn>
		</template>
		<fullscreen-preview v-model="previewOpen" :src="clickedImage" :aspect-ratio="1 / 1" texture />

		<v-container v-if="loading" class="d-flex align-center justify-center">
			<v-progress-circular indeterminate :size="150" :width="10" />
			<p class="text-h6 my-5">{{ $root.lang().gallery.modal.loading }}</p>
		</v-container>
		<v-container v-else-if="error" class="d-flex align-center justify-center flex-grow-1">
			<ascii-error :subtitle="error" :errorCode="errorCode" />
		</v-container>
		<div v-else class="gallery-modal-container pa-5">
			<!-- image display -->
			<div class="mx-auto overflow-auto pa-2">
				<div v-for="(group, i) in grouped" :key="i" class="d-flex flex-row pb-2 pb-sm-0">
					<div v-for="url in group" :key="url.name" class="px-2 pb-sm-2">
						<gallery-image
							:ref="`image-${url.name}`"
							modal
							:src="url.image"
							:textureID="textureID"
							:ignoreList="ignoreList"
							:animated="animated"
							:mcmeta="textureObj.mcmeta"
							@click="openFullscreenPreview(url.image)"
							@loaded="countLoaded"
						>
							<p>{{ $root.lang().gallery.error_message.texture_not_done }}</p>
						</gallery-image>
						<h2 class="text-center gallery-modal-image-caption">{{ packToName[url.name] }}</h2>
					</div>
				</div>
			</div>

			<!-- texture details -->
			<div class="flex-grow-1 pa-2">
				<v-tabs id="info-tabs" v-model="selectedTab" :show-arrows="false">
					<v-tabs-slider />

					<v-tab v-for="tab in displayedTabs" :key="tab" style="text-transform: uppercase">
						{{ tab }}
					</v-tab>
				</v-tabs>

				<v-tabs-items v-model="selectedTab">
					<v-tab-item v-for="tab in displayedTabs" :key="tab">
						<texture-tab v-if="tab === displayedTabs.information" :textureObj="textureObj" />
						<author-tab
							v-if="tab === displayedTabs.authors"
							:contributions="textureObj.contributions"
							:packToName="packToName"
							:discordIDtoName="discordIDtoName"
						/>
						<animation-tab v-if="tab === displayedTabs.animation" :mcmeta="textureObj.mcmeta" />
					</v-tab-item>
				</v-tabs-items>
			</div>
		</div>
	</fullscreen-modal>
</template>

<script>
import axios from "axios";
import GalleryImage from "../gallery-image.vue";
import TextureTab from "./texture-tab.vue";
import AuthorTab from "./author-tab.vue";
import AnimationTab from "./animation-tab.vue";
import FullscreenPreview from "@components/fullscreen-preview.vue";
import FullscreenModal from "@layouts/fullscreen-modal.vue";
import AsciiError from "@components/ascii-error.vue";

const PACK_GRID_ORDER = [
	["default", "faithful_32x", "faithful_64x"],
	["default", "classic_faithful_32x_jappa", "classic_faithful_64x_jappa"],
	["progart", "classic_faithful_32x", "classic_faithful_64x"],
];

const PACK_SLIDER_ORDER = [
	"default",
	"progart",
	"faithful_32x",
	"faithful_64x",
	"classic_faithful_32x",
	"classic_faithful_64x",
	"classic_faithful_32x_jappa",
	"classic_faithful_64x_jappa",
];

export default {
	name: "gallery-modal",
	components: {
		AsciiError,
		GalleryImage,
		FullscreenPreview,
		FullscreenModal,
		TextureTab,
		AnimationTab,
		AuthorTab,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		textureID: {
			type: String,
			required: false,
			default: undefined,
		},
		discordIDtoName: {
			type: Function,
			required: true,
		},
		// saves on duplicate code since it's already in the gallery page
		packToName: {
			type: Object,
			required: true,
		},
		animated: {
			type: Boolean,
			required: false,
			default: true,
		},
		// ignore list provided (already filtered by edition)
		ignoreList: {
			type: Array,
			required: false,
			default: () => [],
		},
	},
	data() {
		return {
			textureObj: {},
			error: null,
			errorCode: 0,
			selectedTab: null,
			modalOpened: false,
			clickedImage: "",
			previewOpen: false,
			loadedTimeout: undefined,
		};
	},
	methods: {
		closeModal() {
			this.$emit("close");
			this.textureObj = {};
		},
		countLoaded(loaded) {
			// if image errored ignore it
			if (!loaded) return;

			// reset the other frames until synced
			clearTimeout(this.loadedTimeout);
			this.loadedTimeout = setTimeout(() => {
				const childrenRefs = Object.values(this.$refs).filter((ref) => ref);
				Promise.all(childrenRefs.flatMap((ref) => ref.reset()));
			}, 100);
		},
		openFullscreenPreview(url) {
			this.clickedImage = url;
			this.previewOpen = true;
		},
		resetModal() {
			this.textureObj = {};
			this.error = null;
		},
	},
	computed: {
		grouped() {
			if (this.loading) return [];

			// don't display duplicates on mobile
			if (this.$vuetify.breakpoint.mdAndDown)
				return [
					PACK_SLIDER_ORDER.map((pack) => ({ name: pack, image: this.textureObj.urls[pack] })),
				];

			return PACK_GRID_ORDER.map((packSet) =>
				packSet.map((pack) => {
					const url = this.textureObj.urls[pack];
					return { name: pack, image: url };
				}),
			);
		},
		loading() {
			const hasContent = Object.keys(this.textureObj).length || this.error;
			return !hasContent;
		},
		modalTitle() {
			if (this.error) return this.$root.lang().gallery.error_message.search_failed;
			if (this.loading) return this.$root.lang().global.loading;
			return `[#${this.textureID}] ${this.textureObj.texture.name}`;
		},
		displayedTabs() {
			if (this.loading) return [];
			const availableTabs = ["information", "authors"];

			// only show animation tab if there's an mcmeta
			if (Object.keys(this.textureObj.mcmeta || {}).length) availableTabs.push("animation");

			return availableTabs.reduce((acc, cur) => {
				acc[cur] = this.$root.lang().gallery.modal.tabs[cur];
				return acc;
			}, {});
		},
	},
	watch: {
		textureID: {
			handler(newValue, oldValue) {
				// doesn't matter if the modal isn't open yet
				if (newValue === oldValue) return;
				if (newValue === undefined) return this.resetModal();

				axios
					.get(
						// way easier to use route params than drill a version prop
						`${this.$root.apiURL}/gallery/modal/${newValue}/${this.$route.params.version || "latest"}`,
					)
					.then((res) => {
						this.textureObj = res.data;
					})
					.catch((err) => {
						this.errorCode = err.response.status;
						console.error(err);
						this.error =
							err.response?.data?.message || this.$root.lang().gallery.error_message.search_failed;
					});
			},
			immediate: true,
		},
		value: {
			handler(n) {
				this.modalOpened = n;
			},
			// has issues if the modal is open on page load otherwise
			immediate: true,
		},
		modalOpened(n) {
			this.$emit("input", n);
		},
	},
};
</script>
