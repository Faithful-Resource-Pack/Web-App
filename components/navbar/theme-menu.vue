<template>
	<v-list class="pt-0" dense nav>
		<v-subheader class="text--primary justify-center uppercase">
			{{ $root.lang().global.themes.title }}
		</v-subheader>
		<v-list-item
			v-for="theme in themes"
			:key="theme.id"
			class="cursor-pointer text-left"
			:class="{ 'v-list-item--active': $root.theme.selectedTheme === theme.id }"
			dense
			@click="$emit('update', theme.id)"
		>
			<v-list-item-icon class="me-4">
				<v-icon>{{ theme.icon }}</v-icon>
			</v-list-item-icon>
			<v-list-item-title>
				{{ $root.lang().global.themes.options[theme.id] }}
			</v-list-item-title>
		</v-list-item>
		<v-divider />
		<v-list-item>
			<v-list-item-icon class="me-4">
				<!-- ripple clips into the list item margins for some reason -->
				<v-simple-checkbox
					class="dark-sidebar-checkbox"
					:ripple="false"
					:disabled="$root.theme.isDark"
					:value="darkSidebar"
					@input="$emit('update:darkSidebar')"
				/>
			</v-list-item-icon>
			<!-- make label clickable as well to match checkbox convention -->
			<v-list-item-title
				:class="$root.theme.isDark ? 'text--secondary' : 'text--primary cursor-pointer'"
				@click="$emit('update:darkSidebar')"
			>
				{{ $root.lang().global.themes.dark_sidebar }}
			</v-list-item-title>
		</v-list-item>
	</v-list>
</template>

<script>
export default {
	name: "theme-menu",
	props: {
		themes: {
			type: Array,
			required: true,
		},
		darkSidebar: {
			type: Boolean,
			required: true,
		},
	},
};
</script>

<style lang="scss">
// for some reason it's gray and looks disabled
.theme--light .dark-sidebar-checkbox * {
	color: rgba(0, 0, 0, 0.87);
}
</style>
