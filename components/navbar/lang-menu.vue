<template>
	<v-list class="pt-0" dense nav>
		<v-subheader class="font-weight-black text-uppercase text-center justify-center text--primary">
			{{ $root.lang().global.translations }}
		</v-subheader>
		<v-list-item
			v-for="lang in languages"
			:key="lang.bcp47"
			class="cursor-pointer text-left"
			:class="{ 'v-list-item--active': lang.id === $root.selectedLang }"
			dense
			@click="$emit('update', lang.id)"
		>
			<v-list-item-avatar min-width="24" :width="24" max-width="24" :height="18" class="rounded-0">
				<v-img
					:src="`https://flagcdn.com/24x18/${lang.iso3166}.png`"
					:srcset="`
								https://flagcdn.com/32x24/${lang.iso3166}.png 2x,
								https://flagcdn.com/48x36${lang.iso3166}.png 3x`"
					width="24"
					height="18"
				/>
			</v-list-item-avatar>
			<v-list-item-title class="uppercase">{{ lang.id }}</v-list-item-title>
		</v-list-item>
	</v-list>
</template>

<script>
export default {
	name: "lang-menu",
	props: {
		languages: {
			type: Array,
			required: true,
		},
	},
};
</script>
