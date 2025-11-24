<template>
	<v-navigation-drawer v-model="drawerOpen" app width="300">
		<template v-if="$root.isLoggedIn">
			<v-list-item dense two-line class="py-2 d-flex align-center justify-space-between">
				<a :href="discordURL" target="_blank" rel="noopener noreferrer">
					<v-avatar>
						<v-img :src="$root.user?.avatar" :alt="`${$root.user.username}'s Avatar`">
							<template #placeholder>
								<div
									class="d-flex align-center justify-center white--text"
									style="height: 100%; background-color: #1c8a2e"
								>
									{{ $root.user.username?.[0] || "?" }}
								</div>
							</template>
						</v-img>
					</v-avatar>
				</a>
				<v-list-item-content class="mx-3">
					<v-list-item-title class="body-2" style="text-overflow: ellipsis; white-space: nowrap">
						{{ $root.user.username }}
					</v-list-item-title>
					<v-list-item-subtitle>@{{ $root.user.discordUsername }}</v-list-item-subtitle>
				</v-list-item-content>
				<v-btn fab x-small color="red" elevation="3" @click="$root.logout">
					<v-icon small color="white">mdi-logout-variant</v-icon>
				</v-btn>
			</v-list-item>
			<v-divider class="mx-2" />
		</template>
		<v-list-item v-else dense class="pa-2">
			<v-btn block class="blurple" :href="$root.discordAuth.discordAuthURL">
				{{ $root.lang().global.login }}
			</v-btn>
		</v-list-item>

		<!--
			can't have multiple open tab groups with v-list so we manually add the classes
			this is absolutely horrid but there's no other way to get the same behavior nicely
		-->
		<div class="v-list--dense v-list--nav mt-2">
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
					<v-list-item
						v-for="subtab in tab.subtabs"
						:key="subtab.label"
						link
						:to="subtab.to"
						:disabled="subtab.disabled"
						@click="close"
					>
						<!-- for some reason the icon has a morbillion pixels of right padding -->
						<v-list-item-icon v-if="subtab.icon" class="mr-0">
							<v-icon small>{{ subtab.icon }}</v-icon>
						</v-list-item-icon>
						<v-list-item-content>
							<v-list-item-title class="body-2">
								{{ subtab.labelText || subtab.label.toTitleCase() }}
							</v-list-item-title>
						</v-list-item-content>
						<v-list-item-action v-if="subtab.badge && badges[subtab.label]" class="nav-badge">
							<span class="nav-badge-inner error white--text font-weight-black">
								{{ badges[subtab.label] }}
							</span>
						</v-list-item-action>
					</v-list-item>
				</div>
			</v-list-group>
		</div>

		<!-- Fix problem on firefox on mobile where bar disappears and fixed elements are hidden -->
		<div v-if="$vuetify.breakpoint.mdAndDown" class="py-5" />
	</v-navigation-drawer>
</template>

<script>
const OPEN_TAB_KEY = "menu_open_tabs";
const MAX_USERNAME_DISPLAY_LENGTH = 15;

export default {
	name: "nav-sidebar",
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
		close() {
			this.drawerOpen = false;
		},
	},
	computed: {
		shortUsername() {
			const username = this.$root.user.username;
			if (username.length < MAX_USERNAME_DISPLAY_LENGTH) return username;
			return `${username.slice(0, MAX_USERNAME_DISPLAY_LENGTH)}…`;
		},
		bannerStyles() {
			// MUST be done through css, using an image element does strange things with the padding
			const DEFAULT_IMAGE =
				"https://database.faithfulpack.net/images/branding/backgrounds/main_background.png?w=320";
			return {
				backgroundImage: `url(${this.$root.user.banner || DEFAULT_IMAGE})`,
				backgroundPosition: "center",
				backgroundSize: "cover",
			};
		},
		discordURL() {
			return `https://discord.com/users/${this.$root.user.id}`;
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
