<template>
	<v-container id="versionPage">
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="styles" v-html="pageStyles" />

		<new-version-modal v-model="newVersionModalOpen" :color="pageColor" />

		<version-modal v-model="editModal.open" :data="editModal.data" :color="pageColor" />
		<version-remove-confirm v-model="remove.open" :data="remove.data" @close="update" />

		<v-row no-gutters class="py-0 mb-0" align="center">
			<v-col cols="12" sm="6">
				<div class="text-h4 py-4">
					{{ $root.lang().database.versions.title }}
				</div>
			</v-col>
			<v-col cols="12" sm="6">
				<v-btn block :color="pageColor" class="white--text" @click="openNewVersionModal">
					<v-icon left>mdi-plus</v-icon>
					{{ $root.lang().database.versions.add.title }}
				</v-btn>
			</v-col>
		</v-row>

		<!-- tag switcher -->
		<div class="my-2 text-h5">{{ $root.lang().database.versions.edition_filter }}</div>
		<div class="selector">
			<v-btn
				v-for="versionEdition in editions"
				:key="versionEdition"
				:class="['my-1 mr-2', activeEdition(versionEdition)]"
				:to="versionURL(versionEdition)"
				:exact="versionEdition === 'all'"
			>
				{{ versionEdition }}
			</v-btn>
		</div>

		<div class="my-2 text-h5">{{ $root.lang().database.versions.version_result }}</div>

		<div v-if="!Object.keys(paths).length" class="text-center">
			<v-progress-circular :size="70" :width="7" indeterminate :color="pageColor" />
		</div>
		<smart-grid
			v-else
			:items="grouped"
			:pageColor="pageColor"
			:textColor="textColorOnPage"
			:maxColumns="2"
			track="version"
		>
			<template #default="{ item }">
				<a
					:href="`/gallery/${item.edition}/default/${item.version}/all`"
					target="_blank"
					rel="noopener noreferrer"
				>
					<v-list-item-avatar class="database-list-avatar text--primary">
						<v-icon large>{{ item.latest ? "mdi-tag-arrow-up" : "mdi-tag" }}</v-icon>
					</v-list-item-avatar>
				</a>

				<v-list-item-content>
					<v-list-item-title>
						{{ item.version }} • {{ item.edition.toTitleCase() }}&nbsp;Edition
					</v-list-item-title>
					<v-list-item-subtitle>{{ pathCount(item.paths) }}</v-list-item-subtitle>
				</v-list-item-content>

				<v-list-item-action class="merged-actions">
					<v-btn icon @click="openModal(item)">
						<v-icon color="lighten-1">mdi-pencil</v-icon>
					</v-btn>
					<v-btn icon @click="askRemove(item)">
						<v-icon color="red lighten-1">mdi-delete</v-icon>
					</v-btn>
				</v-list-item-action>
			</template>
		</smart-grid>
	</v-container>
</template>

<script>
import axios from "axios";
import SmartGrid from "@layouts/smart-grid.vue";

import NewVersionModal from "./new-version-modal.vue";
import VersionModal from "./version-modal.vue";
import VersionRemoveConfirm from "./version-remove-confirm.vue";
import { generatePageStyles } from "@helpers/colors";

export default {
	name: "version-page",
	components: {
		SmartGrid,
		NewVersionModal,
		VersionModal,
		VersionRemoveConfirm,
	},
	data() {
		return {
			pageColor: "pink lighten-1",
			textColorOnPage: "white--text",
			pageStyles: "",
			paths: {},
			newVersionModalOpen: false,
			editModal: {
				open: false,
				data: {},
			},
			remove: {
				open: false,
				data: {},
			},
		};
	},
	methods: {
		activeEdition(t) {
			const result = {};
			result[`v-btn--active ${this.pageColor} ${this.textColorOnPage}`] =
				(t === "all" && !this.edition) ||
				(t && this.edition && t.toLowerCase() === this.edition.toLowerCase());

			return result;
		},
		versionURL(edition) {
			return `/versions/${edition || "all"}`;
		},
		pathCount(count) {
			const strings = this.$root.lang().database.versions;
			if (count === 0) return strings.no_paths;
			return strings[count === 1 ? "path_count_singular" : "path_count_plural"].replace(
				"%d",
				count,
			);
		},
		openNewVersionModal() {
			this.newVersionModalOpen = true;
		},
		openModal(data) {
			this.editModal.data = data;
			this.editModal.open = true;
		},
		askRemove(item) {
			this.remove.data = item;
			this.remove.open = true;
		},
		update(success) {
			this.remove.open = false;
			if (success) this.$root.reloadSettings();
		},
	},
	computed: {
		grouped() {
			return Object.entries(settings.versions)
				.flatMap(([k, v]) =>
					v.map((version, i) => ({
						edition: k,
						version,
						paths: this.paths[version] || 0,
						latest: i === 0,
					})),
				)
				.filter(({ edition }) => (this.edition === "all" ? true : this.edition === edition))
				.sort((a, b) => {
					if (a.latest) return -1;
					b.paths - a.paths;
				});
		},
		editions() {
			return ["all", ...settings.editions];
		},
		edition() {
			return this.$route.params.edition || "all";
		},
	},
	created() {
		axios.get(`${this.$root.apiURL}/paths/raw`).then((res) => {
			this.paths = Object.values(res.data)
				.flatMap((path) => path.versions)
				.reduce((acc, cur) => {
					acc[cur] ||= 0;
					++acc[cur];
					return acc;
				}, {});
		});
	},
	mounted() {
		this.pageStyles = generatePageStyles(this, this.pageColor);
	},
};
</script>
