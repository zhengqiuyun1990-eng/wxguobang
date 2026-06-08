<template>
	<view class="page" v-if="project">
		<view class="hd">
			<text class="name">{{ project.name }}</text>
			<text class="route">{{ summary.route }}</text>
			<view class="tags">
				<text class="tag" :class="summary.payOk ? 'tag ok' : 'tag warn'">{{ summary.payLabel }}</text>
				<text class="tag" :class="summary.shipOk ? 'tag ok' : ''">{{ summary.shipLabel }}</text>
				<text class="tag tag info" :class="summary.recvOk ? 'tag ok' : ''">{{ summary.recvLabel }}</text>
			</view>
		</view>

		<!-- 装卸货吨数统计 -->
		<view class="ton-card">
			<view class="ton-head">
				<text class="ton-title">装卸货吨数统计</text>
				<text class="ton-loss" v-if="tonCompare.loss > 0">损耗 {{ tonCompare.loss }}t · {{ tonCompare.lossPct }}%</text>
			</view>
			<view class="ton-pair">
				<view class="ton-box ship">
					<view class="ton-icon-wrap ship"><text class="ton-icon">发</text></view>
					<view class="ton-body">
						<text class="ton-val">{{ stats.shipTon }}</text>
						<text class="ton-unit">吨</text>
						<text class="ton-lbl">累计装货</text>
					</view>
				</view>
				<view class="ton-vs">→</view>
				<view class="ton-box recv">
					<view class="ton-icon-wrap recv"><text class="ton-icon">收</text></view>
					<view class="ton-body">
						<text class="ton-val recv-val">{{ stats.recvTon }}</text>
						<text class="ton-unit">吨</text>
						<text class="ton-lbl">累计卸货</text>
					</view>
				</view>
			</view>
			<view class="ton-bars">
				<view class="bar-row">
					<text class="bar-lbl ship">装货</text>
					<view class="bar-track"><view class="bar-fill ship" :style="{ width: tonCompare.shipPct + '%' }" /></view>
					<text class="bar-num">{{ stats.shipTon }}</text>
				</view>
				<view class="bar-row">
					<text class="bar-lbl recv">卸货</text>
					<view class="bar-track"><view class="bar-fill recv" :style="{ width: tonCompare.recvPct + '%' }" /></view>
					<text class="bar-num recv-num">{{ stats.recvTon }}</text>
				</view>
			</view>
			<view class="ton-foot">
				<view class="ton-chip">
					<text class="chip-n">{{ stats.billCount }}</text>
					<text class="chip-l">过磅单</text>
				</view>
				<view class="ton-chip fee">
					<text class="chip-n">¥{{ stats.totalFee }}</text>
					<text class="chip-l">累计费用</text>
				</view>
			</view>
		</view>

		<!-- 项目概况 -->
		<view class="card">
			<text class="card-title">项目概况</text>
			<view class="info-row"><text class="ik">司机服务费</text><text class="iv hi">{{ summary.feeText }}</text></view>
			<view class="info-row" v-if="summary.resultNum > 0"><text class="ik">确认计件</text><text class="iv">{{ summary.resultNum }}</text></view>
			<view class="info-row" v-if="summary.loss !== '0.00'"><text class="ik">累计损耗</text><text class="iv warn">{{ summary.loss }} 吨</text></view>
			<view class="staff-block" v-if="staff.length">
				<text class="staff-title">过磅人员</text>
				<view class="staff-row" v-for="s in staff" :key="s.key">
					<text class="sn">{{ s.name }}</text>
					<text class="sr">{{ s.roleLabel }}</text>
					<text class="ss" v-if="s.score">{{ s.score }}★</text>
					<text class="ss muted" v-else>待评分</text>
				</view>
			</view>
		</view>

		<!-- 过往过磅历史（日历上方） -->
		<view class="card">
			<text class="card-title">过往过磅记录</text>
			<view class="empty" v-if="history.length === 0">暂无过磅记录</view>
			<view class="hist-item" v-for="h in history" :key="h.id">
				<view class="hist-top">
					<text class="hist-plate">{{ h.plate }}</text>
					<text class="hist-time">{{ h.timeText }}</text>
				</view>
				<view class="hist-nums">
					<view class="hist-tag ship"><text class="ht-l">装</text><text class="ht-v">{{ h.shipNet.toFixed(2) }}t</text></view>
					<view class="hist-tag recv"><text class="ht-l">卸</text><text class="ht-v">{{ h.recvNet.toFixed(2) }}t</text></view>
					<view class="hist-tag loss" v-if="h.loss !== 0"><text class="ht-l">损</text><text class="ht-v">{{ h.loss.toFixed(2) }}t</text></view>
					<text class="hist-fee" v-if="h.fee > 0">¥{{ h.fee.toFixed(2) }}</text>
				</view>
			</view>
			<view class="hist-sum" v-if="history.length">
				<text>合计 {{ history.length }} 单</text>
				<text class="hist-sum-fee">费用 ¥{{ stats.totalFee }}</text>
			</view>
		</view>

		<!-- 日历热力图 -->
		<view class="card">
			<view class="cal-head">
				<text class="cal-arrow" @tap="prevMonth">‹</text>
				<text class="cal-title">{{ calYear }}年{{ calMonth + 1 }}月 · 过磅日历</text>
				<text class="cal-arrow" @tap="nextMonth">›</text>
			</view>
			<view class="week">
				<text class="wd" v-for="w in weekdays" :key="w">{{ w }}</text>
			</view>
			<view class="days">
				<view
					class="day"
					v-for="(d, i) in calendarCells"
					:key="i"
					:class="{ empty: !d.day, today: d.isToday }"
					:style="d.day ? { background: heatColor(d.total) } : {}"
				>
					<text class="dn" v-if="d.day">{{ d.day }}</text>
					<text class="dt" v-if="d.day && d.total > 0">{{ d.total.toFixed(1) }}</text>
					<text class="df" v-if="d.day && d.fee > 0">¥{{ d.fee }}</text>
				</view>
			</view>
			<view class="legend">
				<text class="lt">当日过磅吨数</text>
				<view class="lg" :style="{ background: '#F0FDF4' }" />
				<view class="lg" :style="{ background: '#BBF7D0' }" />
				<view class="lg" :style="{ background: '#4ADE80' }" />
				<view class="lg" :style="{ background: '#16A34A' }" />
			</view>
		</view>

		<view class="card" v-if="isOwner">
			<text class="card-title">确认计件数量</text>
			<text class="piece-hint">双向核对完成后，负责人确认最终计件数量</text>
			<view class="piece-row">
				<input class="piece-ipt" type="digit" placeholder="最终数量" v-model="resultNum" />
				<button class="piece-btn" :disabled="pieceSubmitting" @tap="confirmPiecework">
					{{ pieceSubmitting ? '提交中' : '确认' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
import { api } from '@/utils/request.js'
import {
	remoteProjectId,
	isProjectOwner,
	normalizeMyProject,
	mapExportHistoryRow,
	historyFromProjectInfo,
	historyFromLocalBills
} from '@/utils/api-util.js'

export default {
	data() {
		const now = new Date()
		return {
			project: null,
			remote: null,
			infoRow: null,
			history: [],
			driverFee: 0,
			resultNum: '',
			pieceSubmitting: false,
			calYear: now.getFullYear(),
			calMonth: now.getMonth(),
			weekdays: ['日', '一', '二', '三', '四', '五', '六']
		}
	},
	computed: {
		isOwner() {
			const u = db.currentUser()
			if (!u || !this.project) return false
			if (this.remote) return isProjectOwner(this.remote, u)
			if (this.project.ownerId === u.id) return true
			return (this.project.owners || []).some(o => o.phone === u.phone)
		},
		remoteId() {
			if (!this.project) return ''
			return this.project.remoteId || remoteProjectId(this.project.no || this.project.id)
		},
		summary() {
			const r = this.remote
			const payOk = r && (r.payStatus === 1 || r.payStatus === '1')
			const shipOk = r && (r.shipperStatus === 1 || r.shipperStatus === '1')
			const recvOk = r && (r.receiverStatus === 1 || r.receiverStatus === '1')
			const shipTon = this.history.reduce((s, h) => s + h.shipNet, 0)
			const recvTon = this.history.reduce((s, h) => s + h.recvNet, 0)
			return {
				route: r
					? (r.shipperCompany || '发货站') + ' → ' + (r.receiverCompany || '收货站')
					: (this.project.shipperCompany || '发货站') + ' → ' + (this.project.receiverCompany || '收货站'),
				payLabel: payOk ? '已支付' : '待支付',
				payOk,
				shipLabel: '发货' + this.checkLabel(r && r.shipperStatus),
				shipOk,
				recvLabel: '收货' + this.checkLabel(r && r.receiverStatus),
				recvOk,
				feeText: this.driverFee > 0 ? ('¥' + this.driverFee + '/单') : '免费',
				resultNum: r ? Number(r.resultNum) || 0 : 0,
				loss: (shipTon - recvTon).toFixed(2)
			}
		},
		stats() {
			const shipTon = this.history.reduce((s, h) => s + h.shipNet, 0)
			const recvTon = this.history.reduce((s, h) => s + h.recvNet, 0)
			const totalFee = this.history.reduce((s, h) => s + (h.fee || 0), 0)
			return {
				shipTon: shipTon.toFixed(2),
				recvTon: recvTon.toFixed(2),
				billCount: this.history.length,
				totalFee: totalFee.toFixed(2)
			}
		},
		tonCompare() {
			const ship = parseFloat(this.stats.shipTon) || 0
			const recv = parseFloat(this.stats.recvTon) || 0
			const max = Math.max(ship, recv, 1)
			const loss = +(ship - recv).toFixed(2)
			return {
				shipPct: Math.min(100, ship / max * 100).toFixed(1),
				recvPct: Math.min(100, recv / max * 100).toFixed(1),
				loss,
				lossPct: ship > 0 ? (loss / ship * 100).toFixed(2) : '0.00'
			}
		},
		staff() {
			const r = this.remote
			if (!r) return []
			const list = []
			;(r.shippers || []).forEach((m, i) => {
				list.push({
					key: 's' + i,
					name: m.name || '发货人员',
					roleLabel: '发货过磅',
					score: r.shipperScore
				})
			})
			;(r.receivers || []).forEach((m, i) => {
				list.push({
					key: 'r' + i,
					name: m.name || '收货人员',
					roleLabel: '收货过磅',
					score: r.receiverScore
				})
			})
			return list
		},
		calendarCells() {
			const y = this.calYear
			const m = this.calMonth
			const startOffset = new Date(y, m, 1).getDay()
			const daysInMonth = new Date(y, m + 1, 0).getDate()
			const todayStr = new Date().toDateString()
			const dayMap = {}
			this.history.forEach(h => {
				const d = new Date(h.time)
				if (d.getFullYear() !== y || d.getMonth() !== m) return
				const key = d.getDate()
				if (!dayMap[key]) dayMap[key] = { total: 0, fee: 0 }
				dayMap[key].total += h.shipNet + h.recvNet
				dayMap[key].fee += h.fee || 0
			})
			const cells = []
			for (let i = 0; i < startOffset; i++) cells.push({ day: 0, total: 0, fee: 0 })
			for (let d = 1; d <= daysInMonth; d++) {
				const date = new Date(y, m, d)
				const slot = dayMap[d] || { total: 0, fee: 0 }
				cells.push({
					day: d,
					total: slot.total,
					fee: slot.fee > 0 ? slot.fee.toFixed(0) : 0,
					isToday: date.toDateString() === todayStr
				})
			}
			return cells
		}
	},
	async onLoad(q) {
		this.project = db.getProject(q.id)
		const rid = remoteProjectId(q.id)
		await this.loadRemote(rid, q.id)
		await this.loadHistory(rid, q.id)
		if (this.summary.resultNum > 0) {
			this.resultNum = String(this.summary.resultNum)
		}
	},
	methods: {
		async loadRemote(rid, localId) {
			try {
				const [infoRes, myRes] = await Promise.all([
					api.projectInfo(rid).catch(() => null),
					api.myProjects().catch(() => null)
				])
				this.infoRow = infoRes && (infoRes.row || infoRes)
				const mine = (myRes && myRes.list) || []
				const hit = mine.find(p => String(p.id) === String(rid))
				if (hit) {
					this.remote = normalizeMyProject(hit)
					this.driverFee = this.remote.driverFee
					this.project = {
						...(this.project || {}),
						id: localId,
						remoteId: rid,
						name: this.remote.name,
						owners: this.remote.owners,
						shipperCompany: this.remote.shipperCompany,
						receiverCompany: this.remote.receiverCompany,
						ownerId: db.currentUser() && db.currentUser().id
					}
					return
				}
				const row = this.infoRow
				if (row) {
					this.project = {
						...(this.project || {}),
						id: localId,
						remoteId: rid,
						name: row.title || row.name,
						shipperCompany: row.shipper_company || '',
						receiverCompany: row.receiver_company || '',
						owners: [],
						ownerId: db.currentUser() && db.currentUser().id
					}
					this.driverFee = Number(row.price ?? row.driver_fee) || 0
				}
			} catch (e) {}
		},
		async loadHistory(rid, localId) {
			let rows = []
			try {
				const res = await api.exportDetail(rid)
				const list = (res && (res.list || res.rows || res.data)) || []
				if (Array.isArray(list) && list.length) {
					rows = list.map((b, i) => mapExportHistoryRow(b, i, this.driverFee))
				}
			} catch (e) {}
			if (!rows.length && this.infoRow) {
				rows = historyFromProjectInfo(this.infoRow, this.driverFee)
			}
			if (!rows.length) {
				rows = historyFromLocalBills(db.billsOfProject(localId), this.driverFee)
			}
			rows.sort((a, b) => b.time - a.time)
			this.history = rows
		},
		checkLabel(status) {
			if (status === 1 || status === '1') return '已核对'
			if (status === 0 || status === '0') return '待核对'
			return '未上传'
		},
		async confirmPiecework() {
			if (!this.resultNum && this.resultNum !== 0) {
				return uni.showToast({ title: '请输入计件数量', icon: 'none' })
			}
			if (!this.remoteId) return uni.showToast({ title: '项目无效', icon: 'none' })
			this.pieceSubmitting = true
			uni.showLoading({ title: '提交中...' })
			try {
				await api.correctResultNum(this.remoteId, this.resultNum)
				uni.hideLoading()
				uni.showToast({ title: '计件已确认', icon: 'success' })
				if (this.remote) this.remote.resultNum = Number(this.resultNum)
			} catch (e) {
				uni.hideLoading()
			} finally {
				this.pieceSubmitting = false
			}
		},
		prevMonth() {
			if (this.calMonth === 0) { this.calMonth = 11; this.calYear-- } else { this.calMonth-- }
		},
		nextMonth() {
			if (this.calMonth === 11) { this.calMonth = 0; this.calYear++ } else { this.calMonth++ }
		},
		heatColor(ton) {
			if (ton <= 0) return '#fafafa'
			if (ton < 20) return '#E8F2EC'
			if (ton < 50) return '#C5E0D0'
			if (ton < 100) return '#7FB89A'
			return '#4ADE80'
		}
	}
}
</script>

<style lang="scss">
.hd { background: linear-gradient(135deg, #4ADE80, #16A34A); color: #fff; padding: 32rpx 28rpx; border-radius: 20rpx; margin-top: 0; }
.name { font-size: 34rpx; font-weight: 700; display: block; letter-spacing: 1rpx; }
.route { font-size: 24rpx; opacity: 0.88; margin-top: 8rpx; display: block; }
.tags { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 16rpx; }
.hd .tag { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.2); }
.hd .tag ok { background: rgba(255,255,255,0.22); border-color: transparent; }
.hd .tag warn { background: #FEF3C7; color: #D97706; border-color: transparent; }
.hd .tag info { background: rgba(255,255,255,0.1); color: #fff; }

.ton-card {
	background: #fff;
	border: 1rpx solid #eee;
	border-radius: 20rpx;
	margin-top: 20rpx;
	padding: 28rpx;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06);
}
.ton-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.ton-title { font-size: 28rpx; font-weight: 700; color: #111; }
.ton-loss { font-size: 22rpx; color: #ef4444; background: #FEF2F2; padding: 6rpx 14rpx; border-radius: 8rpx; }

.ton-pair { display: flex; align-items: stretch; gap: 12rpx; }
.ton-box {
	flex: 1;
	border-radius: 16rpx;
	padding: 20rpx 16rpx;
	display: flex;
	align-items: center;
	gap: 12rpx;
}
.ton-box.ship { background: #F0FDF4; border: 1rpx solid #eee; }
.ton-box.recv { background: #EFF6FF; border: 1rpx solid #eee; }
.ton-icon-wrap {
	width: 64rpx; height: 64rpx; border-radius: 8rpx;
	display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ton-icon-wrap.ship { background: #fff; color: #4ADE80; border: 1rpx solid #eee; }
.ton-icon-wrap.recv { background: #fff; color: #2563EB; border: 1rpx solid #eee; }
.ton-icon { font-size: 28rpx; font-weight: 700; }
.ton-body { display: flex; flex-direction: column; min-width: 0; }
.ton-val { font-size: 40rpx; font-weight: 800; color: #4ADE80; line-height: 1.1; font-variant-numeric: tabular-nums; }
.ton-val.recv-val { color: #2563EB; }
.ton-unit { font-size: 22rpx; color: #888; margin-top: 2rpx; }
.ton-lbl { font-size: 22rpx; color: #666; margin-top: 6rpx; }
.ton-vs { display: flex; align-items: center; color: #888; font-size: 28rpx; flex-shrink: 0; }

.ton-bars { margin-top: 24rpx; padding-top: 20rpx; border-top: 1rpx dashed #eee; }
.bar-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 14rpx; }
.bar-row:last-child { margin-bottom: 0; }
.bar-lbl { width: 56rpx; font-size: 22rpx; font-weight: 600; flex-shrink: 0; }
.bar-lbl.ship { color: #4ADE80; }
.bar-lbl.recv { color: #2563EB; }
.bar-track { flex: 1; height: 12rpx; background: #fafafa; border-radius: 8rpx; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 8rpx; min-width: 4rpx; }
.bar-fill.ship { background: #4ADE80; }
.bar-fill.recv { background: #2563EB; }
.bar-num { width: 100rpx; text-align: right; font-size: 24rpx; font-weight: 700; color: #4ADE80; flex-shrink: 0; }
.bar-num.recv-num { color: #2563EB; }

.ton-foot { display: flex; gap: 16rpx; margin-top: 24rpx; }
.ton-chip {
	flex: 1;
	background: #fafafa;
	border: 1rpx solid #eee;
	border-radius: 16rpx;
	padding: 16rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.ton-chip.fee { background: #FEF3C7; border-color: transparent; }
.chip-n { font-size: 30rpx; font-weight: 700; color: #111; }
.ton-chip.fee .chip-n { color: #D97706; }
.chip-l { font-size: 22rpx; color: #888; margin-top: 4rpx; }

.gb-empty.inline { padding: 32rpx 0; }
.info-row { display: flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx dashed #eee; font-size: 26rpx; }
.info-row:last-of-type { border-bottom: none; }
.ik { color: #666; }
.iv { color: #111; font-weight: 600; }
.iv.hi { color: #4ADE80; }
.iv.warn { color: #ef4444; }

.staff-block { margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx dashed #eee; }
.staff-title { font-size: 24rpx; color: #888; display: block; margin-bottom: 8rpx; }
.staff-row { display: flex; align-items: center; padding: 12rpx 0; font-size: 26rpx; min-height: 64rpx; }
.sn { flex: 1; font-weight: 600; color: #111; }
.sr { color: #666; padding: 0 12rpx; font-size: 24rpx; }
.ss { color: #4ADE80; font-weight: 600; }
.ss.muted { color: #888; font-weight: 400; }

.hist-item { padding: 18rpx 0; border-bottom: 1rpx dashed #eee; }
.hist-item:last-of-type { border-bottom: none; }
.hist-top { display: flex; align-items: center; }
.hist-plate { font-size: 28rpx; font-weight: 700; color: #111; flex: 1; }
.hist-time { font-size: 22rpx; color: #888; }
.hist-nums { display: flex; flex-wrap: wrap; align-items: center; gap: 12rpx; margin-top: 12rpx; }
.hist-tag { display: flex; align-items: baseline; gap: 6rpx; padding: 8rpx 14rpx; border-radius: 8rpx; font-size: 22rpx; border: 1rpx solid #eee; }
.hist-tag.ship { background: #F0FDF4; border-color: transparent; }
.hist-tag.recv { background: #EFF6FF; border-color: transparent; }
.hist-tag.loss { background: #FEF2F2; border-color: transparent; }
.ht-l { color: #666; }
.hist-tag.ship .ht-v { font-weight: 700; color: #4ADE80; }
.hist-tag.recv .ht-v { font-weight: 700; color: #2563EB; }
.hist-tag.loss .ht-v { font-weight: 700; color: #ef4444; }
.hist-fee { margin-left: auto; color: #D97706; font-weight: 700; font-size: 24rpx; }
.hist-sum {
	display: flex;
	justify-content: space-between;
	margin-top: 16rpx;
	padding-top: 16rpx;
	border-top: 1rpx solid #eee;
	font-size: 26rpx;
	color: #666;
}
.hist-sum-fee { color: #D97706; font-weight: 700; }

.cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.cal-title { margin-bottom: 0; flex: 1; text-align: center; font-size: 26rpx; font-weight: 700; color: #111; }
.cal-arrow { color: #4ADE80; font-size: 40rpx; width: 60rpx; text-align: center; min-height: 88rpx; line-height: 88rpx; }
.week { display: flex; }
.wd { flex: 1; text-align: center; font-size: 22rpx; color: #888; padding: 8rpx 0; }
.days { display: flex; flex-wrap: wrap; }
.day {
	width: calc(100% / 7);
	min-height: 88rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 8rpx;
	box-sizing: border-box;
	border: 1rpx solid transparent;
	padding: 4rpx 0;
}
.day.empty { background: transparent !important; }
.day.today { border-color: #4ADE80; }
.dn { font-size: 22rpx; color: #111; }
.dt { font-size: 18rpx; color: #4ADE80; font-weight: 700; }
.df { font-size: 16rpx; color: #D97706; }
.legend { display: flex; align-items: center; gap: 8rpx; margin-top: 16rpx; font-size: 20rpx; color: #888; }
.lg { width: 24rpx; height: 24rpx; border-radius: 4rpx; }
.lt { font-size: 20rpx; margin-right: 8rpx; }

.piece-hint { font-size: 22rpx; color: #888; margin-bottom: 16rpx; display: block; }
.piece-row { display: flex; align-items: center; gap: 16rpx; }
.piece-ipt { flex: 1; background: #fafafa; border: 1rpx solid #eee; border-radius: 8rpx; padding: 16rpx 20rpx; font-size: 28rpx; min-height: 88rpx; box-sizing: border-box; }
.piece-btn { flex-shrink: 0; padding: 0 32rpx; font-size: 26rpx; min-height: 88rpx; line-height: 88rpx; }
</style>
