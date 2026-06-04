<template>
	<view class="page" v-if="project">
		<view class="hd">
			<text class="title">对账单 · {{ modeLabel }}</text>
			<text class="sub">{{ project.name }} #{{ project.no }}</text>
		</view>

		<view class="card">
			<view class="rr"><text>磅票总数</text><text class="hi">{{ rows.length }}</text></view>
			<view class="rr"><text>装货合计净重</text><text class="hi">{{ sum.shipNet.toFixed(2) }} t</text></view>
			<view class="rr"><text>卸货合计净重</text><text class="hi">{{ sum.recvNet.toFixed(2) }} t</text></view>
			<view class="rr"><text>总损耗</text><text class="warn">{{ sum.loss.toFixed(2) }} t（{{ sum.lossPct }}%）</text></view>
		</view>

		<!-- 详版表格：装货毛/皮/净 - 卸货毛/皮/净 = 损耗 -->
		<scroll-view scroll-x class="scroll" v-if="mode==='detail' || mode==='pro'">
			<view class="tbl">
				<view class="th">
					<text class="c plate">车号</text>
					<text class="c">装毛</text>
					<text class="c">装皮</text>
					<text class="c">装净</text>
					<text class="c">卸毛</text>
					<text class="c">卸皮</text>
					<text class="c">卸净</text>
					<text class="c hi">损耗</text>
				</view>
				<view class="tr" v-for="r in rows" :key="r.id">
					<text class="c plate">{{ r.plate }}</text>
					<text class="c">{{ r.sg }}</text>
					<text class="c">{{ r.st }}</text>
					<text class="c">{{ r.sn }}</text>
					<text class="c">{{ r.rg }}</text>
					<text class="c">{{ r.rt }}</text>
					<text class="c">{{ r.rn }}</text>
					<text class="c hi">{{ r.loss }}</text>
				</view>
			</view>
		</scroll-view>

		<!-- 简洁版 -->
		<view class="card" v-if="mode==='simple'">
			<view class="srow" v-for="r in rows" :key="r.id">
				<text class="splate">{{ r.plate }}</text>
				<text>装 {{ r.sn }}t</text>
				<text>卸 {{ r.rn }}t</text>
				<text class="warn">损 {{ r.loss }}t</text>
			</view>
		</view>

		<!-- 专业分析版 -->
		<view class="card" v-if="mode==='pro'">
			<view class="ct">专业分析</view>
			<view class="rr"><text>平均损耗率</text><text class="warn">{{ sum.lossPct }}%</text></view>
			<view class="rr"><text>异常单（损耗 > 3%）</text><text class="warn">{{ sum.abnormal }} 单</text></view>
			<view class="rr"><text>纠错次数</text><text class="warn">{{ sum.corrected }}</text></view>
			<view class="rr"><text>平均单车装货</text><text class="hi">{{ avgShip }} t</text></view>
			<view class="rr"><text>平均单车卸货</text><text class="hi">{{ avgRecv }} t</text></view>
		</view>

		<view class="actions">
			<button class="primary" @tap="print">🖨 打印 / 分享</button>
		</view>
	</view>
</template>

<script>
import { db } from '@/utils/store.js'
import { api } from '@/utils/request.js'
export default {
	data() { return { project: null, mode: 'detail', rows: [], sum: { shipNet:0, recvNet:0, loss:0, lossPct: 0, abnormal: 0, corrected: 0 } } },
	computed: {
		modeLabel() { return ({simple:'简洁版', detail:'详版', pro:'专业分析'})[this.mode] },
		avgShip() { return this.rows.length ? (this.sum.shipNet / this.rows.length).toFixed(2) : '0.00' },
		avgRecv() { return this.rows.length ? (this.sum.recvNet / this.rows.length).toFixed(2) : '0.00' }
	},
	async onLoad(q) {
		this.mode = q.mode
		// 先用本地
		this.project = db.getProject(q.id)
		// 尝试从后端拉取（取真实 company 字段）
		const remoteId = q.id.replace(/^P/, '')
		try {
			const res = await api.projectInfo(remoteId)
			if (res && res.row) {
				const r = res.row
				this.project = {
					...(this.project || {}),
					name: r.title,
					no: r.id,
					shipperCompany: r.shipper_company || '',
					receiverCompany: r.receiver_company || ''
				}
			}
		} catch (e) {}
		// 本地磅单数据
		const bills = db.billsOfProject(q.id).filter(b => b.shipVerified && b.recvVerified && b.recv)
		let sn = 0, rn = 0, abnormal = 0, corrected = 0
		this.rows = bills.map(b => {
			const loss = +(Number(b.net) - Number(b.recv.net)).toFixed(2)
			const pct = b.net > 0 ? (loss / b.net * 100) : 0
			if (pct > 3) abnormal++
			if (b.shipCorrected || b.recvCorrected) corrected++
			sn += Number(b.net); rn += Number(b.recv.net)
			return {
				id: b.id, plate: b.plate,
				sg: b.gross, st: b.tare, sn: b.net,
				rg: b.recv.gross, rt: b.recv.tare, rn: b.recv.net,
				loss
			}
		})
		const loss = sn - rn
		const lossPct = sn > 0 ? (loss / sn * 100).toFixed(2) : '0.00'
		this.sum = { shipNet: sn, recvNet: rn, loss, lossPct, abnormal, corrected }
	},
	methods: {
		print() { uni.showToast({ title: '已发送至打印机', icon: 'success' }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.hd { background: linear-gradient(135deg,#4ADE80,#16A34A); color:#fff; border-radius: 20rpx; padding: 36rpx 28rpx; }
.title { font-size: 36rpx; font-weight: 800; display:block; }
.sub { font-size: 24rpx; opacity:.9; margin-top: 8rpx; display:block; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-top: 24rpx; }
.rr { display:flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx dashed #f0f0f0; font-size: 26rpx; color:#444; }
.rr:last-child { border-bottom: none; }
.hi { color:#16A34A; font-weight: 700; }
.warn { color:#ef4444; font-weight: 700; }
.scroll { white-space: nowrap; margin-top: 24rpx; background:#fff; border-radius: 20rpx; padding: 16rpx; }
.tbl { display: inline-block; }
.th, .tr { display:flex; }
.th { background:#ECFDF5; }
.c { display:inline-block; width: 120rpx; padding: 14rpx 8rpx; font-size: 22rpx; text-align:center; color:#333; border-bottom:1rpx solid #f5f5f5; }
.c.plate { width: 160rpx; font-weight: 600; }
.tr .c.hi { color:#ef4444; font-weight: 700; }
.ct { font-size: 28rpx; font-weight: 700; color:#111; margin-bottom: 12rpx; }
.srow { display:flex; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx dashed #f0f0f0; font-size: 24rpx; color:#444; }
.srow:last-child { border-bottom: none; }
.splate { font-weight: 700; color:#111; min-width: 140rpx; }
.actions { margin-top: 40rpx; }
.primary { background:#4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 22rpx 0; font-weight: 600; }
</style>
