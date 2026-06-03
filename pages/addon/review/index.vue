<template>
	<v-container id="addonReviewPage">
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="styles" v-html="pageStyles" />
		<div class="text-h4 py-4">
			{{ $root.lang().review.titles.addons }}
		</div>

		<deny-popup v-model="showModal" :archive="archive" :color="pageColor" @close="closeDenyPopup" />

		<review-categories v-model="status" :activeColor="pageColor" :categories="categories" />

		<!-- wraps both mobile and desktop layouts -->
		<div
			class="review-content-container my-2"
			:style="$vuetify.breakpoint.mdAndUp && 'height: 70vh'"
		>
			<!-- empty layout is shared across both mobile and desktop -->
			<v-card v-if="selectedListItems.length === 0" class="main-container text-center">
				<loading-page v-if="loading" />
				<ascii-error v-else :subtitle="$root.lang().review.labels[status]" />
			</v-card>
			<!-- desktop layout -->
			<div v-else-if="$vuetify.breakpoint.mdAndUp" class="d-flex ga-2">
				<review-list
					v-model="selectedAddonId"
					:items="selectedListItems"
					:activeColor="pageColor"
				/>
				<review-preview
					:addonId="selectedAddonId"
					:status="status"
					:authors="authors"
					@reviewAddon="reviewAddon"
					@openDenyPopup="openDenyPopup"
				/>
			</div>
			<expansion-panels
				v-else
				v-model="selectedAddonId"
				:addons="selectedListItems"
				:status="status"
				:authors="authors"
				@reviewAddon="reviewAddon"
				@openDenyPopup="openDenyPopup"
			/>
		</div>
	</v-container>
</template>

<script>
import axios from "axios";

import AsciiError from "@components/ascii-error.vue";
import LoadingPage from "@layouts/loading-page.vue";
import ExpansionPanels from "./expansion-panels.vue";
import DenyPopup from "./deny-popup.vue";
import ReviewCategories from "./review-categories.vue";
import ReviewList from "./review-list.vue";
import ReviewPreview from "./review-preview.vue";

import { generatePageStyles } from "@helpers/colors.js";

const searchMixin = {
	methods: {
		/**
		 * Gets a specific param
		 * @param {string} name Search param name
		 * @returns {String|null} param value
		 */
		searchGet(name) {
			return this.$route.query[name];
		},
		/**
		 * Updates search param with new
		 * @param {string} name Search param name
		 * @param {any} value given value
		 */
		searchSet(name, value) {
			if (this.$route.query[name] === value) return;
			this.$router.push({ query: { ...this.$route.query, [name]: String(value) } });
		},
		searchDelete(name) {
			const query = { ...this.$route.query };
			if (query[name] === undefined) return;
			delete query[name];
			this.$router.push({ query });
		},
	},
};

