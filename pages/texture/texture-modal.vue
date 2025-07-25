<template>
	<modal-form v-model="modalOpened" :title="modalTitle" @close="$emit('close')" @submit="send">
		<use-modal
			v-model="useModalOpen"
			:color="color"
			:add="useModalAdd"
			:textureID="formData.id"
			:data="useModalData"
			@close="closeUseModal"
		/>
		<texture-remove-confirm
			v-model="remove.open"
			type="use"
			:data="remove.data"
			@close="closeAndUpdate"
		/>
		<v-form ref="form">
			<v-text-field
				v-model="formData.id"
				:disabled="!add"
				:color="color"
				persistent-hint
				:hint="'⚠️' + $root.lang().database.textures.modal.id_hint"
				required
				:readonly="add == false"
				:label="$root.lang().database.textures.modal.id"
			/>
			<v-text-field
				v-model="formData.name"
				:color="color"
				required
				clearable
				:label="$root.lang().database.textures.modal.name"
			/>
			<v-combobox
				v-model="formData.tags"
				:color="color"
				:item-color="color"
				required
				multiple
				deletable-chips
				small-chips
				:items="tags"
				:label="$root.lang().database.textures.modal.tags"
				@change="
					() => {
						formData.tags = sortTags(formData.tags);
					}
				"
			/>

			<h2 class="title">{{ $root.lang().database.textures.uses.title }}</h2>
			<v-list v-if="Object.keys(formData.uses).length">
				<v-list-item v-for="(use, index) in formData.uses" :key="index" class="px-0">
					<v-list-item-avatar
						tile
						:class="[color, 'white--text']"
						:style="{
							padding: '0 10px 0 10px',
							'border-radius': '4px !important',
							width: 'auto',
						}"
					>
						#{{ index }}
					</v-list-item-avatar>

					<v-list-item-content>
						<v-list-item-title>
							<v-list-item style="display: inline; padding: 0 0 0 5px">
								<template v-if="use.name">{{ use.name }}</template>
								<template v-else>
									<i>{{ $root.lang().database.nameless }}</i>
								</template>
							</v-list-item>
							<v-list-item-subtitle style="display: block; padding: 0 0 0 5px">
								{{ use.edition }}
							</v-list-item-subtitle>
						</v-list-item-title>
					</v-list-item-content>

					<v-list-item-action class="merged">
						<v-btn icon @click="openUseModal(use, false)">
							<v-icon color="lighten-1">mdi-pencil</v-icon>
						</v-btn>
						<v-btn icon @click="askRemoveUse(use)">
							<v-icon color="red lighten-1">mdi-delete</v-icon>
						</v-btn>
					</v-list-item-action>
				</v-list-item>
			</v-list>
			<div v-else>{{ $root.lang().database.textures.uses.no_use_found }}</div>

			<v-btn block class="mt-2" color="secondary" @click="openUseModal(null, true)">
				{{ $root.lang().database.textures.uses.add_use }}
				<v-icon right>mdi-plus</v-icon>
			</v-btn>
			<v-btn
				v-if="Object.keys(formData.uses).length === 1"
				block
				class="white--text mt-2"
				:color="color"
				@click="openEditionUseModal"
			>
				{{ addEditionUseLabel }}
				<v-icon right>mdi-plus</v-icon>
			</v-btn>
		</v-form>
	</modal-form>
</template>

<script>
import axios from "axios";

import ModalForm from "@components/modal-form.vue";
import UseModal from "./use-modal.vue";
import TextureRemoveConfirm from "./texture-remove-confirm.vue";
import { formatTag, sortTags } from "@helpers/textures";
import { getTagFromPath, convertEditionPath } from "@helpers/paths";

