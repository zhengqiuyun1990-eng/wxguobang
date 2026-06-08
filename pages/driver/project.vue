<template>
	<view class="page" v-if="project">
		<view class="hd">
			<text class="hd-name">{{ project.title }}</text>
			<text class="hd-no">编号 #{{ project.id }} · {{ project.site && project.site.title }}</text>
		</view>

		<!-- 发货单 -->
		<view class="sec">
			<view class="sec-hd">
				<text class="sec-t">发货磅单</text>
				<text class="sec-tag ok" v-if="project.hair">已上传</text>
				<text class="sec-tag wait" v-else>未上传</text>
			</view>
			<block v-if="project.hair">
				<view class="img-row">
					<view class="img-item">
						<text class="img-lbl">磅单照片</text>
						<image :src="imgUrl(project.hair.weight_pic)" mode="aspectFill" class="img" @tap="preview(project.hair.weight_pic)" />
					</view>
					<view class="img-item">
						<text class="img-lbl">地址照片</text>
						<image :src="imgUrl(project.hair.addr_pic)" mode="aspectFill" class="img" @tap="preview(project.hair.addr_pic)" />
					</view>
				</view>
				<view class="row"><text class="lbl">车号</text><text class="val">{{ project.hair.number }}</text></view>
				<view class="row"><text class="lbl">毛重</text><text class="val">{{ project.hair['毛重'] }} t</text></view>
				<view class="row"><text class="lbl">皮重</text><text class="val">{{ project.hair['皮重'] }} t</text></view>
				<view class="row"><text class="lbl">净重</text><text class="val hi">{{ project.hair['净重'] }} t</text></view>
			</block>
			<button class="primary" v-else @tap="go('ship')">上传发货磅单</button>
		</view>

		<!-- 收货单 -->
		<view class="sec">
			<view class="sec-hd">
				<text class="sec-t">收货磅单</text>
				<text class="sec-tag ok" v-if="project.receive">已上传</text>
				<text class="sec-tag wait" v-else>未上传</text>
			</view>
			<block v-if="project.receive">
				<view class="img-row">
					<view class="img-item">
						<text class="img-lbl">磅单照片</text>
						<image :src="imgUrl(project.receive.weight_pic)" mode="aspectFill" class="img" @tap="preview(project.receive.weight_pic)" />
					</view>
					<view class="img-item">
						<text class="img-lbl">地址照片</text>
						<image :src="imgUrl(project.receive.addr_pic)" mode="aspectFill" class="img" @tap="preview(project.receive.addr_pic)" />
					</view>
				</view>
				<view class="row"><text class="lbl">车号</text><text class="val">{{ project.receive.number }}</text></view>
				<view class="row"><text class="lbl">毛重</text><text class="val">{{ project.receive['毛重'] }} t</text></view>
				<view class="row"><text class="lbl">皮重</text><text class="val">{{ project.receive['皮重'] }} t</text></view>
				<view class="row"><text class="lbl">净重</text><text class="val hi">{{ project.receive['净重'] }} t</text></view>
			</block>
			<button class="primary recv" v-else @tap="go('recv')">上传收货磅单</button>
		</view>
	</view>
</template>

<script>
import { requireLogin } from '@/utils/store.js'
import { api, imgUrl } from '@/utils/request.js'
export default {
	data() { return { pid: '', project: null } },
	onLoad(q) { this.pid = q.id || q.project_id || '' },
	onShow() {
		if (!requireLogin()) return
		this.loadDetail()
	},
	methods: {
		imgUrl,
		async loadDetail() {
			try {
				const data = await api.projectInfo(this.pid)
				this.project = (data && data.row) || null
			} catch (e) {
				this.project = null
			}
		},
		go(type) {
			if (type === 'ship' && this.project.hair) return uni.showToast({ title: '发货单已提交', icon: 'none' })
			if (type === 'recv' && this.project.receive) return uni.showToast({ title: '收货单已提交', icon: 'none' })
			const id = this.pid || (this.project && this.project.id)
			uni.navigateTo({ url: `/pages/driver/upload?project_id=${id}&type=${type}` })
		},
		preview(path) {
			if (!path) return
			uni.previewImage({ urls: [imgUrl(path)] })
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.hd { background:#fff; padding: 28rpx; border-radius: 20rpx; }
.hd-name { font-size: 32rpx; font-weight: 700; color:#111; display:block; }
.hd-no { font-size: 24rpx; color:#16A34A; margin-top: 6rpx; display:block; }
.actions { margin-top: 24rpx; background:#fff; border-radius: 20rpx; }
.action { display:flex; align-items:center; padding: 28rpx; border-bottom: 1rpx solid #F5F7FA; }
.action:last-child { border-bottom: none; }
.icon { width: 80rpx; height: 80rpx; border-radius: 20rpx; display:flex; align-items:center; justify-content:center; font-size: 36rpx; }
.info { flex:1; padding-left: 24rpx; }
.t { font-size: 28rpx; font-weight: 600; color:#111; display:block; }
.s { font-size: 22rpx; color:#888; margin-top: 6rpx; display:block; }
.arr { color:#ccc; font-size: 36rpx; }

.sec { background:#fff; border-radius: 20rpx; padding: 24rpx 28rpx; margin-top: 24rpx; }
.sec-hd { display:flex; align-items:center; padding-bottom: 16rpx; border-bottom: 1rpx solid #F5F7FA; }
.sec-t { flex:1; font-size: 28rpx; font-weight: 700; color:#111; }
.sec-tag { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 999px; }
.sec-tag.ok { background:#ECFDF5; color:#16A34A; }
.sec-tag.wait { background:#FEF3C7; color:#D97706; }
.img-row { display:flex; gap: 16rpx; padding: 20rpx 0; }
.img-item { flex:1; display:flex; flex-direction:column; }
.img-lbl { font-size: 22rpx; color:#888; margin-bottom: 8rpx; }
.img { width: 100%; height: 220rpx; border-radius: 16rpx; background:#F5F7FA; }
.row { display:flex; padding: 20rpx 0; border-bottom: 1rpx dashed #f0f0f0; }
.row:last-child { border-bottom: none; }
.lbl { width: 140rpx; color:#666; font-size: 26rpx; }
.val { flex:1; color:#111; font-size: 28rpx; font-weight: 600; }
.val.hi { color: #16A34A; }
.primary { margin-top: 20rpx; background:#4ADE80; color:#fff; border-radius: 999px; font-size: 28rpx; padding: 18rpx 0; font-weight: 600; }
.primary.recv { background:#2563EB; }
</style>
