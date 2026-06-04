<template>
	<view class="page">
		<view class="step">第 3 / 4 步 · 项目服务费</view>
		<view class="card pay">
			<text class="amount">¥ 200</text>
			<text class="amount-sub">项目服务费 / 项目</text>
		</view>

		<view class="card">
			<view class="row">
				<text class="lbl">申请发票</text>
				<switch :checked="d.invoiceNeed" color="#4ADE80" @change="e => d.invoiceNeed = e.detail.value" />
			</view>
			<view class="row" v-if="d.invoiceNeed">
				<text class="lbl">发票抬头</text>
				<input class="ipt" placeholder="公司名称" v-model="d.invoiceTitle" />
			</view>
			<view class="row" v-if="d.invoiceNeed">
				<text class="lbl">税号</text>
				<input class="ipt" placeholder="纳税人识别号" v-model="d.invoiceNo" />
			</view>
		</view>

		<button class="primary" @tap="pay">立即支付 ¥200</button>
		<view class="hint">不限一人，多人协作创建</view>
	</view>
</template>

<script>
import { draft } from '@/utils/store.js'
export default {
	data() { return { d: draft.project } },
	onShow() { this.d = draft.project },
	methods: {
		pay() {
			uni.showLoading({ title: '支付中...' })
			setTimeout(() => {
				uni.hideLoading()
				uni.showToast({ title: '支付成功', icon: 'success' })
				setTimeout(() => uni.navigateTo({ url: '/pages/project/allocate' }), 600)
			}, 800)
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.step { font-size: 24rpx; color:#16A34A; padding: 8rpx 16rpx; background:#ECFDF5; display:inline-block; border-radius: 999px; }
.card { background:#fff; border-radius: 20rpx; padding: 0 28rpx; margin-top: 24rpx; }
.pay { padding: 60rpx; display:flex; flex-direction:column; align-items:center; background: linear-gradient(135deg,#ECFDF5,#fff); }
.amount { font-size: 80rpx; font-weight: 800; color: #16A34A; }
.amount-sub { color:#666; font-size: 26rpx; margin-top: 8rpx; }
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.row:last-child { border-bottom: none; }
.lbl { width: 180rpx; font-size: 28rpx; color: #333; }
.ipt { flex:1; font-size: 28rpx; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; padding: 22rpx 0; font-size: 32rpx; font-weight: 600; }
.hint { color:#bbb; text-align:center; font-size: 22rpx; margin-top: 16rpx; }
</style>
