<template>
	<v-navigation-drawer v-model="drawerOpen" app width="300">
		<!--
			can't have multiple open tab groups with v-list so we manually add the css classes
			this is absolutely horrid but there's no other way to get the same behavior nicely
		-->
		<div class="v-list--dense v-list--nav">
			<sidebar-user v-if="$root.isLoggedIn" />
			<v-btn v-else block class="my-2 blurple" :href="$root.discordAuth.discordAuthURL">
				{{ $root.lang().global.login }}
			</v-btn>
			<v-divider class="my-2" />
			<v-list-group
				v-for="tab in tabs"
				:key="tab.label"
				color="inherit"
				:value="initialTabsOpen[tab.label]"
				@click="updateTabsOpen(tab.label)"
			>
				<template #activator>
					<v-list-item-title class="uppercase-unsized">
						{{ tab.labelText }}
					</v-list-item-title>
				</template>
				<template #appendIcon>
					<!-- regular is 24 and small is 16, both are a bit too extreme -->
					<v-icon size="20" style="opacity: 80%">
						{{ tabsOpen[tab.label] ? "mdi-chevron-up" : "mdi-chevron-right" }}
					</v-icon>
				</template>
				<div class="v-list pb-4 pt-0">
					<sidebar-tab
						v-for="subtab in tab.subtabs"
						:key="subtab.label"
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
import SidebarUser from "./sidebar-user.vue";

const OPEN_TAB_KEY = "menu_open_tabs";

export default {
	name: "nav-sidebar",
	components: {
		SidebarUser,
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
			const keys = nv.map((tabs) => tabs.label);

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