export default {
	name: "texture-modal",
	components: {
		ModalForm,
		UseModal,
		TextureRemoveConfirm,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		add: {
			type: Boolean,
			required: false,
			default: false,
		},
		data: {
			type: Object,
			required: true,
		},
		tags: {
			type: Array,
			required: false,
			default: () => [],
		},
		color: {
			type: String,
			required: false,
			default: "primary",
		},
	},
	data() {
		return {
			modalOpened: false,
			formData: {
				name: "",
				tags: [],
				id: "",
				uses: {},
			},
			useModalOpen: false,
			useModalData: {},
			useModalAdd: false,
			remove: {
				open: false,
				data: {},
			},
		};
	},
	computed: {
		modalTitle() {
			return this.add
				? this.$root.lang().database.textures.add_texture
				: this.$root.lang().database.textures.change_texture;
		},
		addEditionUseLabel() {
			if (!Object.keys(this.formData).length) return;
			const newEdition = this.getCorrespondingEdition(Object.values(this.formData.uses)[0].edition);
			return this.$root
				.lang()
				.database.textures.uses.add_edition_use.replace("%edition%", newEdition.toTitleCase());
		},
	},
	methods: {
		getCorrespondingEdition(edition) {
			return settings.editions.find((e) => e !== edition) || "bedrock";
		},
		openUseModal(data, add) {
			this.useModalOpen = true;
			this.useModalAdd = add;
			this.useModalData = data || { texture: this.formData.id };
		},
		openEditionUseModal() {
			// we already know at least one use exists at this point
			const use = Object.values(this.formData.uses)[0];
			const newEdition = this.getCorrespondingEdition(use.edition);
			axios
				.get(`${this.$root.apiURL}/uses/${use.id}/paths`)
				.then((res) => {
					this.useModalData = {
						edition: newEdition,
						name: use.name,
						texture: this.formData.id,
						paths: res.data.map((path) => ({
							name: convertEditionPath(path.name, newEdition),
							versions: [settings.versions[newEdition][0]],
							mcmeta: false,
						})),
					};
					this.useModalAdd = true;
					this.useModalOpen = true;
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
		closeUseModal() {
			// fix for previous modal's paths showing up in blank one
			this.useModalData = {};
			this.getUses(this.formData.id);
		},
		closeAndUpdate() {
			this.getUses(this.formData.id);
		},
		send() {
			if (!this.$root.isLoggedIn) return;

			const data = {
				name: this.formData.name,
				tags: sortTags(this.formData.tags),
			};

			// modal isn't used for adding anymore but oh well
			const promise = this.add
				? axios.post(`${this.$root.apiURL}/textures`, data, this.$root.apiOptions)
				: axios.put(
						`${this.$root.apiURL}/textures/${this.formData.id}`,
						data,
						this.$root.apiOptions,
					);

			promise
				.then(() => {
					this.$root.showSnackBar(this.$root.lang().global.ends_success, "success");
					this.$emit("close", true);
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
		recomputeTagList() {
			// compute based on existing paths and uses
			axios
				.get(`${this.$root.apiURL}/textures/${this.formData.id}/paths`, this.$root.apiOptions)
				.then((res) => {
					this.formData.tags = sortTags([
						...Object.values(this.formData.uses).map(({ edition }) => edition.toTitleCase()),
						...(res.data || []).map((path) => formatTag(getTagFromPath(path.name))),
					]);
				})
				.catch((err) => console.error(err));
		},
		getUses(textureID) {
			axios
				.get(`${this.$root.apiURL}/textures/${textureID}/uses`, this.$root.apiOptions)
				.then((res) => {
					this.formData.uses = Object.values(res.data).reduce((acc, cur) => {
						acc[cur.id] = cur;
						return acc;
					}, {});
					// recompute tag list once uses are loaded
					this.recomputeTagList();
				})
				.catch((err) => console.error(err));
		},
		askRemoveUse(data) {
			this.remove.data = data;
			this.remove.open = true;
		},
	},
	watch: {
		value(newValue) {
			this.modalOpened = newValue;
		},
		modalOpened(newValue) {
			this.$nextTick(() => {
				if (this.add) this.$refs.form.reset();
				else {
					this.formData.name = this.data.name;
					this.formData.tags = this.data.tags;
					this.formData.id = this.data.id;
					this.getUses(this.data.id);
				}
			});
			this.$emit("input", newValue);
		},
	},
};
</script>
