<template>
	<view class="page">
		<view class="step">第 2 / 4 步 · 项目规格</view>
		<view class="hint">请添加货物规格区间，例如 0-5、5-10、10-20、20-30</view>

		<view class="card">
			<view class="spec" v-for="(s, i) in d.specs" :key="i">
				<input class="ipt" placeholder="下限" type="digit" v-model="s.min" />
				<text class="dash">-</text>
				<input class="ipt" placeholder="上限" type="digit" v-model="s.max" />
				<text class="del" @tap="rm(i)">删</text>
			</view>
			<view class="add" @tap="add">＋ 添加规格</view>
		</view>

		<view class="quick">快速添加：
			<text class="q" @tap="quick">0-5 / 5-10 / 10-20 / 20-30</text>
		</view>

		<button class="primary" @tap="next">下一步：服务费</button>
	</view>
</template>

<script>
import { draft } from '@/utils/store.js'
export default {
	data() { return { d: draft.project } },
	onShow() { this.d = draft.project },
	methods: {
		add() { this.d.specs.push({ min: '', max: '' }) },
		rm(i) { this.d.specs.splice(i, 1) },
		quick() { this.d.specs = [ {min:0,max:5},{min:5,max:10},{min:10,max:20},{min:20,max:30} ] },
		next() {
			if (this.d.specs.length === 0) return uni.showToast({ title: '请至少添加一项规格', icon: 'none' })
			uni.navigateTo({ url: '/pages/project/fee' })
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.step { font-size: 24rpx; color:#16A34A; padding: 8rpx 16rpx; background:#ECFDF5; display:inline-block; border-radius: 999px; }
.hint { color:#888; font-size: 24rpx; margin: 16rpx 0; }
.card { background:#fff; border-radius: 20rpx; padding: 8rpx 28rpx 24rpx; }
.spec { display:flex; align-items:center; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.ipt { flex:1; font-size: 28rpx; background:#F5F7FA; border-radius: 12rpx; padding: 16rpx; text-align:center; }
.dash { padding: 0 16rpx; color:#999; }
.del { color:#ef4444; padding-left: 16rpx; font-size: 26rpx; }
.add { color:#16A34A; text-align:center; padding: 24rpx 0; font-size:26rpx; }
.quick { color:#666; font-size: 24rpx; margin-top: 24rpx; }
.q { color: #16A34A; }
.primary { margin-top: 40rpx; background:#4ADE80; color:#fff; border-radius: 999px; padding: 20rpx 0; font-size: 30rpx; font-weight: 600; }
</style>
