<template>
	<view class="page" v-if="project">
		<view class="hd">
			<text class="name">{{ project.name }}</text>
			<text class="no">#{{ project.no }}</text>
		</view>

		<view class="grid">
			<view class="g">
				<text class="gn">¥{{ fund }}</text>
				<text class="gl">项目资金</text>
			</view>
			<view class="g">
				<text class="gn">{{ trucks }}</text>
				<text class="gl">实时运力</text>
			</view>
			<view class="g">
				<text class="gn">{{ totalBills }}</text>
				<text class="gl">磅票数</text>
			</view>
		</view>

		<!-- 装卸货吨数统计 -->
		<view class="card">
			<view class="ct">装卸货吨数统计</view>
			<view class="stat-row">
				<view class="sg">
					<text class="sg-n">{{ todayShipTon.toFixed(2) }}</text>
					<text class="sg-l">今日装货 (吨)</text>
				</view>
				<view class="sg">
					<text class="sg-n">{{ todayRecvTon.toFixed(2) }}</text>
					<text class="sg-l">今日卸货 (吨)</text>
				</view>
			</view>
			<view class="stat-row">
				<view class="sg">
					<text class="sg-n">{{ monthShipTon.toFixed(2) }}</text>
					<text class="sg-l">本月装货 (吨)</text>
				</view>
				<view class="sg">
					<text class="sg-n">{{ monthRecvTon.toFixed(2) }}</text>
					<text class="sg-l">本月卸货 (吨)</text>
				</view>
			</view>
		</view>

		<!-- 日历热力图 -->
		<view class="card">
			<view class="cal-head">
				<text class="cal-arrow" @tap="prevMonth">‹</text>
				<text class="ct">{{ calYear }}年{{ calMonth + 1 }}月·装卸货日历</text>
				<text class="cal-arrow" @tap="nextMonth">›</text>
			</view>
			<view class="week">
				<text class="wd" v-for="w in weekdays" :key="w">{{ w }}</text>
			</view>
			<view class="days">
				<view class="day" v-for="(d, i) in calendarCells" :key="i" :class="{ empty: !d.day, today: d.isToday }" :style="d.day ? { background: heatColor(d.total) } : {}">
					<text class="dn" v-if="d.day">{{ d.day }}</text>
					<text class="dt" v-if="d.day && d.total > 0">{{ d.total.toFixed(1) }}</text>
				</view>
			</view>
			<view class="legend">
				<text class="lt">吨数：</text>
				<view class="lg" :style="{ background: '#F0FDF4' }" /><text class="ll">低</text>
				<view class="lg" :style="{ background: '#BBF7D0' }" />
				<view class="lg" :style="{ background: '#4ADE80' }" />
				<view class="lg" :style="{ background: '#16A34A' }" /><text class="ll">高</text>
			</view>
		</view>

		<view class="card">
			<view class="ct">过磅人员评分</view>
			<view class="empty" v-if="staff.length === 0">暂无</view>
			<view class="row" v-for="s in staff" :key="s.userId">
				<text class="rn">{{ s.name }}</text>
				<text class="rp">{{ s.role === 'ship' ? '发货' : '收货' }}</text>
				<text class="rs">{{ s.star }}★</text>
			</view>
		</view>

		<view class="card">
			<view class="ct">运力（实时车辆）</view>
			<view class="empty" v-if="liveTrucks.length === 0">暂无在途车辆</view>
			<view class="row" v-for="t in liveTrucks" :key="t.id">
				<text class="rn">{{ t.plate }}</text>
				<text class="rp">{{ t.status }}</text>
				<text class="rs">{{ formatTime(t.time) }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db, rateByScore } from '@/utils/store.js'
