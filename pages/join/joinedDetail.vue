<template>
	<view class="page" v-if="project">
		<view class="hd">
			<text class="hd-n">{{ project.name }}</text>
			<text class="hd-r" :class="role">{{ role === 'ship' ? '发货过磅人' : '收货过磅人' }}</text>
		</view>

		<view class="grid">
			<view class="g-item" @tap="goList">
				<text class="g-num">{{ stat.pending }}</text>
				<text class="g-lbl">未验</text>
			</view>
			<view class="g-item" @tap="goVerified">
				<text class="g-num ok">{{ stat.done }}</text>
				<text class="g-lbl">已验</text>
			</view>
			<view class="g-item" @tap="goPiece">
				<text class="g-num">¥{{ piece.toFixed(2) }}</text>
				<text class="g-lbl">我的计件</text>
			</view>
			<view class="g-item" @tap="goScore">
				<text class="g-num">{{ star }}★</text>
				<text class="g-lbl">服务评分</text>
			</view>
		</view>

		<view class="card">
			<view class="ct">已验 · 总览</view>
			<view class="rows">
				<view class="rr"><text>累计核验</text><text class="hi">{{ stat.done }} 单</text></view>
				<view class="rr"><text>累计计件</text><text class="hi">¥ {{ piece.toFixed(2) }}</text></view>
				<view class="rr"><text>纠错次数</text><text class="hi">{{ corrections }}</text></view>
			</view>
		</view>

		<view class="card">
			<view class="ct">出现错误的磅票</view>
			<view class="empty" v-if="errorBills.length === 0">暂无</view>
			<view class="bill" v-for="b in errorBills" :key="b.id">
				<text class="b-plate">{{ b.plate }}</text>
				<text class="b-time">{{ formatTime(b.createdAt) }}</text>
				<text class="b-tip">已纠错并由过磅人重新上传正确磅票</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db, rateByScore } from '@/utils/store.js'
import { api } from '@/utils/request.js'
import { isBlockPending } from '@/utils/api-util.js'
export default {
	data() { return { pid: '', role: '', project: null, stat: {pending:0, done:0}, piece: 0, errorBills: [], corrections: 0 } },
	computed: {
		star() {
			const u = db.currentUser()
			return u ? rateByScore(u.score).star : 0
		}
	},
	onLoad(q) { this.pid = q.pid; this.role = q.role },
	async onShow() {
		this.project = db.getProject('P' + this.pid) || db.getProject(this.pid)
		if (!this.project) {
			try {
				const res = await api.projectInfo(this.pid)
				const row = res && (res.row || res)
				if (row) {
					this.project = { id: 'P' + this.pid, remoteId: this.pid, no: this.pid, name: row.title || row.name, allocate: { ship: 0, recv: 0, owner: 0 } }
				}
			} catch (e) {}
		}
		if (!this.project) return
		const bills = db.billsOfProject(this.project.id)
		const u = db.currentUser()
		let pending = 0, done = 0, piece = 0, errorBills = [], corrections = 0
		let fromRemote = false
		try {
			const info = await api.projectInfo(this.pid)
			const row = info && (info.row || info)
			const block = this.role === 'ship' ? row && row.hair : row && row.receive
			if (block && (block.number || block.net || block['净重'])) {
				fromRemote = true
				if (isBlockPending(block)) pending = 1
				else done = 1
			}
		} catch (e) {}
		if (fromRemote) {
			this.stat = { pending, done }
			this.piece = piece
			this.errorBills = errorBills
			this.corrections = corrections
			return
		}
		bills.forEach(b => {
			if (this.role === 'ship') {
				if (b.type === 'ship') {
					b.shipVerified ? done++ : pending++
					if (b.shipVerifiedBy === u.id) piece += this.project.allocate.ship
					if (b.shipCorrected) { corrections++; errorBills.push(b) }
				}
			} else {
				if (b.recv) {
					b.recvVerified ? done++ : pending++
					if (b.recvVerifiedBy === u.id) piece += this.project.allocate.recv
					if (b.recvCorrected) { corrections++; errorBills.push(b) }
				}
			}
		})
		this.stat = { pending, done }
		this.piece = piece
		this.errorBills = errorBills
		this.corrections = corrections
	},
	methods: {
		goList() { uni.navigateTo({ url: `/pages/verify/list?project_id=${this.pid}&role=${this.role}` }) },
		goVerified() { uni.navigateTo({ url: `/pages/verify/verified?pid=${this.pid}&role=${this.role}` }) },
		goPiece() { uni.navigateTo({ url: '/pages/mine/piecework' }) },
		goScore() { uni.navigateTo({ url: '/pages/mine/score' }) },
		formatTime(t) {
			const d = new Date(t)
			return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.hd { background:#fff; border-radius: 20rpx; padding: 28rpx; display:flex; align-items:center; }
.hd-n { flex:1; font-size: 32rpx; font-weight: 700; color:#111; }
.hd-r { font-size: 24rpx; padding: 6rpx 16rpx; border-radius: 999px; }
.hd-r.ship { background:#ECFDF5; color:#16A34A; }
.hd-r.recv { background:#DBEAFE; color:#2563EB; }
.grid { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 24rpx 0; display:flex; }
.g-item { flex:1; display:flex; flex-direction:column; align-items:center; padding: 12rpx 0; }
.g-num { font-size: 36rpx; font-weight: 700; color:#111; }
.g-num.ok { color: #16A34A; }
.g-lbl { font-size: 22rpx; color:#888; margin-top: 6rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 28rpx; margin-top: 24rpx; }
.ct { font-size: 28rpx; font-weight: 700; color:#111; margin-bottom: 16rpx; }
.rows .rr { display:flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx dashed #f0f0f0; font-size: 26rpx; color:#666; }
.rr:last-child { border-bottom: none; }
.hi { color:#16A34A; font-weight: 600; }
.empty { text-align:center; color:#bbb; padding: 30rpx 0; font-size: 24rpx; }
.bill { padding: 16rpx 0; border-bottom: 1rpx dashed #f0f0f0; }
.b-plate { font-size: 28rpx; font-weight: 600; }
.b-time { color:#999; font-size: 22rpx; padding-left: 16rpx; }
.b-tip { display:block; color:#D97706; font-size: 22rpx; margin-top: 6rpx; }
</style>
