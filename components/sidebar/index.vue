<template>
	<v-navigation-drawer v-model="drawerOpen" app width="300" :dark="forceDark">
		<!--
			can't have multiple open tab groups with v-list so we manually add the css classes
			this is absolutely horrid but there's no other way to get the same behavior nicely
		-->
		<div class="v-list--dense v-list--nav">
			<router-link to="/">
				<img
					src="https://database.faithfulpack.net/images/branding/wordmarks/default/flat/main_flat_wordmark.png"
					class="mt-2 pa-2"
					style="width: 100%"
				/>
			</router-link>
			<v-divider class="my-2" />
			<v-list-group
				v-for="tab in tabs"
				:key="tab.id"
				color="inherit"
				:value="initialTabsOpen[tab.id]"
				@click="updateTabsOpen(tab.id)"
			>
				<template #activator>
					<v-list-item-title class="uppercase-unsized">
						{{ tab.label }}
					</v-list-item-title>
				</template>
				<template #appendIcon>
					<!-- regular is 24 and small is 16, both are a bit too extreme -->
					<v-icon size="20" style="opacity: 80%">
						{{ tabsOpen[tab.id] ? "mdi-chevron-up" : "mdi-chevron-right" }}
					</v-icon>
				</template>
				<div class="v-list pb-4 pt-0">
					<sidebar-tab
						v-for="subtab in tab.subtabs"
						:key="subtab.id"
						:subtab="subtab"
						:badges="badges"
						@select="autoClose"
					/>
				</div>
			</v-list-group>
			<!-- Fix problem on firefox on mobile where bar disappears and fixed elements are hidden -->
			<div v-if="$vuetify.breakpoint.mdAndDown" class="py-5" />
		</div>
	</v-navigation-drawer>
</template>

<script>
import SidebarTab from "./sidebar-tab.vue";

const OPEN_TAB_KEY = "menu_open_tabs";

export default {
	name: "nav-sidebar",
	components: {
		SidebarTab,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		tabs: {
			type: Array,
			required: true,
		},
		forceDark: {
			type: Boolean,
			required: false,
			default: false,
		},
		badges: {
			type: Object,
			required: false,
			default: () => ({}),
		},
	},
	data() {
		const tabOpenJSON = localStorage.getItem(OPEN_TAB_KEY) || "{}";
		return {
			drawerOpen: false,
			// updating tabsOpen when it's assigned to a value prop causes problems
			initialTabsOpen: JSON.parse(tabOpenJSON),
			// JSON.parse twice to get different references for mutation later
			tabsOpen: JSON.parse(tabOpenJSON),
		};
	},
	methods: {
		updateTabsOpen(label) {
			this.tabsOpen[label] = !this.tabsOpen[label];
			localStorage.setItem(OPEN_TAB_KEY, JSON.stringify(this.tabsOpen));
		},
		autoClose() {
			if (this.$vuetify.breakpoint.mobile) this.drawerOpen = false;
		},
	},
	watch: {
		value: {
			handler(newValue) {
				this.drawerOpen = newValue;
			},
			immediate: true,
		},
		drawerOpen(newValue) {
			this.$emit("input", newValue);
		},
		tabs(nv) {
			const keys = nv.map((tabs) => tabs.id);

			// we diff against the localstorage version since users can get logged out
			// and their preference should be saved regardless
			const keyDiff = keys.filter((k) => !Object.keys(this.tabsOpen).includes(k));
			if (!keyDiff.length) return;

			// properly new tabs are always open by default
			for (const key of keyDiff) {
				if (key === undefined) continue;
				this.initialTabsOpen[key] = true;
				this.tabsOpen[key] = true;
			}
			this.updateTabsOpen();
		},
	},
};
</script>
