<template>
	<v-layout>
		<v-app-bar app hide-on-scroll dense>
			<v-app-bar-nav-icon :title="$root.lang().global.navbar_labels.sidebar" @click="$emit('drawer')" />

			<v-spacer />
			<v-menu left offset-y open-on-hover transition="slide-y-transition">
				<template #activator="{ on, attrs }">
					<v-btn v-bind="attrs" min-width="0" class="px-1 ms-2" elevation="0"
						:aria-label="$root.lang().global.navbar_labels.theme" v-on="on">
						<v-icon>mdi-theme-light-dark</v-icon>
						<v-icon small>mdi-chevron-down</v-icon>
					</v-btn>
				</template>
				<v-list class="pt-0" dense nav>
					<v-list-subheader class="font-weight-black text-uppercase text-center justify-center text--primary">
						{{ $root.lang().global.themes.title }}
					</v-list-subheader>
					<v-list-item v-for="(icon, key) in themes" :key="key" class="cursor-pointer text-left"
						:class="{ 'v-list-item--active': $root.theme === key }" dense @click="$emit('theme', key)">
						<v-list-item icon class="me-4">
							<v-icon>{{ icon }}</v-icon>
						</v-list-item icon>
						<v-list-item-title>
							{{ $root.lang().global.themes.options[key] }}
						</v-list-item-title>
					</v-list-item>
					<v-divider />
					<v-list-item>
						<v-list-item icon class="me-4">
							<!-- ripple clips into the list item margins for some reason -->
							<v-checkbox :ripple="false" :disabled="$root.isDark" :value="darkSidebar"
								@input="updateDarkSidebar" />
						</v-list-item icon>
						<!-- make label clickable -->
						<v-list-item-title :class="$root.isDark ? 'text--secondary' : 'text--primary cursor-pointer'"
							@click="updateDarkSidebar">
							{{ $root.lang().global.themes.dark_sidebar }}
						</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
			<v-menu right offset-y open-on-hover transition="slide-y-transition">
				<template #activator="{ on, attrs }">
					<v-btn v-bind="attrs" min-width="0" class="px-1 ms-2" elevation="0"
						:aria-label="$root.lang().global.navbar_labels.translations" v-on="on">
						<v-icon>mdi-translate</v-icon>
						<v-icon small>mdi-chevron-down</v-icon>
					</v-btn>
				</template>
				<v-list class="pt-0" dense nav>
					<v-list-subheader class="font-weight-black text-uppercase text-center justify-center text--primary">
						{{ $root.lang().global.translations }}
					</v-list-subheader>
					<v-list-item v-for="lang in languages" :key="lang.bcp47" class="cursor-pointer text-left"
						:class="{ 'v-list-item--active': lang.id === $root.selectedLang }" dense
						@click="$emit('lang', lang.id)">
						<v-list-item avatar min-width="24" :width="24" max-width="24" :height="18" class="rounded-0">
							<v-img :src="`https://flagcdn.com/24x18/${lang.iso3166}.png`" :srcset="`
								https://flagcdn.com/32x24/${lang.iso3166}.png 2x,
								https://flagcdn.com/48x36${lang.iso3166}.png 3x`" width="24" height="18" />
						</v-list-item avatar>
						<v-list-item-title class="uppercase">{{ lang.id }}</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>

			<v-btn icon href="https://faithfulpack.net" class="mx-1"
				:title="$root.lang().global.navbar_labels.main_site">
				<img :src="monochromeLogo" width="30" alt="logo" />
			</v-btn>
		</v-app-bar>

	</v-layout>
</template>

<script>
export default {
	name: "nav-app-bar",
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
	methods: {
		updateDarkSidebar() {
			if (!this.$root.isDark) this.$emit("update:darkSidebar", !this.darkSidebar);
		},
	},
	computed: {
		monochromeLogo() {
			const filename = this.$root.isDark ? "white" : "black";
			return `https://database.faithfulpack.net/images/branding/logos/transparent/original/${filename}.png`;
		},
	},
};
</script>