export default {
	name: "addon-review-page",
	components: {
		AsciiError,
		LoadingPage,
		ExpansionPanels,
		DenyPopup,
		ReviewCategories,
		ReviewList,
		ReviewPreview,
	},
	mixins: [searchMixin],
	data() {
		return {
			pageColor: "yellow darken-3",
			pageStyles: "",
			textColorOnPage: "white--text",
			colors: {
				approved: "green",
				pending: "yellow",
				denied: "red",
				archived: "grey",
			},
			addons: {
				pending: [],
				approved: [],
				denied: [],
				archived: [],
			},
			loading: true,
			authors: [],
			packs: {},
			showModal: false,
			modalId: {},
			archive: false,
			status: "pending",
			selectedAddonId: undefined,
		};
	},
	methods: {
		reviewAddon(addon, status = "approved", reason = null) {
			const id = typeof addon === "object" ? addon.id : addon;
			if (!this.$root.isLoggedIn) return;

			const data = { status, reason };
			this.$root
				.wrapSnackBar(
					axios.put(`${this.$root.apiURL}/addons/${id}/review`, data, this.$root.apiOptions),
				)
				.then(() => {
					this.loading = true;
					// focused addon is no longer in the same status list so remove the param and reload
					this.searchDelete("id");
					this.getAddons();
				});
		},
		openDenyPopup(addon, archive = false) {
			this.archive = !!archive;
			this.showModal = true;
			this.modalId = addon;
		},
		closeDenyPopup(success = false, reason) {
			if (success) this.reviewAddon(this.modalId, this.archive ? "archived" : "denied", reason);
		},
		async getAddons() {
			const res = await axios.get(`${this.$root.apiURL}/addons/raw`, this.$root.apiOptions);
			const addons = Object.values(res.data).sort((a, b) => {
				if (a.last_updated && b.last_updated) return b.last_updated - a.last_updated;

				// if there's An Update Date it's automatically newer
				if (a.last_updated) return -1;
				if (b.last_updated) return 1;

				// no info to go off, just compare ids
				return b.id - a.id;
			});

			for (const status of Object.keys(this.addons))
				this.addons[status] = addons.filter((f) => f.approval.status === status);

			this.loading = false;
			this.updateSearch();
		},
		getAuthors() {
			axios.get(`${this.$root.apiURL}/users/names`).then((res) => {
				this.authors = res.data;
			});
		},
		getPacks() {
			axios.get(`${this.$root.apiURL}/packs/raw`).then((res) => {
				this.packs = res.data;
			});
		},
		updateSearch() {
			this.status = this.searchGet("status") || this.status;
			this.$nextTick(() => {
				this.selectedAddonId =
					this.searchGet("id") || this.addons[this.status][0]?.id || this.selectedAddonId;
			});
		},
	},
	computed: {
		stats() {
			return Object.values(this.addons).map((v) => v.length);
		},
		categories() {
			return Object.keys(this.addons).map((cat, i) => ({
				label: this.$root.lang().review.titles[cat],
				color: this.colors[cat],
				value: cat,
				count: this.stats[i] !== undefined ? String(this.stats[i]) : "",
			}));
		},
		allListItems() {
			return Object.entries(this.addons)
				.map(([category, addons]) => ({
					category,
					items: addons.map((a) => ({
						key: String(a.id),
						primary: a.name,
						secondary: a.options.packs.map((p) => this.packs[p]?.name || p).join(", "),
					})),
				}))
				.reduce((acc, cur) => {
					acc[cur.category] = cur.items;
					return acc;
				}, {});
		},
		selectedListItems() {
			return this.allListItems[this.status];
		},
	},
	watch: {
		status: {
			handler(n) {
				// select first if not empty
				const matchingAddons = this.addons[n];
				this.selectedAddonId = matchingAddons.length ? matchingAddons[0].id : undefined;
			},
			immediate: true,
		},
		"$route.query": {
			handler(params, prev) {
				if (JSON.stringify(params) === JSON.stringify(prev)) return;
				this.updateSearch();
			},
			deep: true,
			immediate: true,
		},
	},
	created() {
		this.updateSearch();
	},
	mounted() {
		this.pageStyles = generatePageStyles(this.pageColor);

		Promise.all([this.getAuthors(), this.getPacks(), this.getAddons()]).catch((err) => {
			console.error(err);
			this.$root.showSnackBar(err, "error");
		});
	},
};
</script>

<style lang="scss">
$list-width: calc(100% * 1 / 3);
$preview-width: calc(100% * 2 / 3);

// make sure all children take up the same space
.review-content-container > * {
	width: 100%;
	height: 100%;
}

.review-list {
	width: $list-width;
}
.review-preview {
	width: $preview-width;
}

// white text on yellow background is completely illegible
.theme--dark .yellow.darken-3,
.theme--dark .yellow.darken-3 .v-list-item__title {
	color: rgba(0, 0, 0, 0.87);
}
.theme--dark .yellow.darken-3 .v-list-item__subtitle {
	color: rgba(0, 0, 0, 0.6);
}
</style>
