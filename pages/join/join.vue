<template>
	<view class="page">
		<view class="card big" @tap="go('ship')">
			<view class="ic ship">发</view>
			<view class="info">
				<text class="t">我是发货人</text>
				<text class="s">提交申请加入项目（发货过磅）</text>
			</view>
			<text class="ar">›</text>
		</view>
		<view class="card big" @tap="go('recv')">
			<view class="ic recv">收</view>
			<view class="info">
				<text class="t">我是收货人</text>
				<text class="s">提交申请加入项目（收货过磅）</text>
			</view>
			<text class="ar">›</text>
		</view>
		<view class="card big" @tap="goJoined">
			<view class="ic list">单</view>
			<view class="info">
				<text class="t">已加入的项目</text>
				<text class="s">查看已验/未验/计件/评分</text>
			</view>
			<text class="ar">›</text>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		go(role) { uni.navigateTo({ url: '/pages/join/apply?role=' + role }) },
		goJoined() { uni.navigateTo({ url: '/pages/join/joined' }) }
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; display:flex; align-items:center; }
.ic {
	width: 96rpx; height: 96rpx; border-radius: 24rpx;
	display:flex; align-items:center; justify-content:center; font-size: 32rpx; font-weight: 700;
}
.ic.ship { background:#ECFDF5; color:#16A34A; }
.ic.recv { background:#DBEAFE; color:#2563EB; }
.ic.list { background:#FEF3C7; color:#D97706; }
.info { flex:1; padding-left: 24rpx; }
.t { font-size: 30rpx; font-weight: 700; color:#111; display:block; }
.s { font-size: 24rpx; color:#888; margin-top: 8rpx; display:block; }
.ar { color:#ccc; font-size: 36rpx; }
</style>
