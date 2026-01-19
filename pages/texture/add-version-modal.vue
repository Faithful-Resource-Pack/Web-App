<template>
	<modal-form
		v-model="modalOpened"
		:title="$root.lang().database.textures.add_version.title"
		:disabled="!isValid"
		danger
		@close="$emit('close')"
		@submit="send"
	>
		<v-form ref="form">
			<v-select
				v-model="form.edition"
				:color="color"
				:item-color="color"
				:items="editions"
				:label="$root.lang().database.textures.add_version.new_edition"
				@change="(e) => onEditionChange(e)"
			/>
			<v-select
				v-model="form.version"
				:color="color"
				:item-color="color"
				:items="availableTemplateVersions"
				:disabled="!form.edition"
				:label="$root.lang().database.textures.add_version.template_version"
			/>
			<v-text-field
				v-model="form.newVersion"
				:color="color"
				:autofocus="!$vuetify.breakpoint.mobile"
				:label="$root.lang().database.textures.add_version.new_version"
				:rules="rules"
			/>
		</v-form>
	</modal-form>
</template>

<script>
import ModalForm from "@layouts/modal-form.vue";
import axios from "axios";

export default {
	name: "add-version-modal",
	components: {
		ModalForm,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		color: {
			type: String,
			required: false,
			default: "primary",
		},
	},
	data() {
		const defaultEdition = settings.editions[0];
		return {
			modalOpened: false,
			editions: settings.editions,
			rules: [
				(input) => !this.versionExists(input) || this.$root.lang().database.textures.version_exists,
			],
			form: {
				edition: defaultEdition,
				version: settings.versions[defaultEdition][0] || "",
				newVersion: "",
			},
		};
	},
	methods: {
		onEditionChange(edition) {
			this.form.version = settings.versions[edition][0];
		},
		versionExists(version) {
			return Object.values(settings.versions).flat().includes(version);
		},
		send() {
			axios
				.post(`${this.$root.apiURL}/paths/versions/add`, this.form, this.$root.apiOptions)
				.then(() => {
					this.$root.showSnackBar(
						this.$root.lang().database.textures.add_version.success,
						"success",
					);
					this.$root.reloadSettings();
					this.$emit("close");
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
	},
	computed: {
		availableTemplateVersions() {
			return settings.versions[this.form.edition] || [];
		},
		isValid() {
			if (!this.form.newVersion) return false;
			// cannot rename to an existing version, completely bricks the db (lol)
			if (this.versionExists(this.form.newVersion)) return false;
			return true;
		},
	},
	watch: {
		value(newValue) {
			this.modalOpened = newValue;
		},
		modalOpened(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
