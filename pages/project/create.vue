<template>
	<view class="page">
		<view class="step">第 1 / 4 步 · 基本信息与人员</view>

		<view class="card">
			<view class="row">
				<text class="lbl">项目名称</text>
				<input class="ipt" placeholder="如：卸货单位及其标段简称" v-model="d.name" />
			</view>
			<view class="row">
				<text class="lbl">发货单位全称</text>
				<input class="ipt" placeholder="用于对账单打印" v-model="d.shipperCompany" />
			</view>
			<view class="row">
				<text class="lbl">卸货单位全称</text>
				<input class="ipt" placeholder="用于对账单打印" v-model="d.receiverCompany" />
			</view>
			<view class="row">
				<text class="lbl">司机支付金额</text>
				<input class="ipt" type="digit" placeholder="5~50元，0=免费项目" v-model.number="d.driverFee" />
				<text class="unit">元/单</text>
			</view>
		</view>

		<view class="card">
			<view class="g-head">
				<text class="g-title">添加人员</text>
				<text class="g-sub">自动生成三类角色，可追加多人</text>
			</view>
			<view v-for="(grp, idx) in groups" :key="idx" class="role-block">
				<view class="role-lbl">{{ grp.title }}</view>
				<view class="member" v-for="(m, i) in d[grp.key]" :key="i">
					<input v-if="grp.needName" class="m-name" placeholder="姓名" v-model="m.name" />
					<input class="m-phone" placeholder="手机号" type="number" maxlength="11" v-model="m.phone" />
					<text class="del" v-if="d[grp.key].length > 1" @tap="rm(grp.key, i)">删</text>
				</view>
				<view class="add" @tap="add(grp.key)">＋ 添加</view>
			</view>
		</view>

		<button class="primary" @tap="next">下一步：设置规格</button>
	</view>
</template>

<script>
import { draft } from '@/utils/store.js'
export default {
	data() { return { d: null,
		groups: [
			{ key: 'shippers',  title: '发货人员', needName: false },
			{ key: 'receivers', title: '收货人员', needName: false },
			{ key: 'owners',    title: '项目负责人', needName: true }
		]
	} },
	onLoad() {
		draft.reset()
		this.d = draft.project
		// 自动生成每类一条默认行
		if (this.d.shippers.length === 0) this.d.shippers.push({ name: '', phone: '' })
		if (this.d.receivers.length === 0) this.d.receivers.push({ name: '', phone: '' })
		if (this.d.owners.length === 0) this.d.owners.push({ name: '', phone: '' })
	},
	methods: {
		add(key) { this.d[key].push({ name: '', phone: '' }) },
		rm(key, i) { this.d[key].splice(i, 1) },
		next() {
			if (!this.d.name) return uni.showToast({ title: '请输入项目名称', icon: 'none' })
			if (this.d.driverFee !== 0 && this.d.driverFee !== '' && (this.d.driverFee < 5 || this.d.driverFee > 50))
				return uni.showToast({ title: '司机支付金额范围 5~50 元，或填 0 免费', icon: 'none' })
			const all = [...this.d.shippers, ...this.d.receivers, ...this.d.owners]
			for (const m of all) {
				if (m.phone && !/^1\d{10}$/.test(m.phone)) return uni.showToast({ title: '请填写正确手机号', icon: 'none' })
			}
			if (!this.d.owners.some(m => m.phone)) return uni.showToast({ title: '至少填写 1 位负责人手机号', icon: 'none' })
			uni.navigateTo({ url: '/pages/project/spec' })
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx 24rpx 60rpx; }
.step { font-size: 24rpx; color:#16A34A; padding: 8rpx 16rpx; background:#ECFDF5; display:inline-block; border-radius: 999px; }
.card, .group { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 0 28rpx; }
.row { display:flex; align-items:center; padding: 28rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.row:last-child { border-bottom: none; }
.lbl { width: 160rpx; font-size: 28rpx; color: #333; }
.ipt { flex: 1; font-size: 28rpx; }
.picker { display:flex; align-items:center; }
.site-text { color:#111; font-size: 28rpx; }
.site-addr { color:#888; font-size: 24rpx; }
.site-ph { color:#bbb; font-size: 28rpx; flex:1; }
.arr { color:#ccc; font-size: 32rpx; margin-left:auto; padding-left: 16rpx; }
.g-head { display:flex; align-items:center; padding: 24rpx 0 12rpx; border-bottom: 1rpx solid #f5f5f5; }
.g-title { font-size: 30rpx; font-weight: 700; flex:1; color:#111; }
.g-sub { font-size: 22rpx; color: #999; }
.member { display:flex; align-items:center; padding: 20rpx 0; border-bottom: 1rpx dashed #f0f0f0; }
.unit { color: #999; font-size: 24rpx; padding-left: 8rpx; }
.role-block { padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.role-block:last-child { border-bottom: none; }
.role-lbl { font-size: 26rpx; font-weight: 600; color: #16A34A; padding-bottom: 8rpx; }
.m-name { width: 160rpx; font-size: 26rpx; }
.m-phone { flex: 1; font-size: 26rpx; }
.del { color: #ef4444; font-size: 26rpx; padding-left: 16rpx; }
.add { color: #16A34A; font-size: 26rpx; padding: 16rpx 0; text-align:center; }
.primary { margin-top: 40rpx; background: #4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 20rpx 0; font-weight: 600; }
</style>
