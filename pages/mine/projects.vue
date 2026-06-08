<template>
	<view class="page">
		<view class="empty" v-if="!loading && list.length === 0"><text>暂无项目</text></view>
		<view class="card" v-for="p in list" :key="p.id" @tap="enter(p)">
			<view class="hd">
				<text class="name">{{ p.name }}</text>
				<text class="role-tag">{{ p.roleLabel }}</text>
			</view>
			<text class="route">{{ p.route }}</text>
			<view class="tags">
				<text class="tag" :class="p.payOk ? 'ok' : 'warn'">{{ p.payLabel }}</text>
				<text class="tag" :class="p.shipOk ? 'ok' : ''">{{ p.shipLabel }}</text>
				<text class="tag" :class="p.recvOk ? 'ok' : ''">{{ p.recvLabel }}</text>
			</view>
			<view class="foot">
				<text class="fee">{{ p.feeText }}</text>
				<text class="piece" v-if="p.resultNum > 0">计件 {{ p.resultNum }}</text>
				<text class="enter">›</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db, requireLogin } from '@/utils/store.js'
import { api } from '@/utils/request.js'
import { parseMyProjectList, isProjectOwner } from '@/utils/api-util.js'

export default {
	data() { return { list: [], loading: true } },
	onShow() {
		if (!requireLogin()) return
		this.load()
	},
	methods: {
		async load() {
			const u = db.currentUser()
			if (!u) return
			this.loading = true
			try {
				const res = await api.myProjects()
				this.list = parseMyProjectList(res)
					.filter(p => isProjectOwner(p, u))
					.map(p => this.toCard(p))
			} catch (e) {
				this.list = db.allProjects()
					.filter(p => p.ownerId === u.id)
					.map(p => this.toCardLocal(p))
			} finally {
				this.loading = false
			}
		},
		toCard(p) {
			const payOk = p.payStatus === 1 || p.payStatus === '1'
			const shipOk = p.shipperStatus === 1 || p.shipperStatus === '1'
			const recvOk = p.receiverStatus === 1 || p.receiverStatus === '1'
			return {
				id: 'P' + p.id,
				name: p.name,
				roleLabel: p.roleLabel || '发布人',
				route: (p.shipperCompany || '发货站') + ' → ' + (p.receiverCompany || '收货站'),
				payLabel: payOk ? '已支付' : '待支付',
				payOk,
				shipLabel: '发货' + this.checkLabel(p.shipperStatus),
				shipOk,
				recvLabel: '收货' + this.checkLabel(p.receiverStatus),
				recvOk,
				feeText: p.driverFee > 0 ? ('司机 ¥' + p.driverFee + '/单') : '司机免费',
				resultNum: Number(p.resultNum) || 0
			}
		},
		toCardLocal(p) {
			return {
				id: p.id,
				name: p.name,
				roleLabel: '负责人',
				route: (p.shipperCompany || '发货站') + ' → ' + (p.receiverCompany || '收货站'),
				payLabel: '本地项目',
				payOk: true,
				shipLabel: '发货 —',
				shipOk: false,
				recvLabel: '收货 —',
				recvOk: false,
				feeText: p.driverFee > 0 ? ('司机 ¥' + p.driverFee + '/单') : '司机免费',
				resultNum: 0
			}
		},
		checkLabel(status) {
			if (status === 1 || status === '1') return '已核对'
			if (status === 0 || status === '0') return '待核对'
			return '未上传'
		},
		enter(p) { uni.navigateTo({ url: '/pages/mine/projectDetail?id=' + p.id }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.empty { text-align:center; padding: 80rpx 0; color:#999; font-size: 26rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.hd { display:flex; align-items:center; gap: 12rpx; }
.name { flex:1; font-size: 30rpx; font-weight: 700; color:#111; }
.role-tag { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 999px; background:#ECFDF5; color:#16A34A; flex-shrink: 0; }
.route { display:block; font-size: 24rpx; color:#666; margin-top: 12rpx; }
.tags { display:flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
.tag { font-size: 22rpx; padding: 6rpx 14rpx; border-radius: 999px; background:#F5F7FA; color:#888; }
.tag.ok { background:#ECFDF5; color:#16A34A; }
.tag.warn { background:#FEF3C7; color:#D97706; }
.foot { display:flex; align-items:center; gap: 16rpx; margin-top: 16rpx; font-size: 24rpx; color:#666; }
.fee { color:#16A34A; font-weight: 600; }
.piece { color:#2563EB; }
.enter { margin-left:auto; color:#ccc; font-size: 32rpx; }
</style>
