<template>
	<view class="page">
		<view class="hd">
			<text class="star">{{ star }}★</text>
			<text class="score">{{ user.score }} 分</text>
			<text class="rate">当前单价 ¥ {{ rate }} / 件</text>
		</view>

		<view class="card">
			<view class="ct">星级 → 单价对照</view>
			<view class="rr" v-for="(v,k) in table" :key="k">
				<text>{{ k }}星</text>
				<text class="hi">¥ {{ v.toFixed(1) }}</text>
			</view>
		</view>

		<view class="card">
			<view class="ct">评分规则</view>
			<view class="li">初始 2 星（2000 分），每星 1000 分</view>
			<view class="li">好评 +2 分，中评 -5 分，差评 -20 分</view>
			<view class="li">计件 +1 分，纠错 +5 分</view>
		</view>

		<view class="card">
			<view class="ct">车主评价</view>
			<view class="empty">暂无评价</view>
		</view>
	</view>
</template>

<script>
import { db, rateByScore } from '@/utils/store.js'
export default {
	data() { return { user: { score: 0 }, table: { 1: 0.8, 1.5: 0.9, 2: 1.0, 2.5: 1.1, 3: 1.2, 3.5: 1.3, 4: 1.5, 4.5: 1.6, 5: 1.8 } } },
	computed: {
		star() { return rateByScore(this.user.score).star },
		rate() { return rateByScore(this.user.score).rate.toFixed(1) }
	},
	onShow() { this.user = db.currentUser() || { score: 0 } }
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.hd { background: linear-gradient(135deg,#4ADE80,#16A34A); border-radius: 20rpx; padding: 60rpx; color:#fff; display:flex; flex-direction:column; align-items:center; }
.star { font-size: 80rpx; font-weight: 800; }
.score { font-size: 28rpx; opacity:.9; margin-top: 6rpx; }
.rate { font-size: 26rpx; opacity:.9; margin-top: 8rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-top: 24rpx; }
.ct { font-size: 28rpx; font-weight: 700; margin-bottom: 12rpx; }
.rr { display:flex; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx dashed #f0f0f0; font-size: 26rpx; }
.rr:last-child { border-bottom: none; }
.hi { color:#16A34A; font-weight: 700; }
.li { color:#444; font-size: 24rpx; padding: 8rpx 0; }
.empty { text-align:center; color:#bbb; padding: 24rpx 0; font-size: 24rpx; }
</style>
