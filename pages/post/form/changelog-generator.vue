<template>
	<!-- not extending modal-form since this has no action buttons -->
	<v-dialog v-model="modalOpened" max-width="800">
		<v-card>
			<v-card-title class="headline">
				{{ $root.lang().posts.changelog_generator.heading }}
			</v-card-title>
			<v-card-text>
				<v-alert type="warning" outlined dense>
					<h3 v-if="categorize" class="font-weight-black mb-1">
						{{ $root.lang().posts.changelog_generator.categorize_warning }}
					</h3>
					{{ $root.lang().posts.changelog_generator.warning }}
				</v-alert>
				<v-form>
					<v-text-field
						v-model="date"
						:label="$root.lang().posts.changelog_generator.date"
						:placeholder="$root.lang().posts.general.date.placeholder"
						:autofocus="!$vuetify.breakpoint.mobile"
						persistent-placeholder
					/>
					<v-select
						v-model="selectedPack"
						:label="$root.lang().posts.changelog_generator.pack"
						:items="packs"
						item-text="name"
						item-value="id"
					/>
					<v-switch
						v-model="categorize"
						:label="$root.lang().posts.changelog_generator.categorize"
					/>
				</v-form>
				<v-btn block color="secondary" :disabled="formInvalid" :loading="loading" @click="generate">
					<v-icon left>mdi-pencil</v-icon>
					{{ $root.lang().posts.changelog_generator.heading }}
				</v-btn>
				<template v-if="outputData">
					<v-divider class="my-5" />
					<v-row>
						<v-col>
							<v-btn block color="secondary" @click="copyData">
								<v-icon left>mdi-content-copy</v-icon>
								{{ $root.lang().posts.changelog_generator.copy }}
							</v-btn>
						</v-col>
						<v-col>
							<v-btn block color="secondary" :href="fileURL" :download="fileName">
								<v-icon left>mdi-download</v-icon>
								{{ $root.lang().posts.changelog_generator.download }}
							</v-btn>
						</v-col>
					</v-row>
					<prism-editor
						v-model="outputData"
						class="json-editor json-modal-editor mt-5"
						readonly
						:highlight="highlighter"
					/>
				</template>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script>
import axios from "axios";

import Prism from "prismjs";
import { PrismEditor } from "vue-prism-editor";

export default {
	name: "changelog-generator",
	components: {
		PrismEditor,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
	},
	data() {
		return {
			date: "",
			selectedPack: "",
			modalOpened: false,
			packs: [],
			loading: false,
			categorize: false,
			outputData: "",
			fileURL: "",
			idToUsername: {},
		};
	},
	methods: {
		highlighter(code) {
			return Prism.highlight(code, Prism.languages.js, "json");
		},
		copyData() {
			navigator.clipboard.writeText(this.outputData);
			this.$root.showSnackBar(this.$root.lang().database.textures.modal.copy_json_data, "success");
		},
		getData() {
			return Promise.all([
				axios
					.get(`${this.$root.apiURL}/contributions/search?packs=${this.selectedPack}`)
					.then((res) => Object.values(res.data)),
				// keep keys for fast retrieval (optimization)
				axios.get(`${this.$root.apiURL}/textures/raw`).then((res) => res.data),
			]).catch((err) => {
				this.loading = false;
				this.$root.showSnackBar(err, "error");
				return [null, null];
			});
		},
		mergeContribution(texture, contribution) {
			if (!texture) {
				this.$root.showSnackBar(
					`Texture [#${texture.id}] doesn't exist anymore! (${contribution.id})`,
					"error",
				);
				return null;
			}
			return {
				id: texture.id,
				name: texture.name,
				tags: texture.tags.filter((tag) => !["java", "bedrock"].includes(tag.toLowerCase())).sort(),
				date: contribution.date,
				authors: contribution.authors.map((author) => this.idToUsername[author] || "Anonymous"),
			};
		},
		formatContributions(contributions) {
			// group by texture tag (easier than going off paths)
			return contributions.reduce((acc, { tags, name, authors }) => {
				acc[tags[0]] ||= [];
				acc[tags[0]].push(`${name.toTitleCase()} (${(authors || []).listify()})`);
				return acc;
			}, {});
		},
		categorizeAndFormat(allContributions, changelogContributions) {
			if (this.categorize) {
				const categorized = changelogContributions.reduce(
					(acc, cur) => {
						const hasExisting = allContributions.filter((c) => c.texture === cur.id).length > 1;
						acc[hasExisting ? "Changed" : "Added"].push(cur);
						return acc;
					},
					{ Added: [], Changed: [] },
				);
				// this should probably be done programmatically but whatever
				return {
					Added: this.formatContributions(categorized.Added),
					Changed: this.formatContributions(categorized.Changed),
				};
			}

			return this.formatContributions(changelogContributions);
		},
		async generate() {
			this.loading = true;
			const [allContributions, textures] = await this.getData();

			if (allContributions === null) return;

			const finalData = allContributions
				// get correct date
				.filter((contribution) => contribution.date > this.numericDate)
				// merge the two objects by id
				.map((contribution) => this.mergeContribution(textures[contribution.texture], contribution))
				// remove duplicates
				.reduce((acc, cur) => {
					if (cur === null) return acc;
					// newer date wins
					if (acc[cur.id] === undefined || acc[cur.id]?.date < cur.date) acc[cur.id] = cur;
					return acc;
				}, {});

			const formatted = this.categorizeAndFormat(allContributions, Object.values(finalData));
			this.outputData = JSON.stringify(formatted, null, 2);
			this.loading = false;
			this.$root.showSnackBar(this.$root.lang().global.ends_success, "success");
		},
	},
	computed: {
		formInvalid() {
			return !this.date || !this.selectedPack;
		},
		numericDate() {
			return new Date(this.date).getTime();
		},
		fileBlob() {
			return new Blob([this.outputData], { type: "text/json" });
		},
		fileName() {
			return `changelog-${this.selectedPack}.json`;
		},
	},
	watch: {
		value(newValue) {
			this.modalOpened = newValue;
		},
		modalOpened(newValue) {
			this.$emit("input", newValue);
		},
		// done in a watcher since you have to revoke the old url before creating a new one
		fileBlob: {
			handler(newValue) {
				if (this.fileURL) URL.revokeObjectURL(this.fileURL);
				this.$nextTick(() => {
					this.fileURL = URL.createObjectURL(newValue);
				});
			},
			deep: true,
		},
	},
	created() {
		axios.get(`${this.$root.apiURL}/packs/search?type=submission`).then((res) => {
			this.packs = res.data;
		});

		// only need contributors since only contributors can appear in changelogs
		axios.get(`${this.$root.apiURL}/contributions/authors`).then((res) => {
			this.idToUsername = res.data.reduce((acc, cur) => {
				acc[cur.id] = cur.username;
				return acc;
			}, {});
		});
	},
	unmounted() {
		// clean up download button
		if (this.fileURL) URL.revokeObjectURL(this.fileURL);
	},
};
</script>
