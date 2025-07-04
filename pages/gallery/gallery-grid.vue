<template>
	<v-list class="main-container pa-2 text-center">
		<div v-if="loading">
			<div class="text-h6 ma-1">{{ $root.lang().gallery.loading_message }}</div>
			<v-progress-circular v-if="loading" class="ma-1" indeterminate />
		</div>
		<div v-else-if="textures.length === 0" class="text-h6 my-2">
			{{ error || $root.lang().global.no_results }}
		</div>
		<div class="gallery-textures-container mx-auto" :style="gridStyles">
			<!-- sort method in key ensures rerenders change the image (this took me an hour to figure out) -->
			<div
				v-for="texture in displayedTextures"
				:key="sort + texture.textureID"
				class="gallery-texture-in-container"
				@click.exact.stop="$emit('open', texture.textureID)"
				@click.exact.middle.stop="$emit('openNewTab', texture.textureID)"
				@click.exact.meta.stop="$emit('openNewTab', texture.textureID)"
			>
				<tippy-component :to="texture.id" placement="right-start" maxWidth="350px">
					<template #trigger>
						<gallery-image
							:src="texture.url"
							:textureID="texture.textureID"
							:ignoreList="ignoreList"
							:animated="animated"
							:animatedTextures="animatedTextures"
						>
							<h1 :style="missingTextStyles.texture_id">#{{ texture.textureID }}</h1>
							<h3 :style="missingTextStyles.texture_name">{{ texture.name }}</h3>
							<p :style="missingTextStyles.message">
								{{ $root.lang().gallery.error_message.texture_not_done }}
							</p>
						</gallery-image>
						<v-btn
							class="ma-2 gallery-share"
							absolute
							plain
							icon
							:aria-label="$root.lang().gallery.share"
							@click.stop="$emit('share', texture.textureID)"
						>
							<v-icon>mdi-share-variant</v-icon>
						</v-btn>
					</template>

					<gallery-tooltip
						:mojang="isMojang"
						:texture="texture"
						:contributions="loadedContributions"
						:pack="pack"
						:discordIDtoName="discordIDtoName"
						:ignoreList="ignoreList"
					/>
				</tippy-component>
			</div>
		</div>

		<!-- already a scroll listener here so we can reuse it -->
		<v-btn v-show="scrollY > 500" fab class="go-up-btn" @click="toTop">
			<v-icon large>mdi-chevron-up</v-icon>
		</v-btn>

		<div ref="bottomElement" />
	</v-list>
</template>

<script>
import axios from "axios";

import GalleryTooltip from "./gallery-tooltip.vue";
import GalleryImage from "./gallery-image.vue";
import { TippyComponent } from "vue-tippy";

const MIN_ROW_DISPLAYED = 5;

