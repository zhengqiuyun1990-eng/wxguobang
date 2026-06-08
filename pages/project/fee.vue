<template>
	<view class="page">
		<view class="step">第 3 / 4 步 · 项目服务费</view>
		<view class="card pay">
			<text class="amount">¥ {{ serviceFee }}</text>
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

		<button class="primary" :disabled="submitting" @tap="pay">{{ submitting ? '支付中...' : '立即支付 ¥' + serviceFee }}</button>
		<view class="hint">不限一人，多人协作创建</view>
	</view>
</template>

<script>
import { draft, requireLogin } from '@/utils/store.js'
import { api, pollProjectPaid, loadSiteConfig, saveSiteConfig, getProjectPrice } from '@/utils/request.js'
import { buildCreateProjectPayload, invokeWechatPay } from '@/utils/api-util.js'

export default {
	data() { return { d: draft.project, submitting: false, serviceFee: 200 } },
	onShow() {
		if (!requireLogin()) return
		this.d = draft.project
		this.loadServiceFee()
	},
	methods: {
		async loadServiceFee() {
			const cached = loadSiteConfig()
			if (cached) this.serviceFee = getProjectPrice(cached)
			try {
				const res = await api.siteConfig()
				saveSiteConfig(res)
				this.serviceFee = getProjectPrice(res)
			} catch (e) { /* 使用缓存或默认 200 */ }
		},
		async pay() {
			if (this.submitting || !this.d) return
			if (!this.d.name) return uni.showToast({ title: '请先完成基本信息', icon: 'none' })
			if (!this.d.specs || this.d.specs.length === 0) return uni.showToast({ title: '请先设置规格', icon: 'none' })

			this.submitting = true
			uni.showLoading({ title: '创建项目...' })
			try {
				const res = await api.createProject(buildCreateProjectPayload(this.d))
				const id = res && (res.id != null ? res.id : res.project_id)
				const order_no = res && res.order_no
				if (!id) throw new Error('未返回项目 id')
				this.d.pendingOrder = { id, order_no }

				const needPay = Number(this.serviceFee) > 0
				if (needPay && order_no) {
					uni.showLoading({ title: '拉起支付...' })
					const payRes = await api.goPay(order_no)
					await invokeWechatPay(payRes)
					uni.showLoading({ title: '确认支付状态...' })
					await pollProjectPaid(id)
				} else if (needPay && !order_no) {
					throw new Error('未返回订单号，无法支付')
				}

				uni.hideLoading()
				uni.showToast({ title: '可进行资金分配', icon: 'success' })
				setTimeout(() => uni.navigateTo({ url: '/pages/project/allocate' }), 500)
			} catch (e) {
				uni.hideLoading()
				if (e && e.message && e.message.indexOf('超时') >= 0) {
					uni.showModal({
						title: '提示',
						content: e.message + '，是否仍进入分配步骤？',
						success: (r) => {
							if (r.confirm && this.d.pendingOrder) {
								uni.navigateTo({ url: '/pages/project/allocate' })
							}
						}
					})
				}
			} finally {
				this.submitting = false
			}
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
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #F5F7FA; gap: 16rpx; }
.row:last-child { border-bottom: none; }
.lbl {
	flex-shrink: 0;
	width: 220rpx;
	font-size: 28rpx;
	color: #333;
	white-space: nowrap;
	line-height: 1.2;
}
.ipt { flex: 1; min-width: 0; font-size: 28rpx; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; padding: 22rpx 0; font-size: 32rpx; font-weight: 600; }
.hint { color:#bbb; text-align:center; font-size: 22rpx; margin-top: 16rpx; line-height: 1.5; }
</style>
