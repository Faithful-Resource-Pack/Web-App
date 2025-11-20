<template>
	<v-navigation-drawer v-model="drawerOpen" app width="320">
		<v-card :style="bannerStyles" class="rounded-t-0">
			<div v-if="$root.isLoggedIn" class="py-2">
				<v-card-title class="pl-2">
					<v-avatar size="48" class="mr-2">
						<img
							v-if="$root.user.avatar"
							style="line-height: 48px"
							:alt="$root.user.username.charAt(0)"
							:src="$root.user.avatar"
						/>
						<span v-else class="text-center primary font-weight-bold">
							{{ $root.user.username[0] }}
						</span>
					</v-avatar>
					<span class="white--text clean-shadow">{{ shortUsername }}</span>
				</v-card-title>
				<v-card-actions class="mt-n1">
					<v-btn small color="red white--text" width="40%" @click="$root.logout">
						{{ $root.lang().global.logout }}
					</v-btn>
				</v-card-actions>
			</div>
			<div v-else class="px-5 py-5">
				<v-btn block class="blurple" :href="$root.discordAuth.discordAuthURL">
					{{ $root.lang().global.login }}
				</v-btn>
			</div>
		</v-card>

		<div v-for="tab in tabs" :key="tab.label">
			<v-list nav dense>
				<v-list-item>
					<v-list-item-title class="uppercase-unsized">
						{{ tab.labelText }}
					</v-list-item-title>
				</v-list-item>

				<v-list-item
					v-for="subtab in tab.subtabs"
					:key="subtab.label"
					class="uppercase-unsized"
					link
					:to="subtab.to"
					:disabled="subtab.disabled"
				>
					<v-list-item-icon v-if="subtab.icon" class="mr-1">
						<v-icon small>{{ subtab.icon }}</v-icon>
					</v-list-item-icon>
					<v-list-item-title>{{ subtab.labelText }}</v-list-item-title>

					<v-list-item-action v-if="subtab.badge && badges[subtab.label]" class="nav-badge">
						<span class="nav-badge-inner error white--text">{{ badges[subtab.label] }}</span>
					</v-list-item-action>
				</v-list-item>
			</v-list>
			<v-divider class="mx-2" />
		</div>

		<!-- Fix problem on firefox on mobile where bar disappears and fixed elements are hidden -->
		<div v-if="$vuetify.breakpoint.mdAndDown" class="py-5" />
	</v-navigation-drawer>
</template>

<script>
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
		return {
			drawerOpen: false,
		};
	},
	computed: {
		shortUsername() {
			const username = this.$root.user.username;
			if (username.length < 15) return username;
			return `${username.slice(0, 15)}…`;
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
	},
};
</script>
