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

		<loading-page v-if="loading">
			{{ $root.lang().gallery.modal.loading }}
		</loading-page>
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
					<v-tab v-for="tab in displayedTabs" :key="tab">{{ tab }}</v-tab>
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
import LoadingPage from "@components/loading-page.vue";

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
		LoadingPage,
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
		tabs() {
			const availableTabs = ["information", "authors"];
			if (this.loading) return availableTabs;

			// only show animation tab if there's an mcmeta
			if (Object.keys(this.textureObj.mcmeta || {}).length) availableTabs.push("animation");
			return availableTabs;
		},
		displayedTabs() {
			return this.tabs.reduce((acc, cur) => {
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
						this.errorCode = err.response?.status;
						console.error(err);
						this.error =
							err.response?.data?.message || this.$root.lang().gallery.error_message.search_failed;
					});
			},
			immediate: true,
		},
		loading(nv) {
			// not loading and there is a hash
			if (!nv && location.hash) {
				this.selectedTab = this.tabs.indexOf(location.hash.slice(1));
			}
		},
		selectedTab(nv) {
			if (this.loading) return;
			location.hash = this.tabs[nv];
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

<style lang="scss">
.gallery-modal-container {
	display: flex;
	flex-flow: row wrap;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px; // equivalent to mx-2
}

$modal-image-size: 160px;

.gallery-modal-texture {
	height: $modal-image-size;
	width: $modal-image-size;
	position: relative;
	background-size: cover;
	background-position: center;
}

.gallery-modal-image-caption {
	max-width: $modal-image-size;
	height: 48px;
	font-size: 1em;
}

.theme--dark .gallery-modal-texture {
	background: url(/resources/transparency.png) center;
}

.gallery-modal-texture > * {
	position: absolute;
	height: $modal-image-size;
	width: $modal-image-size;
}
</style>
