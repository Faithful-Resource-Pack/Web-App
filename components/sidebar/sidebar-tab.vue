<template>
	<v-list-item link :to="subtab.to" :disabled="subtab.disabled" @click="$emit('select')">
		<!-- for some reason the icon has a morbillion pixels of right padding -->
		<v-list-item icon v-if="subtab.icon" class="mr-0">
			<v-icon small>{{ subtab.icon }}</v-icon>
		</v-list-item icon>
		<v-list-item-content>
			<v-list-item-title class="body-2">
				{{ subtab.label || subtab.id.toTitleCase() }}
			</v-list-item-title>
		</v-list-item-content>
		<v-list-item-action v-if="subtab.badge && badges[subtab.id]" class="nav-badge">
			<span class="nav-badge-inner error white--text font-weight-black">
				{{ badges[subtab.id] }}
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

<style lang="scss">
.nav-badge {
	margin-top: 0;
	margin-bottom: 0;
}

.nav-badge-inner {
	height: 24px;
	width: 24px;
	font-size: 12px;
	border-radius: 50%;
	line-height: 24px;
	text-align: center;
}
</style>
