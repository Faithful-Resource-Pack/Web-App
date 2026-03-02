<template>
	<v-container id="addonReviewPage">
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="styles" v-html="pageStyles" />
		<div class="text-h4 py-4">
			{{ $root.lang().review.titles.addons }}
		</div>

		<deny-popup v-model="showDenyPopup" :archive="archive" @close="closeDenyPopup" />

		<review-categories v-model="status" :activeColor="pageColor" :categories="categories" />

		<!-- wraps both mobile and desktop layouts -->
		<div class="review-content-container my-2">
			<!-- empty layout is shared across both mobile and desktop -->
			<v-card v-if="selectedListItems.length === 0" class="main-container">
				<ascii-error :subtitle="$root.lang().review.labels[status]" />
			</v-card>
			<!-- desktop layout -->
			<div v-else-if="$vuetify.breakpoint.mdAndUp" class="review-content">
				<review-list
					v-model="selectedAddonId"
					:items="selectedListItems"
					:activeColor="pageColor"
				/>
				<review-preview
					:addonId="selectedAddonId"
					:colors="colors"
					@reviewAddon="reviewAddon"
					@openDenyPopup="openDenyPopup"
				/>
			</div>
			<template v-else>
				<v-expansion-panels v-if="addons[status].length > 0">
					<expansion-panels
						v-model="selectedAddonId"
						:addons="addons[status]"
						:color="pageColor"
						:contributors="contributors"
						:status="status"
						@close="update"
						@reviewAddon="reviewAddon"
						@openDenyPopup="openDenyPopup"
					/>
				</v-expansion-panels>
				<v-container v-else-if="loading[status] === true">
					{{ $root.lang().global.loading }}
				</v-container>
				<v-container v-else>
					{{ $root.lang().review.labels[status] }}
				</v-container>
			</template>
		</div>
	</v-container>
</template>

<script>
import axios from "axios";

import AsciiError from "@components/ascii-error.vue";
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
			delete query[name];
			this.$router.push({ query });
		},
	},
};

export default {
	name: "review-addons-page",
	components: {
		AsciiError,
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
			loading: {
				pending: true,
				denied: true,
				approved: true,
				archived: true,
			},
			contributors: [],
			showDenyPopup: false,
			denyAddon: {},
			archive: false,
			status: "pending",
			selectedAddonId: undefined,
		};
	},
	methods: {
		reviewAddon(addon, status, reason = null) {
			const id = typeof addon === "object" ? addon.id : addon;
			if (!this.$root.isLoggedIn) return;

			const data = {
				status: status,
				reason: reason,
			};

			axios
				.put(`${this.$root.apiURL}/addons/${id}/review`, data, this.$root.apiOptions)
				.then(() => {
					this.$root.showSnackBar(this.$root.lang().global.ends_success, "success");
					this.selectedAddonId = undefined;
					this.update();
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
		closeDenyPopup(send = false, reason) {
			if (send) this.reviewAddon(this.denyAddon, this.archive ? "archived" : "denied", reason);
		},
		openDenyPopup(addon, archive = false) {
			this.archive = !!archive;
			this.showDenyPopup = true;
			this.denyAddon = addon;
		},
		// adds results to this.addons, doesn't actually return it
		fetchAddonsByStatus(status) {
			return axios
				.get(`${this.$root.apiURL}/addons/${status}`, this.$root.apiOptions)
				.then((res) => {
					this.addons[status] = res.data;
					this.loading[status] = false;
					this.$forceUpdate();
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
		getContributors() {
			axios
				.get(`${this.$root.apiURL}/users/names`)
				.then((res) => {
					this.contributors = res.data;
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
		update() {
			Promise.all([
				this.getContributors(),
				this.fetchAddonsByStatus("pending"),
				this.fetchAddonsByStatus("denied"),
				this.fetchAddonsByStatus("approved"),
				this.fetchAddonsByStatus("archived"),
			])
				.then(() => {
					this.selectedAddonId ||= (this.selectedListItems[0] || {}).key;
				})
				.catch((err) => {
					this.$root.showSnackBar(err, "error");
				});
		},
		searchUpdate() {
			this.status = this.searchGet("status") || this.status;
			this.$nextTick(() => {
				this.selectedAddonId = this.searchGet("id") || this.selectedAddonId;
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
						secondary: a.options.tags.join(", "),
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
		status(n) {
			// select first if not empty
			this.searchSet("status", n);
			this.selectedAddonId = this.addons[n].length > 0 ? this.addons[n][0].id : undefined;
		},
		selectedAddonId(n) {
			if (n !== undefined) this.searchSet("id", n);
			else this.searchDelete("id");
		},
		"$route.query": {
			handler(params, prev) {
				if (JSON.stringify(params) === JSON.stringify(prev)) return;
				this.searchUpdate();
			},
			deep: true,
			immediate: true,
		},
	},
	created() {
		this.searchUpdate();
	},
	mounted() {
		this.update();
		this.pageStyles = generatePageStyles(this.pageColor);
	},
};
</script>

<style lang="scss">
$list-width: 40%;
$preview-width: 60%;

/** NEW REVIEW LAYOUT */
.review-content-container {
	height: 70vh;
}

.review-content {
	display: flex;
	flex-flow: row nowrap;
	justify-content: center;
	align-items: stretch;
	// ma-2
	gap: 8px;
}

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
