<template>
	<v-app-bar app dense>
		<v-app-bar-nav-icon
			:title="$root.lang().global.navbar.labels.sidebar"
			@click="$emit('drawer')"
		/>

		<v-spacer />
		<v-menu left offset-y transition="slide-y-transition">
			<template #activator="{ on, attrs }">
				<v-btn
					min-width="0"
					class="px-1 ms-2"
					elevation="0"
					:aria-label="$root.lang().global.navbar.labels.theme"
					v-bind="attrs"
					v-on="on"
				>
					<v-icon>mdi-theme-light-dark</v-icon>
					<v-icon small>mdi-chevron-down</v-icon>
				</v-btn>
			</template>
			<theme-menu
				:themes="themes"
				:darkSidebar="darkSidebar"
				@update="$emit('theme', $event)"
				@update:darkSidebar="$emit('update:darkSidebar', !darkSidebar)"
			/>
		</v-menu>
		<v-menu right offset-y transition="slide-y-transition">
			<template #activator="{ on, attrs }">
				<v-btn
					min-width="0"
					class="px-1 ms-2"
					elevation="0"
					:aria-label="$root.lang().global.navbar.labels.translations"
					v-bind="attrs"
					v-on="on"
				>
					<v-icon>mdi-translate</v-icon>
					<v-icon small>mdi-chevron-down</v-icon>
				</v-btn>
			</template>
			<lang-menu :languages="languages" @update="$emit('lang', $event)" />
		</v-menu>

		<v-menu
			v-if="$root.isLoggedIn"
			right
			min-width="150px"
			offset-y
			transition="slide-y-transition"
		>
			<template #activator="{ on, attrs }">
				<img
					v-bind="attrs"
					class="mx-1 ms-2"
					style="height: 32px; aspect-ratio: 1 !important; border-radius: 100%"
					:src="$root.user?.avatar"
					:alt="`${$root.user.username}'s Avatar`"
					v-on="on"
				/>
			</template>
			<user-menu @open-accounts="openAccountManager" />
		</v-menu>
		<v-btn v-else small color="primary" class="mx-1 ms-2" :href="$root.discordAuth.discordAuthURL">
			<v-icon left>mdi-login</v-icon>
			Log in
		</v-btn>
		<account-manager v-model="accountManagerOpen" />
	</v-app-bar>
</template>

<script>
import ThemeMenu from "./theme-menu.vue";
import LangMenu from "./lang-menu.vue";
import UserMenu from "./user-menu.vue";
import AccountManager from "./account-manager.vue";

export default {
	name: "nav-app-bar",
	components: {
		ThemeMenu,
		LangMenu,
		UserMenu,
		AccountManager,
	},
	props: {
		themes: {
			type: Object,
			required: true,
		},
		languages: {
			type: Array,
			required: true,
		},
		darkSidebar: {
			type: Boolean,
			required: true,
		},
	},
	data() {
		return {
			accountManagerOpen: false,
		};
	},
	methods: {
		openAccountManager() {
			this.accountManagerOpen = true;
		},
	},
};
</script>
