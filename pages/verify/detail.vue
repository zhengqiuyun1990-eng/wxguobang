<template>
	<view class="page" v-if="bill">
		<view class="banner" :class="role">{{ role === 'ship' ? '发货验票' : '收货验票' }}</view>

		<view class="card">
			<view class="ct">司机上传磅单</view>
			<image v-if="src.billImg" :src="src.billImg" mode="aspectFill" class="img" />
			<view v-else class="ph">无磅单图片</view>
		</view>

		<view class="card">
			<view class="row"><text class="lbl">车号</text><text class="val">{{ bill.plate }}</text></view>
			<view class="row"><text class="lbl">毛重</text><text class="val">{{ src.gross }} t</text></view>
			<view class="row"><text class="lbl">皮重</text><text class="val">{{ src.tare }} t</text></view>
			<view class="row"><text class="lbl">净重</text><text class="val">{{ src.net }} t</text></view>
			<view class="row" v-if="role==='recv' && src.spec"><text class="lbl">规格</text><text class="val">{{ src.spec }}</text></view>
			<view class="row"><text class="lbl">司机</text><text class="val">{{ bill.driverName }} · {{ bill.driverPhone }}</text></view>
		</view>

		<view class="actions">
			<button class="ghost" @tap="correct">数据有误，纠错</button>
			<button class="primary" @tap="confirm">已对账</button>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
export default {
	data() { return { bill: null, role: '' } },
	computed: {
		src() { return this.role === 'ship' ? this.bill : this.bill.recv }
	},
	onLoad(q) { this.role = q.role; this.bill = db.getBill(q.bid) },
	methods: {
		confirm() {
			const u = db.currentUser()
			const project = db.getProject(this.bill.projectId)
			const patch = {}
			if (this.role === 'ship') {
				patch.shipVerified = true; patch.shipVerifiedBy = u.id; patch.shipVerifiedAt = Date.now()
				uni.showToast({ title: '矿发数量已确定', icon: 'success' })
				// 给过磅人加分+计件
				db.updateUser({ score: u.score + 1, totalPiece: u.totalPiece + project.allocate.ship })
			} else {
				patch.recvVerified = true; patch.recvVerifiedBy = u.id; patch.recvVerifiedAt = Date.now()
				uni.showToast({ title: '卸货数量已确定', icon: 'success' })
				db.updateUser({ score: u.score + 1, totalPiece: u.totalPiece + project.allocate.recv })
			}
			db.updateBill(this.bill.id, patch)
			setTimeout(() => uni.navigateBack(), 700)
		},
		correct() {
			uni.showModal({
				title: '纠错', content: '纠错后将由您直接重新填写正确数据，本单计为纠错',
				success: r => { if (r.confirm) this.doCorrect() }
			})
		},
		doCorrect() {
			// 简化：弹出输入新净重；实际可跳到表单
			uni.showModal({
				title: '请输入正确净重(t)', editable: true, placeholderText: '正确净重',
				success: r => {
					if (!r.confirm || !r.content) return
					const newNet = Number(r.content)
					if (isNaN(newNet)) return
					const u = db.currentUser()
					const patch = {}
					if (this.role === 'ship') {
						patch.net = newNet; patch.shipCorrected = true
						patch.shipVerified = true; patch.shipVerifiedBy = u.id; patch.shipVerifiedAt = Date.now()
					} else {
						patch.recv = { ...this.bill.recv, net: newNet }
						patch.recvCorrected = true
						patch.recvVerified = true; patch.recvVerifiedBy = u.id; patch.recvVerifiedAt = Date.now()
					}
					db.updateBill(this.bill.id, patch)
					db.updateUser({ score: u.score + 5 }) // 纠错+5
					uni.showToast({ title: '已纠错并验票', icon: 'success' })
					setTimeout(() => uni.navigateBack(), 700)
				}
			})
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.banner { padding: 24rpx; border-radius: 20rpx; color:#fff; font-size: 30rpx; font-weight: 700; }
.banner.ship { background: linear-gradient(135deg,#4ADE80,#16A34A); }
.banner.recv { background: linear-gradient(135deg,#60A5FA,#2563EB); }
.card { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 24rpx 28rpx; }
.ct { font-size: 26rpx; color:#666; margin-bottom: 16rpx; }
.img { width: 100%; height: 360rpx; border-radius: 16rpx; }
.ph { height: 200rpx; background:#F5F7FA; border-radius: 16rpx; display:flex; align-items:center; justify-content:center; color:#999; }
.row { display:flex; padding: 22rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.row:last-child { border-bottom: none; }
.row .lbl { width: 160rpx; color:#666; font-size: 26rpx; }
.val { flex:1; color:#111; font-size: 28rpx; font-weight: 600; }
.actions { margin-top: 40rpx; display:flex; gap: 24rpx; }
.ghost { flex:1; background:#fff; color:#D97706; border:1rpx solid #FCD34D; border-radius: 999px; font-size: 28rpx; padding: 20rpx 0; }
.primary { flex:1; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 28rpx; padding: 20rpx 0; font-weight: 600; }
</style>
