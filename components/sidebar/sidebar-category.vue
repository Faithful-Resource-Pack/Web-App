<template>
	<v-list-group color="inherit" :value="initOpen" @click="$emit('click')">
		<template #activator>
			<v-list-item-title class="uppercase-unsized">
				{{ $root.lang().global.tabs[tab.id].title || tab.id.toTitleCase() }}
			</v-list-item-title>
		</template>
		<template #appendIcon>
			<!-- regular is 24 and small is 16, both are a bit too extreme -->
			<v-icon size="20" style="opacity: 80%">
				{{ value ? "mdi-chevron-up" : "mdi-chevron-right" }}
			</v-icon>
		</template>
		<div class="v-list pb-4 pt-0">
			<sidebar-tab
				v-for="subtab in tab.subtabs"
				:key="subtab.id"
				:subtab="subtab"
				:parent="tab.id"
				:badges="badges"
				@select="$emit('autoClose')"
			/>
		</div>
	</v-list-group>
</template>

<script>
import SidebarTab from "./sidebar-tab.vue";

export default {
	name: "sidebar-category",
	components: {
		SidebarTab,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		initOpen: {
			type: Boolean,
			required: false,
			default: true,
		},
		tab: {
			type: Object,
			required: true,
		},
		badges: {
			type: Object,
			required: true,
		},
	},
};
</script>
