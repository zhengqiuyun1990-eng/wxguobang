<template>
	<view class="page">
		<view class="step">第 3 / 4 步 · 创建并支付</view>
		<view class="card pay">
			<text class="amount-tip">提交后将创建项目</text>
			<text class="amount-sub">司机缴费 ¥{{ d.driverFee || 0 }}/单 · 按接口拉起支付</text>
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

		<button class="primary" :disabled="submitting" @tap="pay">{{ submitting ? '处理中...' : '创建项目并支付' }}</button>
		<view class="hint">流程：创建项目 → 拉起支付 → 确认后进入资金分配</view>
	</view>
</template>

<script>
import { draft } from '@/utils/store.js'
import { api, pollProjectPaid } from '@/utils/request.js'
import { buildCreateProjectPayload } from '@/utils/api-util.js'
export default {
	data() { return { d: draft.project, submitting: false } },
	onShow() { this.d = draft.project },
	methods: {
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

				if (order_no) {
					uni.showLoading({ title: '拉起支付...' })
					await api.goPay(order_no)
					uni.showLoading({ title: '确认支付状态...' })
					await pollProjectPaid(id)
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
.amount-tip { font-size: 32rpx; font-weight: 700; color: #16A34A; }
.amount-sub { color:#666; font-size: 26rpx; margin-top: 8rpx; text-align: center; }
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.row:last-child { border-bottom: none; }
.lbl { width: 180rpx; font-size: 28rpx; color: #333; }
.ipt { flex:1; font-size: 28rpx; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; padding: 22rpx 0; font-size: 32rpx; font-weight: 600; }
.hint { color:#bbb; text-align:center; font-size: 22rpx; margin-top: 16rpx; line-height: 1.5; }
</style>
