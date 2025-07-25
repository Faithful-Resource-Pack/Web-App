<template>
	<v-container id="review-addons">
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="styles" v-html="pageStyles" />
		<div class="text-h4 py-4">
			{{ $root.lang().review.titles.addons }}
		</div>

		<deny-popup v-model="showDenyPopup" :archive="archive" @close="closeDenyPopup" />

		<review-categories
			v-model="status"
			:categories="categories"
			:activeColor="pageColor"
			:empty="empty"
		/>

		<div id="review-content" :class="['mt-1 mb-2', { desktop: $vuetify.breakpoint.mdAndUp }]">
			<div v-if="selectedItems.length === 0" id="empty">
				<div class="rounded-lg d-flex text-center align-center justify-center">
					<div>
						<!-- eslint-disable vue/html-closing-bracket-newline -->
						<pre v-if="$vuetify.breakpoint.mdAndUp">
    d8888   .d8888b.      d8888
   d8P888  d88P  Y88b    d8P888
  d8P 888  888    888   d8P 888
 d8P  888  888    888  d8P  888
d88   888  888    888 d88   888
8888888888 888    888 8888888888
      888  Y88b  d88P       888
      888   "Y8888P"        888
</pre
						>
						<!-- eslint-enable vue/html-closing-bracket-newline -->
						<p v-else class="text-h2 my-2">404</p>
						<p class="my-2 px-2">{{ empty }}</p>
					</div>
				</div>
			</div>
			<template v-else>
				<template v-if="$vuetify.breakpoint.mdAndUp">
					<div id="review-list">
						<review-list
							v-model="selectedAddonId"
							:items="selectedItems"
							:activeColor="pageColor"
							:empty="empty"
						/>
					</div>
					<div id="review-preview-container">
						<review-preview :addonId="selectedAddonId" />
					</div>
				</template>
				<template v-else>
					<v-expansion-panels v-if="addons[status].length > 0" class="mt-1">
						<expansion-panel
							v-model="selectedAddonId"
							:contributors="contributors"
							:color="pageColor"
							:addons="addons[status]"
							:reviewAddon="reviewAddon"
							:openDenyPopup="openDenyPopup"
							:update="update"
							:status="status"
						/>
					</v-expansion-panels>
					<v-container v-else-if="loading[status] === true">
						{{ $root.lang().global.loading }}
					</v-container>
					<v-container v-else>
						{{ $root.lang().review.labels[status] }}
					</v-container>
				</template>
			</template>
		</div>
	</v-container>
</template>

<script>
import axios from "axios";

import ExpansionPanel from "./expansion-panel.vue";
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
		ExpansionPanel,
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
		openDenyPopup(addon, archive = undefined) {
			this.archive = !!archive;
			this.showDenyPopup = true;
			this.denyAddon = addon;
		},
		getAddonsByStatus(status) {
			return axios
				.get(`${this.$root.apiURL}/addons/${status}`, this.$root.apiOptions)
				.then((res) => {
					this.addons[status] = res.data;
					this.addons[status].forEach((addon) => (addon.options.tags = addon.options.tags.sort()));
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
				this.getAddonsByStatus("pending"),
				this.getAddonsByStatus("denied"),
				this.getAddonsByStatus("approved"),
				this.getAddonsByStatus("archived"),
			])
				.then(() => {
					this.selectedAddonId ||= (this.selectedItems[0] || {}).key;
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
		items() {
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
		selectedItems() {
			return this.items[this.status];
		},
		empty() {
			return this.$root.lang().review.labels[this.status];
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
		this.pageStyles = generatePageStyles(this, this.pageColor);

		this.$root.$on("openDenyPopup", (args) => {
			this.openDenyPopup(...args);
		});

		this.$root.$on("reviewAddon", (args) => {
			this.reviewAddon(...args);
		});
	},
};
</script>
