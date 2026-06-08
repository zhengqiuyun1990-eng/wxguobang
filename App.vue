<script>
import { getToken, api, saveSiteConfig } from '@/utils/request.js'

export default {
	onLaunch() {
		this.loadSiteConfig()
	},
	onShow() {
		console.log('App Show')
	},
	onHide() {
		console.log('App Hide')
	},
	methods: {
		async loadSiteConfig() {
			if (!getToken()) return
			try {
				const data = await api.siteConfig()
				saveSiteConfig(data)
			} catch (e) { /* 未登录或接口不可用 */ }
		}
	}
}
</script>

<style lang="scss">
@import '@/uni_modules/uni-scss/index.scss';
/* #ifndef APP-NVUE */
@import '@/static/customicons.css';
page {
	background-color: #f5f5f5;
}
/* #endif */
</style>
