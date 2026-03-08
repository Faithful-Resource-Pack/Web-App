<template>
	<v-list-item class="mb-1">
		<v-list-item-content>
			<v-list-item-title>
				<template v-if="texture.name">{{ texture.name }}</template>
				<i v-else>{{ $root.lang().database.nameless }}</i>
				• {{ summaryString }}
			</v-list-item-title>
			<v-list-item-subtitle>
				<span v-if="texture.tags.length">{{ texture.tags.join(", ") }}</span>
				<i v-else>{{ $root.lang().database.textures.modal.tagless }}</i>
			</v-list-item-subtitle>
		</v-list-item-content>
		<v-list-item-action>
			<v-btn icon :color="selected ? color : 'red lighten-1'" @click="$emit('delete')">
				<v-icon>mdi-delete</v-icon>
			</v-btn>
		</v-list-item-action>
	</v-list-item>
</template>

<script>
// much cleaner as separate component for encapsulated state
export default {
	name: "summary-item",
	props: {
		texture: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			required: false,
			default: false,
		},
		color: {
			type: String,
			required: false,
			default: "primary",
		},
	},
	computed: {
		summaryString() {
			const texStrings = this.$root.lang().database.textures;
			// bit cleaner than using a ton of nested ternaries
			let strBuilder = `${this.texture.uses.length} `;
			strBuilder +=
				this.texture.uses.length === 1 ? texStrings.uses.singular : texStrings.uses.plural;
			const pathCount = this.texture.uses.reduce((acc, cur) => acc + cur.paths.length, 0);
			strBuilder += `, ${pathCount} `;
			strBuilder += pathCount === 1 ? texStrings.paths.singular : texStrings.paths.plural;
			return strBuilder;
		},
	},
};
</script>
