<template>
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
						:alt="texture.name"
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
					:texture="texture"
					:mojang="isMojang"
					:contributions="lastContributions"
					:discordIDtoName="discordIDtoName"
					:ignoreList="ignoreList"
				/>
			</tippy-component>
		</div>

		<!-- already a scroll listener here so we can reuse it -->
		<v-btn v-show="scrollY > 500" fab class="go-up-btn" @click="toTop">
			<v-icon large>mdi-chevron-up</v-icon>
		</v-btn>
		<div ref="bottomElement" />
	</div>
</template>

<script>
import axios from "axios";

import GalleryTooltip from "./gallery-tooltip.vue";
import GalleryImage from "./gallery-image.vue";
import { TippyComponent } from "vue-tippy";

// how many rows to add on scroll
const ROW_INCREMENT = 5;

export default {
	name: "gallery-grid",
	components: {
		GalleryTooltip,
		GalleryImage,
		TippyComponent,
	},
	props: {
		textures: {
			type: Array,
			required: true,
		},
		pack: {
			type: String,
			required: true,
		},
		animated: {
			type: Boolean,
			required: true,
		},
		sort: {
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
		shownColumns: {
			type: Number,
			required: true,
		},
	},
	data() {
		return {
			width: 0,
			loadedContributions: {},
			// number of displayed results
			displayedResults: 1,
			// go to the top arrow
			scrollY: 0,
			// list of animated textures ids
			animatedTextures: [],
			// must maintain static references to listeners for unmounting
			scrollListener: () => {},
			resizeListener: () => {},
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
			const methods = {
				nameDesc: (a, b) => b.name.localeCompare(a.name),
				nameAsc: (a, b) => a.name.localeCompare(b.name),
				idDesc: (a, b) => Number(b.textureID) - Number(a.textureID),
				idAsc: (a, b) => Number(a.textureID) - Number(b.textureID),
				contribDesc: (a, b) => {
					if (!this.lastContributions) return methods.nameAsc(a, b);
					// later date wins (if the pack has no contributions put them at end)
					const aContrib = this.lastContributions[a.textureID]?.date || 0;
					const bContrib = this.lastContributions[b.textureID]?.date || 0;
					return bContrib - aContrib;
				},
			};
			return methods;
		},
		// how much to increment shown results by when scrolling
		pageLength() {
			return this.shownColumns * ROW_INCREMENT;
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
			// .container padding (12px) + v-card .pa-2 padding (8px)
			const CONTAINER_PADDING = 20;

			// double padding for each side
			const gridWidth = this.width - CONTAINER_PADDING * 2;
			const imgWidth = gridWidth / this.shownColumns;

			// arbitrary scaling factor, seems to look pretty good
			const fontSize = imgWidth / 20;

			return {
				texture_id: { fontSize: `${fontSize * 4}px` },
				texture_name: { fontSize: `${fontSize * 2}px` },
				message: { fontSize: `${fontSize * 1.2}px` },
			};
		},
		lastContributions() {
			if (this.isMojang) return undefined;
			return this.loadedContributions[this.pack];
		},
	},
	created() {
		axios.get(`${this.$root.apiURL}/textures/animated`).then((res) => {
			this.animatedTextures = res.data.map((el) => el.toString());
		});

		axios.get(`${this.$root.apiURL}/contributions/raw`).then((res) => {
			this.loadedContributions = Object.values(res.data).reduce((acc, cur) => {
				if (!cur.date)
					console.error(`Contribution ${cur.id} ([#${cur.texture}] for ${cur.pack}) has no date!`);
				acc[cur.pack] ||= {};
				const existing = acc[cur.pack][cur.texture];

				// newer date wins
				if (existing === undefined || existing?.date < cur.date) acc[cur.pack][cur.texture] = cur;

				return acc;
			}, {});
		});

		// start off with more results
		this.displayedResults = this.pageLength * 3;
	},
	mounted() {
		// initialize callback references (they need to be the same for unmounting)
		this.scrollListener = () => {
			const el = this.$refs.bottomElement;
			this.scrollY = document.firstElementChild.scrollTop;

			if (!el || !this.isScrolledIntoView(el, 600)) return;

			// add more results when near bottom
			this.displayedResults += this.pageLength;
		};

		this.resizeListener = () => {
			this.width = this.$el.clientWidth;
		};

		document.addEventListener("scroll", this.scrollListener);
		window.addEventListener("resize", this.resizeListener);

		// start width calculation
		window.dispatchEvent(new Event("resize"));
	},
	unmounted() {
		document.removeEventListener("scroll", this.scrollListener);
		window.removeEventListener("resize", this.resizeListener);
	},
};
</script>

<style lang="scss">
.gallery-textures-container {
	display: grid;
}

.gallery-texture-in-container {
	text-align: center;
	position: relative;
	background-size: cover;
	background-position: center;
	aspect-ratio: 1 !important;
}

.gallery-texture-in-container .gallery-share {
	top: 0;
	right: 0;
	opacity: 0;
	transition: all 0.25s ease;
}

.gallery-texture-in-container:hover .gallery-share {
	opacity: 1;
}

.theme--dark .gallery-texture-in-container {
	background-size: cover !important;
	background: url(/resources/transparency.png);
}

.go-up-btn {
	position: fixed;
	bottom: 64px;
	right: 64px;
	z-index: 202;
}
</style>
