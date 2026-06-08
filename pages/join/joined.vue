<template>
	<view class="page">
		<view class="empty" v-if="!loading && list.length === 0">
			<text>暂无已加入的项目</text>
		</view>
		<view class="card" v-for="x in list" :key="x.key" @tap="enter(x)">
			<view class="head">
				<text class="name">{{ x.name }}</text>
				<text class="role" :class="x.role">{{ x.role === 'ship' ? '发货过磅' : '收货过磅' }}</text>
			</view>
			<text class="no">编号 #{{ x.projectId }}</text>
			<view class="meta">
				<text>待核对 {{ x.pending }}</text>
				<text>已核对 {{ x.done }}</text>
				<text class="enter">进入工作台 ›</text>
			</view>
		</view>
	</view>
</template>

<script>
import { db, requireLogin } from '@/utils/store.js'
import { api } from '@/utils/request.js'
import { parseMyProjectList, weighRolesInProject, isBlockPending } from '@/utils/api-util.js'

export default {
	data() { return { list: [], loading: true } },
	onShow() {
		if (!requireLogin()) return
		this.load()
	},
	methods: {
		async load() {
			const u = db.currentUser()
			if (!u || !u.phone) return
			this.loading = true
			try {
				const res = await api.myProjects()
				const rows = parseMyProjectList(res)
				const items = []
				for (const p of rows) {
					for (const role of weighRolesInProject(p, u)) {
						items.push(await this.buildItem(p, role))
					}
				}
				this.list = items
			} catch (e) {
				this.list = this.loadLocal(u)
			} finally {
				this.loading = false
			}
		},
		async buildItem(p, role) {
			let pending = 0
			let done = 0
			const status = role === 'ship' ? p.shipperStatus : p.receiverStatus
			try {
				const info = await api.projectInfo(p.id)
				const row = info && (info.row || info)
				const block = role === 'ship' ? row && row.hair : row && row.receive
				if (block && (block.number || block.net || block['净重'])) {
					if (isBlockPending(block)) pending = 1
					else done = 1
				} else if (status === 1 || status === '1') {
					done = 1
				} else if (status === 0 || status === '0') {
					pending = 1
				}
			} catch (e) {
				if (status === 1 || status === '1') done = 1
				else if (status === 0 || status === '0') pending = 1
			}
			return {
				key: p.id + '-' + role,
				projectId: p.id,
				name: p.name,
				role,
				pending,
				done
			}
		},
		loadLocal(u) {
			const apps = db.allApps().filter(a => a.userId === u.id && a.status === 'approved')
			return apps.map(a => {
				const project = db.getProject(a.projectId)
				if (!project) return null
				return {
					key: a.id,
					projectId: project.remoteId || String(project.no).replace(/^P/, ''),
					name: project.name,
					role: a.role,
					pending: 0,
					done: 0
				}
			}).filter(Boolean)
		},
		enter(x) {
			uni.navigateTo({ url: `/pages/join/joinedDetail?pid=${x.projectId}&role=${x.role}` })
		}
	}
}
</script>

<style lang="scss">
.page { padding: 24rpx; }
.empty { text-align:center; color:#999; padding: 80rpx 0; font-size: 26rpx; }
.card { background:#fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.head { display:flex; align-items:center; }
.name { flex:1; font-size: 30rpx; font-weight: 700; color:#111; }
.role { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 999px; }
.role.ship { background:#ECFDF5; color:#16A34A; }
.role.recv { background:#DBEAFE; color:#2563EB; }
.no { color:#16A34A; font-size: 24rpx; margin-top: 8rpx; display:block; }
.meta { display:flex; gap: 24rpx; color:#666; font-size: 24rpx; margin-top: 16rpx; }
.enter { margin-left:auto; color:#16A34A; }
</style>
