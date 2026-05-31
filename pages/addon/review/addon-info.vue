<template>
	<div>
		<v-list-item-title class="uppercase">{{ authorLabel }}</v-list-item-title>
		<div class="text--secondary mb-2">{{ addonAuthors }}</div>

		<v-list-item-title class="uppercase">
			{{ $root.lang().review.addon.titles.links }}
		</v-list-item-title>
		<div class="text--secondary mb-2">
			<ul v-for="file in addonInPanel.files.filter((f) => f.use === 'download')" :key="file.id">
				<li>
					<a :href="file.source" target="_blank" rel="noopener noreferrer">
						{{ file.name }}
					</a>
				</li>
			</ul>
		</div>

		<v-list-item-title class="uppercase">
			{{ $root.lang().review.addon.titles.compatibility }}
		</v-list-item-title>
		<div class="text--secondary mb-2">
			<div>
				<v-icon small>{{ checked(addonInPanel.options.tags.includes("Java")) }}</v-icon>
				Java Edition
			</div>
			<div>
				<v-icon small>{{ checked(addonInPanel.options.tags.includes("Bedrock")) }}</v-icon>
				Bedrock Edition
			</div>
			<div>
				<v-icon small>{{ checked(addonInPanel.options.optifine) }}</v-icon>
				{{ $root.lang().review.addon.labels.optifine }}
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "addon-info",
	props: {
		addonInPanel: {
			type: Object,
			required: true,
		},
		// optimization
		getUsername: {
			type: Function,
			required: true,
		},
	},
	methods: {
		checked(option) {
			return option ? "mdi-checkbox-marked-outline" : "mdi-checkbox-blank-outline";
		},
	},
	computed: {
		authorLabel() {
			const key = this.addonInPanel.authors.length === 1 ? "author_singular" : "author_plural";
			return this.$root.lang().review.addon.titles[key];
		},
		addonAuthors() {
			return this.addonInPanel.authors.map((id) => this.getUsername(id)).join(", ");
		},
	},
};
</script>
