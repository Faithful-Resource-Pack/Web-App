<template>
	<v-list-item class="contribution-summary-item mb-1">
		<v-list-item-content>
			<v-list-item-title>{{ title }}</v-list-item-title>
			<v-list-item-subtitle class="text-truncate">
				<span v-if="contrib.authors?.length">{{ subtitle }}</span>
				<i v-else>{{ $root.lang().database.contributions.no_contributor_yet }}</i>
			</v-list-item-subtitle>
			<v-list-item-subtitle v-if="contrib.texture?.length">
				<v-chip
					v-for="range in contrib.texture"
					:key="formatRange(range)"
					class="mr-1 px-2"
					x-small
				>
					{{ formatRange(range) }}
				</v-chip>
			</v-list-item-subtitle>
		</v-list-item-content>
		<v-list-item-action>
			<v-btn icon :color="selected ? 'primary' : 'red lighten-1'" @click="$emit('delete')">
				<v-icon>mdi-delete</v-icon>
			</v-btn>
		</v-list-item-action>
	</v-list-item>
</template>

<script>
import moment from "moment";

export default {
	name: "summary-item",
	props: {
		contrib: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			required: false,
			default: false,
		},
		packToName: {
			type: Object,
			required: true,
		},
		contributors: {
			type: Array,
			required: true,
		},
	},
	methods: {
		formatRange(range) {
			if (Array.isArray(range)) return `#${range.join(" – #")}`;
			return `#${range}`;
		},
	},
	computed: {
		title() {
			const pack = this.packToName[this.contrib.pack] || this.contrib.pack;
			const formattedDate = moment(new Date(this.contrib.date)).format("ll");
			return `${pack} • ${formattedDate}`;
		},
		subtitle() {
			const groupedContributors = this.contributors.reduce((acc, cur) => {
				acc[cur.id] = cur;
				return acc;
			}, {});

			const authorObjs = this.contrib.authors.map((author) => groupedContributors[author] || {});

			const knownAuthors = authorObjs.map((author) => author.username).filter((n) => n);
			const anonymousCount = authorObjs.filter((author) => !author.username).length;

			const total = knownAuthors.length + anonymousCount;

			const formattedAuthors =
				anonymousCount > 0
					? [`${anonymousCount} ${this.$root.lang().database.anonymous}`, ...knownAuthors]
					: knownAuthors;

			return `[${total}]: ${formattedAuthors.join(", ")}`;
		},
	},
};
</script>

<style lang="scss">
// for some reason this style type only applies to navigation-level selectable list elements
.contribution-summary-item::before {
	border-radius: 4px;
}
</style>
