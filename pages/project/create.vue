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
				<picker class="picker-wrap" mode="selector" :range="feeLabels" :value="feeIndex" @change="onFeeChange">
					<view class="picker-val">
						<text class="picker-text">¥{{ d.driverFee }}</text>
						<text class="arr">›</text>
					</view>
				</picker>
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
					<input class="m-phone" placeholder="手机号" type="number" maxlength="11" v-model="m.phone" @blur="onPhoneBlur(m)" />
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
	data() {
		const feeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
		return {
			d: null,
			feeOptions,
			feeLabels: feeOptions.map(n => String(n)),
			feeIndex: 1,
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
		this.syncFeeIndex()
	},
	methods: {
		syncFeeIndex() {
			let idx = this.feeOptions.indexOf(Number(this.d.driverFee))
			if (idx < 0) {
				this.d.driverFee = 10
				idx = this.feeOptions.indexOf(10)
			}
			this.feeIndex = idx
		},
		onFeeChange(e) {
			this.feeIndex = Number(e.detail.value)
			this.d.driverFee = this.feeOptions[this.feeIndex]
		},
		allMembers() {
			return [...this.d.shippers, ...this.d.receivers, ...this.d.owners]
		},
		normPhone(phone) {
			return String(phone || '').trim()
		},
		findDuplicatePhone() {
			const seen = new Set()
			for (const m of this.allMembers()) {
				const p = this.normPhone(m.phone)
				if (!p) continue
				if (seen.has(p)) return p
				seen.add(p)
			}
			return null
		},
		/** 生成如：发货人员和项目负责人手机重复 */
		duplicateMessage(phone) {
			const p = this.normPhone(phone)
			if (!p) return ''
			const hit = this.groups
				.map(grp => ({
					title: grp.title,
					count: this.d[grp.key].filter(m => this.normPhone(m.phone) === p).length
				}))
				.filter(g => g.count > 0)
			if (hit.length === 0) return '手机号不能重复'
			if (hit.length === 1 && hit[0].count > 1) return hit[0].title + '手机重复'
			const titles = hit.map(g => g.title)
			if (titles.length === 2) return titles[0] + '和' + titles[1] + '手机重复'
			return titles.slice(0, -1).join('、') + '和' + titles[titles.length - 1] + '手机重复'
		},
		showDupTip(phone) {
			uni.showModal({
				title: '手机号重复',
				content: this.duplicateMessage(phone),
				showCancel: false,
				confirmText: '知道了'
			})
		},
		onPhoneBlur(member) {
			const p = this.normPhone(member.phone)
			if (!p) return
			if (this.allMembers().filter(m => this.normPhone(m.phone) === p).length > 1) {
				this.showDupTip(p)
			}
		},
		add(key) { this.d[key].push({ name: '', phone: '' }) },
		rm(key, i) { this.d[key].splice(i, 1) },
		next() {
			if (!this.d.name) return uni.showToast({ title: '请输入项目名称', icon: 'none' })
			const all = this.allMembers()
			for (const m of all) {
				const p = this.normPhone(m.phone)
				if (p && !/^1\d{10}$/.test(p)) return uni.showToast({ title: '请填写正确手机号', icon: 'none' })
			}
			const dup = this.findDuplicatePhone()
			if (dup) return this.showDupTip(dup)
			if (!this.d.owners.some(m => this.normPhone(m.phone))) {
				return uni.showToast({ title: '至少填写 1 位负责人手机号', icon: 'none' })
			}
			uni.navigateTo({ url: '/pages/project/spec' })
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx 24rpx 60rpx; }
.step { font-size: 24rpx; color:#16A34A; padding: 8rpx 16rpx; background:#ECFDF5; display:inline-block; border-radius: 999px; }
.card, .group { background:#fff; border-radius: 20rpx; margin-top: 24rpx; padding: 0 28rpx; }
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
.picker-wrap { flex: 1; min-width: 0; }
.picker-val {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 48rpx;
}
.picker-text { font-size: 28rpx; color: #111; font-weight: 600; }
.picker { display:flex; align-items:center; }
.site-text { color:#111; font-size: 28rpx; }
.site-addr { color:#888; font-size: 24rpx; }
.site-ph { color:#bbb; font-size: 28rpx; flex:1; }
.arr { color:#ccc; font-size: 32rpx; margin-left:auto; padding-left: 16rpx; }
.g-head { display:flex; align-items:center; padding: 24rpx 0 12rpx; border-bottom: 1rpx solid #F5F7FA; }
.g-title { font-size: 30rpx; font-weight: 700; flex:1; color:#111; }
.g-sub { font-size: 22rpx; color: #999; }
.member { display:flex; align-items:center; padding: 20rpx 0; border-bottom: 1rpx dashed #f0f0f0; }
.role-block { padding: 16rpx 0; border-bottom: 1rpx solid #F5F7FA; }
.role-block:last-child { border-bottom: none; }
.role-lbl { font-size: 26rpx; font-weight: 600; color: #16A34A; padding-bottom: 8rpx; }
.m-name { width: 160rpx; font-size: 26rpx; }
.m-phone { flex: 1; font-size: 26rpx; }
.del { color: #ef4444; font-size: 26rpx; padding-left: 16rpx; }
.add { color: #16A34A; font-size: 26rpx; padding: 16rpx 0; text-align:center; }
.primary { margin-top: 40rpx; background: #4ADE80; color:#fff; border-radius: 999px; font-size: 30rpx; padding: 20rpx 0; font-weight: 600; }
</style>
