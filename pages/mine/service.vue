<template>
	<view class="page">
		<view class="card">
			<text class="t">客服热线</text>
			<text class="v">{{ hotline }}</text>
			<button class="primary" @tap="call">立即拨打</button>
		</view>
		<view class="card">
			<text class="t">在线客服</text>
			<text class="s">{{ serviceHours }}</text>
			<button class="ghost" @tap="online">联系在线客服</button>
		</view>
		<view class="card">
			<text class="t">常见问题</text>
			<view class="q">Q：磅票上传后多久审核？</view>
			<view class="a">A：发货 / 收货过磅人对账后立即生效。</view>
			<view class="q">Q：损耗如何计算？</view>
			<view class="a">A：装货净重 - 卸货净重 = 损耗。</view>
		</view>
	</view>
</template>

<script>
import { loadSiteConfig } from '@/utils/request.js'

export default {
	data() {
		return {
			hotline: '400-888-0000',
			serviceHours: '工作日 9:00 - 18:00'
		}
	},
	onShow() {
		const cfg = loadSiteConfig()
		if (!cfg) return
		const row = cfg.row || cfg
		if (row.hotline || row.service_phone || row.tel) {
			this.hotline = row.hotline || row.service_phone || row.tel
		}
		if (row.service_hours || row.work_time) {
			this.serviceHours = row.service_hours || row.work_time
		}
	},
	methods: {
		call() {
			const num = String(this.hotline).replace(/[^\d]/g, '')
			uni.makePhoneCall({ phoneNumber: num || '4008880000' })
		},
		online() { uni.showToast({ title: '已连接在线客服', icon: 'success' }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; }
.t { font-size: 28rpx; font-weight: 700; color:#111; display:block; }
.v { font-size: 44rpx; font-weight: 800; color: #16A34A; margin-top: 12rpx; display:block; }
.s { font-size: 24rpx; color:#888; display:block; margin-top: 8rpx; }
.primary { margin-top: 24rpx; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 28rpx; }
.ghost { margin-top: 24rpx; background:#fff; color:#16A34A; border:1rpx solid #4ADE80; border-radius: 999px; font-size: 28rpx; }
.q { font-size: 26rpx; color:#111; margin-top: 16rpx; }
.a { font-size: 24rpx; color:#666; margin-top: 6rpx; }
</style>
