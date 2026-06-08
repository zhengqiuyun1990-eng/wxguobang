<template>
	<view class="page">
		<view class="card add-card">
			<input class="ipt" placeholder="请输入车牌号" v-model="plate" />
			<button class="add-btn" @tap="add">添加</button>
		</view>
		<view class="tip">每个账号最多可绑定 {{ max }} 台车，当前 {{ list.length }} 台</view>
		<view class="card">
			<view class="empty" v-if="list.length === 0">暂无车辆</view>
			<view class="row" v-for="p in list" :key="p">
				<text class="plate">{{ p }}</text>
				<text class="del" @tap="del(p)">删除</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getVehicles, addVehicle, removeVehicle, MAX_VEHICLES } from '@/utils/vehicles.js'
export default {
	data() { return { plate: '', list: [], max: MAX_VEHICLES } },
	onShow() { this.list = getVehicles() },
	methods: {
		add() {
			const res = addVehicle(this.plate)
			if (!res.ok) return uni.showToast({ title: res.msg, icon: 'none' })
			this.list = res.list
			this.plate = ''
			uni.showToast({ title: '已添加', icon: 'success' })
		},
		del(p) {
			uni.showModal({ title: '删除车辆', content: '确定删除 ' + p + '？', success: (r) => {
				if (r.confirm) this.list = removeVehicle(p)
			} })
		}
	}
}
</script>

<style lang="scss">
.page { min-height: 100vh; background: #F5F7FA; padding: 24rpx; }
.card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; }
.add-card { display: flex; align-items: center; gap: 16rpx; }
.ipt { flex: 1; font-size: 30rpx; height: 76rpx; }
.add-btn { background: #4ADE80; color: #fff; border-radius: 12rpx; font-size: 28rpx; height: 76rpx; line-height: 76rpx; padding: 0 34rpx; }
.tip { color: #999; font-size: 24rpx; margin: 0 8rpx 20rpx; }
.empty { text-align: center; color: #bbb; padding: 40rpx 0; }
.row { display:flex; align-items:center; padding: 24rpx 0; border-bottom: 1rpx solid #F5F7FA; }
.row:last-child { border-bottom: none; }
.plate { flex:1; font-size: 30rpx; font-weight: 700; color:#111; }
.del { color:#ef4444; font-size: 26rpx; }
</style>