export default {
	data() {
		const now = new Date()
		return {
			project: null,
			calYear: now.getFullYear(),
			calMonth: now.getMonth(),
			weekdays: ['日','一','二','三','四','五','六']
		}
	},
	computed: {
		bills() { return this.project ? db.billsOfProject(this.project.id) : [] },
		fund() { return this.bills.reduce((s,b)=>s+(b.paid||0),0).toFixed(2) },
		trucks() { return new Set(this.bills.map(b => b.plate)).size },
		totalBills() { return this.bills.length },
		todayShipTon() { return this._sumTon('ship', t => new Date(t).toDateString() === new Date().toDateString()) },
		todayRecvTon() { return this._sumTon('recv', t => new Date(t).toDateString() === new Date().toDateString()) },
		monthShipTon() { return this._sumTon('ship', this._inThisMonth) },
		monthRecvTon() { return this._sumTon('recv', this._inThisMonth) },
		calendarCells() {
			const y = this.calYear, m = this.calMonth
			const startOffset = new Date(y, m, 1).getDay()
			const daysInMonth = new Date(y, m + 1, 0).getDate()
			const todayStr = new Date().toDateString()
			const cells = []
			for (let i = 0; i < startOffset; i++) cells.push({ day: 0, total: 0 })
			for (let d = 1; d <= daysInMonth; d++) {
				const date = new Date(y, m, d)
				let total = 0
				this.bills.forEach(b => {
					if (new Date(b.createdAt).toDateString() === date.toDateString()) {
						total += Number(b.shipNet || b.recvNet || b.net || 0)
					}
				})
				cells.push({ day: d, total, isToday: date.toDateString() === todayStr })
			}
			return cells
		},
		liveTrucks() {
			return this.bills.filter(b => !b.recvVerified).slice(-10).reverse().map(b => ({
				id: b.id, plate: b.plate,
				status: b.recv ? '已上传卸货 / 待验' : (b.shipVerified ? '在途' : '装货 / 待验'),
				time: b.createdAt
			}))
		},
		staff() {
			const apps = db.allApps().filter(a => a.projectId === this.project.id && a.status === 'approved')
			return apps.map(a => {
				const u = db.allUsers().find(x => x.id === a.userId)
				return { userId: a.userId, name: a.name, role: a.role, star: u ? rateByScore(u.score).star : 2 }
			})
		}
	},
	onLoad(q) { this.project = db.getProject(q.id) },
	methods: {
		formatTime(t) {
			const d = new Date(t)
			return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
		},
		prevMonth() {
			if (this.calMonth === 0) { this.calMonth = 11; this.calYear-- } else { this.calMonth-- }
		},
		nextMonth() {
			if (this.calMonth === 11) { this.calMonth = 0; this.calYear++ } else { this.calMonth++ }
		},
		heatColor(ton) {
			if (ton <= 0) return '#fafafa'
			if (ton < 20) return '#F0FDF4'
			if (ton < 50) return '#BBF7D0'
			if (ton < 100) return '#4ADE80'
			return '#16A34A'
		},
		_isToday(t) {
			return new Date(t).toDateString() === new Date().toDateString()
		},
		_inThisMonth(t) {
			const d = new Date(t), n = new Date()
			return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
		},
		_sumTon(type, filterFn) {
			let s = 0
			this.bills.forEach(b => {
				if (!filterFn(b.createdAt)) return
				if (type === 'ship') s += Number(b.shipNet || b.net || 0)
				else s += Number(b.recvNet || 0)
			})
			return s
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.hd { background: linear-gradient(135deg,#4ADE80,#16A34A); color:#fff; padding: 32rpx; border-radius: 20rpx; }
.name { font-size: 32rpx; font-weight: 700; display:block; }
.no { font-size: 24rpx; opacity:.85; margin-top: 6rpx; display:block; }
.grid { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 24rpx 0; display:flex; }
.g { flex:1; display:flex; flex-direction:column; align-items:center; }
.gn { font-size: 32rpx; font-weight: 700; color:#16A34A; }
.gl { font-size: 22rpx; color:#888; margin-top: 4rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-top: 24rpx; }
.ct { font-size: 28rpx; font-weight: 700; margin-bottom: 12rpx; color:#111; }
.empty { text-align:center; color:#bbb; padding: 24rpx 0; font-size: 24rpx; }
.row { display:flex; align-items:center; padding: 18rpx 0; border-bottom: 1rpx dashed #f0f0f0; font-size: 26rpx; }
.row:last-child { border-bottom: none; }
.rn { flex:1; font-weight: 600; color:#111; }
.rp { color:#666; padding: 0 16rpx; }
.rs { color:#16A34A; font-weight: 600; }

.stat-row { display:flex; gap: 16rpx; margin-top: 12rpx; }
.sg { flex:1; background:#F0FDF4; border-radius: 16rpx; padding: 20rpx; display:flex; flex-direction:column; align-items:center; }
.sg-n { font-size: 32rpx; font-weight: 700; color:#16A34A; }
.sg-l { font-size: 22rpx; color:#666; margin-top: 4rpx; }

.cal-head { display:flex; align-items:center; justify-content: space-between; margin-bottom: 12rpx; }
.cal-arrow { color:#16A34A; font-size: 40rpx; width: 60rpx; text-align:center; }
.week { display:flex; }
.wd { flex:1; text-align:center; font-size: 22rpx; color:#888; padding: 8rpx 0; }
.days { display:flex; flex-wrap: wrap; }
.day { width: calc(100% / 7); aspect-ratio: 1 / 1; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius: 8rpx; box-sizing: border-box; border: 2rpx solid transparent; }
.day.empty { background: transparent !important; }
.day.today { border-color: #16A34A; }
.dn { font-size: 22rpx; color:#333; }
.dt { font-size: 18rpx; color:#16A34A; font-weight: 700; }
.legend { display:flex; align-items:center; gap: 8rpx; margin-top: 16rpx; font-size: 20rpx; color:#888; }
.lg { width: 24rpx; height: 24rpx; border-radius: 4rpx; }
.lt, .ll { font-size: 20rpx; color:#888; }
</style>
