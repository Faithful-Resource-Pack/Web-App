<template>
	<modal-form
		v-model="modalOpened"
		:title="$root.lang().database.textures.rename_version.title"
		:disabled="!isValid"
		danger
		button-type="confirm"
		@close="$emit('close')"
		@submit="send"
	>
		<p>{{ $root.lang().database.textures.rename_version.example }}</p>
		<v-alert type="warning" outlined dense>
			{{ $root.lang().database.textures.rename_version.warning }}
		</v-alert>
		<v-form ref="form" class="pt-2">
			<v-select
				v-model="form.old"
				:color="color"
				:item-color="color"
				:items="versions"
				required
				:label="$root.lang().database.textures.rename_version.current_version"
			/>
			<v-text-field
				v-model="form.new"
				:color="color"
				:autofocus="!$vuetify.breakpoint.mobile"
				required
				:label="$root.lang().database.textures.rename_version.new_version"
				:rules="rules"
			/>
		</v-form>
	</modal-form>
</template>

<script>
import ModalForm from "@layouts/modal-form.vue";
import axios from "axios";

export default {
	name: "rename-version-modal",
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
			versions: Object.values(settings.versions).flat(),
			rules: [
				(input) => !this.versionExists(input) || this.$root.lang().database.textures.version_exists,
			],
			form: {
				// convenience feature
				old: settings.versions[defaultEdition][0] || "",
				new: "",
			},
		};
	},
	methods: {
		versionExists(version) {
			return this.versions.includes(version);
		},
		send() {
			axios
				.put(
					`${this.$root.apiURL}/paths/versions/rename/${this.form.old}/${this.form.new}`,
					null,
					this.$root.apiOptions,
				)
				.then(() => {
					this.$root.showSnackBar(this.$root.lang().global.ends_success, "success");
					this.$root.reloadSettings();
					this.$emit("close", true);
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
	},
	computed: {
		isValid() {
			if (!this.form.new) return false;
			// cannot rename to an existing version, completely bricks the db (lol)
			if (this.versionExists(this.form.new)) return false;
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
