<template>
	<v-list-item link :to="subtab.to" :disabled="subtab.disabled" @click="$emit('select')">
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
</template>

<script>
export default {
	name: "sidebar-tab",
	props: {
		subtab: {
			type: Object,
			required: true,
		},
		badges: {
			type: Object,
			required: false,
			default: () => ({}),
		},
	},
};
</script>
