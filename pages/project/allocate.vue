<template>
	<view class="page">
		<view class="step">第 4 / 4 步 · 资金分配</view>
		<view class="hint">司机每单缴费 ¥{{ d.driverFee || 0 }}，按下方百分比分配给各角色，合计 100%</view>

		<view class="card">
			<view class="row">
				<text class="lbl">发货过磅人</text>
				<view class="num">
					<text class="minus" @tap="dec('ship')">-</text>
					<input class="ipt" type="digit" v-model.number="d.allocate.ship" />
					<text class="unit">%</text>
					<text class="plus" @tap="inc('ship')">+</text>
				</view>
			</view>
			<view class="row">
				<text class="lbl">收货过磅人</text>
				<view class="num">
					<text class="minus" @tap="dec('recv')">-</text>
					<input class="ipt" type="digit" v-model.number="d.allocate.recv" />
					<text class="unit">%</text>
					<text class="plus" @tap="inc('recv')">+</text>
				</view>
			</view>
			<view class="row">
				<text class="lbl">项目负责人</text>
				<view class="num">
					<text class="minus" @tap="dec('owner')">-</text>
					<input class="ipt" type="digit" v-model.number="d.allocate.owner" />
					<text class="unit">%</text>
					<text class="plus" @tap="inc('owner')">+</text>
				</view>
			</view>
		</view>

		<view class="summary" :class="{ warn: totalPct > 100 }">
			<text class="s-t">已分配：{{ totalPct }}%</text>
			<text class="s-r">可分配金额：¥{{ allocatableAmount.toFixed(2) }}</text>
		</view>

		<button class="primary" :disabled="submitting" @tap="finish">{{ submitting ? '提交中...' : '提交分配并完成' }}</button>
	</view>
</template>

<script>
import { db, draft, requireLogin } from '@/utils/store.js'
import { api } from '@/utils/request.js'
export default {
	data() { return { d: draft.project, submitting: false } },
	onShow() {
		if (!requireLogin()) return
		this.d = draft.project
		if (!this.d || !this.d.pendingOrder || !this.d.pendingOrder.id) {
			uni.showToast({ title: '请先完成创建与支付', icon: 'none' })
			setTimeout(() => uni.redirectTo({ url: '/pages/project/fee' }), 800)
		}
	},
	computed: {
		totalPct() {
			const a = this.d && this.d.allocate
			if (!a) return 0
			return Number(a.ship||0) + Number(a.recv||0) + Number(a.owner||0)
		},
		allocatableAmount() {
			const fee = Number((this.d && this.d.driverFee) || 0)
			return fee * this.totalPct / 100
		}
	},
	methods: {
		inc(k) { this.d.allocate[k] = Math.min(100, Number(this.d.allocate[k]||0) + 5) },
		dec(k) { this.d.allocate[k] = Math.max(0, Number(this.d.allocate[k]||0) - 5) },
		async finish() {
			if (this.submitting) return
			if (!this.d) return uni.showToast({ title: '数据已丢失，请重新创建', icon: 'none' })
			if (this.totalPct > 100) return uni.showToast({ title: '分配比例不能超过 100%', icon: 'none' })
			const po = this.d.pendingOrder
			if (!po || !po.id) return uni.showToast({ title: '请先完成创建与支付', icon: 'none' })

			const u = db.currentUser()
			this.submitting = true
			uni.showLoading({ title: '提交分配...' })
			try {
				await api.allocateProject(po.id, this.d.allocate)

				const remoteId = po.id
				const no = po.order_no || remoteId
				const project = {
					id: 'P' + remoteId,
					remoteId,
					no,
					name: this.d.name,
					shipperCompany: this.d.shipperCompany || '',
					receiverCompany: this.d.receiverCompany || '',
					driverFee: Number(this.d.driverFee || 0),
					ownerId: u.id,
					ownerName: u.nickname,
					shippers: [...this.d.shippers],
					receivers: [...this.d.receivers],
					owners: [...this.d.owners],
					specs: [...this.d.specs],
					allocate: { ...this.d.allocate },
					createdAt: Date.now()
				}
				db.createProject(project)
				uni.hideLoading()
				uni.redirectTo({ url: '/pages/project/done?no=' + no + '&id=' + project.id })
			} catch (e) {
				uni.hideLoading()
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
.hint { color:#888; font-size: 24rpx; margin: 16rpx 0; }
.card { background:#fff; border-radius: 20rpx; padding: 0 28rpx; }
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #F5F7FA; }
.row:last-child { border-bottom: none; }
.lbl { flex:1; font-size: 28rpx; color: #333; }
.num { display:flex; align-items:center; }
.minus, .plus {
	width: 56rpx; height: 56rpx; line-height: 52rpx; text-align:center;
	background: #F5F7FA; border-radius: 50%; font-size: 32rpx; color:#16A34A;
}
.ipt { width: 100rpx; text-align:center; font-size: 28rpx; }
.unit { color:#666; font-size: 26rpx; padding: 0 8rpx; }
.summary { margin-top: 24rpx; background:#ECFDF5; border-radius: 20rpx; padding: 28rpx; }
.summary.warn { background:#FEF2F2; }
.s-t { display:block; color: #16A34A; font-size: 28rpx; font-weight: 700; margin-bottom: 8rpx; }
.summary.warn .s-t { color: #ef4444; }
.s-r { color:#666; font-size: 26rpx; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; padding: 22rpx 0; font-size: 32rpx; font-weight: 600; }
</style>
