<template>
	<v-card class="review-list overflow-y-auto rounded-lg">
		<v-list-item
			v-for="(item, i) in sortedItems"
			:key="item.key"
			two-line
			:class="classes[i]"
			@click="$emit('input', item.key)"
		>
			<v-list-item-content>
				<v-list-item-title>{{ item.primary }}</v-list-item-title>
				<v-list-item-subtitle>{{ item.secondary }}</v-list-item-subtitle>
			</v-list-item-content>
		</v-list-item>
	</v-card>
</template>

<script>
export default {
	name: "review-list",
	props: {
		// throws error on initial load when required since it takes a second to fetch results
		value: {
			type: String,
			required: false,
			default: undefined,
		},
		items: {
			type: Array, // { primary: String, secondary: String, key: Number }[]
			required: true,
		},
		activeColor: {
			type: String,
			required: true,
		},
	},
	computed: {
		sortedItems() {
			// newest to oldest (could maybe add a sort mode but eh)
			return Array.from(this.items).sort((a, b) => b.key - a.key);
		},
		classes() {
			return this.sortedItems.map(({ key }) =>
				key === this.value ? `${this.activeColor} selected` : "",
			);
		},
	},
};
</script>