export default {
	name: "gallery-grid",
	components: {
		GalleryTooltip,
		GalleryImage,
		TippyComponent,
	},
	props: {
		value: {
			type: Number,
			required: true,
		},
		loading: {
			type: Boolean,
			required: true,
		},
		animated: {
			type: Boolean,
			required: true,
		},
		textures: {
			type: Array,
			required: true,
		},
		pack: {
			type: String,
			required: true,
		},
		ignoreList: {
			type: Array,
			required: false,
			default: () => [],
		},
		discordIDtoName: {
			type: Function,
			required: true,
		},
		sort: {
			type: String,
			required: true,
		},
		maxColumns: {
			type: Number,
			required: true,
		},
		error: {
			type: String,
			required: false,
			default: null,
		},
	},
	data() {
		return {
			loadedContributions: {},
			lastContributions: {},
			columns: 7,
			// number of displayed results
			displayedResults: 1,
			// go to the top arrow
			scrollY: 0,
			// list of animated textures ids
			animatedTextures: [],
		};
	},
	methods: {
		toTop() {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
			// prevents page becoming really slow from too many displayed results after going up
			this.displayedResults = this.pageLength;
		},
		getLastContributions(pack) {
			if (this.isMojang) return this.loadedContributions;

			// faster than map and fromEntries
			const acc = {};
			for (const [key, contrib] of Object.entries(this.loadedContributions[pack])) {
				acc[key] = contrib.sort((a, b) => b.date - a.date)?.[0];
			}

			return acc;
		},
		isScrolledIntoView(el, margin = 0) {
			const rect = el.getBoundingClientRect();
			const elemTop = rect.top;
			const elemBottom = rect.bottom;
			return elemTop < window.innerHeight + margin && elemBottom >= 0;
		},
	},
	computed: {
		isMojang() {
			return ["default", "progart"].includes(this.pack);
		},
		sortedTextures() {
			return Array.from(this.textures).sort(this.sortMethods[this.sort]);
		},
		displayedTextures() {
			return this.sortedTextures.slice(0, this.displayedResults);
		},
		sortMethods() {
			// needs to be computed because we're using outer data for a closure
			return {
				nameDesc: (a, b) => b.name.localeCompare(a.name),
				nameAsc: (a, b) => a.name.localeCompare(b.name),
				idDesc: (a, b) => Number(b.textureID) - Number(a.textureID),
				idAsc: (a, b) => Number(a.textureID) - Number(b.textureID),
				contribDesc: (a, b) => {
					if (!this.lastContributions) return 0;
					// later date wins (if the pack has no contributions put them at end)
					const aContrib = this.lastContributions[a.textureID]?.date || 0;
					const bContrib = this.lastContributions[b.textureID]?.date || 0;
					return bContrib - aContrib;
				},
			};
		},
		shownColumns() {
			return Math.min(this.columns, this.maxColumns);
		},
		// how much to increment shown results by when scrolling
		pageLength() {
			return this.shownColumns * MIN_ROW_DISPLAYED;
		},
		gridStyles() {
			// bigger images -> smaller gaps
			const gap = this.$vuetify.breakpoint.mobile ? 8 : Math.round(100 / this.shownColumns);

			return {
				gap: `${gap}px`,
				gridTemplateColumns: `repeat(${this.shownColumns}, 1fr)`,
			};
		},
		missingTextStyles() {
			const CONTAINER_PADDING = 20; // .container padding (12px) + .v-list.main-container padding (8px)

			// double padding for each side
			const gridWidth = this.$el.clientWidth - CONTAINER_PADDING * 2;
			const imgWidth = gridWidth / this.shownColumns;

			// arbitrary scaling factor, seems to look pretty good
			const fontSize = imgWidth / 20;

			return {
				texture_id: { fontSize: `${fontSize * 4}px` },
				texture_name: { fontSize: `${fontSize * 2}px` },
				message: { fontSize: `${fontSize * 1.2}px` },
			};
		},
	},
	watch: {
		pack(n, o) {
			if (n === o || !Object.keys(this.loadedContributions).length) return;
			this.lastContributions = this.getLastContributions(n);
		},
		value: {
			handler(newValue) {
				this.columns = newValue;
			},
			// load from localStorage as soon as possible
			immediate: true,
		},
		columns(n) {
			this.$emit("input", n);
		},
	},
	created() {
		axios.get(`${this.$root.apiURL}/textures/animated`).then((res) => {
			this.animatedTextures = res.data.map((el) => el.toString());
		});

		axios.get(`${this.$root.apiURL}/contributions/raw`).then((res) => {
			this.loadedContributions = Object.values(res.data)
				.filter((contribution) => contribution.pack && contribution.texture)
				.reduce((acc, cur) => {
					if (!acc[cur.pack]) acc[cur.pack] = {};
					if (!acc[cur.pack][cur.texture]) acc[cur.pack][cur.texture] = [];

					acc[cur.pack][cur.texture].push({
						authors: cur.authors,
						date: cur.date,
					});

					return acc;
				}, {});
			this.lastContributions = this.getLastContributions(this.pack);
		});

		this.displayedResults = this.pageLength;
	},
	mounted() {
		const el = this.$refs.bottomElement;
		document.addEventListener("scroll", () => {
			this.scrollY = document.firstElementChild.scrollTop;

			if (!el || !this.isScrolledIntoView(el, 600)) return;

			// add more results when near bottom
			this.displayedResults += this.pageLength;
		});
	},
};
</script>
